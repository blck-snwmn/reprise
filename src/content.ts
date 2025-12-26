import type {
  Message,
  VideoInfoResponse,
  LoopsResponse,
  CurrentTimeResponse,
  LoopOperationResponse,
} from "./types";
import {
  getVideoConfig,
  getActiveLoop,
  addLoop,
  updateLoop,
  deleteLoop,
  setActiveLoop,
} from "./storage";

type ResponseType =
  | VideoInfoResponse
  | LoopsResponse
  | CurrentTimeResponse
  | LoopOperationResponse;

let video: HTMLVideoElement | null = null;
let startTime = 0;
let endTime = 0;
let enabled = false;
let lastVideoId: string | null = null;
let activeLoopId: string | null = null;

function getVideoId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("v");
}

function getVideoTitle(): string | null {
  const titleElement = document.querySelector(
    "h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string"
  );
  return titleElement?.textContent ?? null;
}

function findVideo(): HTMLVideoElement | null {
  return document.querySelector("video.html5-main-video");
}

function handleTimeUpdate() {
  if (!enabled || !video) return;
  // ループ範囲外なら開始位置に戻す
  if (video.currentTime < startTime || video.currentTime >= endTime) {
    video.currentTime = startTime;
  }
}

function resetState() {
  startTime = 0;
  endTime = 0;
  enabled = false;
  activeLoopId = null;
}

async function restoreLoopState(videoId: string) {
  const loop = await getActiveLoop(videoId);
  if (loop) {
    startTime = loop.startTime;
    endTime = loop.endTime;
    enabled = true;
    activeLoopId = loop.id;
    // 開始位置へ移動
    if (video) {
      video.currentTime = startTime;
    }
  } else {
    resetState();
  }
}

async function checkVideoChange() {
  const currentVideoId = getVideoId();
  if (currentVideoId !== lastVideoId) {
    lastVideoId = currentVideoId;
    if (currentVideoId) {
      await restoreLoopState(currentVideoId);
    } else {
      resetState();
    }
    video = findVideo();
  }
}

async function init() {
  video = findVideo();
  if (video) {
    video.addEventListener("timeupdate", handleTimeUpdate);
  }

  const videoId = getVideoId();
  if (videoId) {
    lastVideoId = videoId;
    await restoreLoopState(videoId);
  }

  const observer = new MutationObserver(() => {
    checkVideoChange();
    if (!video) {
      video = findVideo();
      if (video) {
        video.addEventListener("timeupdate", handleTimeUpdate);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: ResponseType) => void) => {
    if (!video) {
      video = findVideo();
    }

    const videoId = getVideoId();

    const handleMessage = async (): Promise<ResponseType> => {
      switch (message.type) {
        case "GET_VIDEO_INFO":
          return {
            videoId,
            videoTitle: getVideoTitle(),
            duration: video?.duration ?? 0,
            currentTime: video?.currentTime ?? 0,
          } as VideoInfoResponse;

        case "GET_CURRENT_TIME":
          return {
            currentTime: video?.currentTime ?? 0,
          } as CurrentTimeResponse;

        case "GET_LOOPS": {
          if (!videoId) {
            return { videoId: null, loops: [], activeLoopId: null } as LoopsResponse;
          }
          const config = await getVideoConfig(videoId);
          return {
            videoId,
            loops: config?.loops ?? [],
            activeLoopId: config?.activeLoopId ?? null,
          } as LoopsResponse;
        }

        case "ADD_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } as LoopOperationResponse;
          }
          const newLoop = await addLoop(videoId, message.loop, getVideoTitle() ?? undefined);
          return { success: true, loop: newLoop } as LoopOperationResponse;
        }

        case "UPDATE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } as LoopOperationResponse;
          }
          await updateLoop(videoId, message.loop);
          if (activeLoopId === message.loop.id) {
            startTime = message.loop.startTime;
            endTime = message.loop.endTime;
            // 範囲外なら開始位置へ移動
            if (video && (video.currentTime < startTime || video.currentTime >= endTime)) {
              video.currentTime = startTime;
            }
          }
          return { success: true, loop: message.loop } as LoopOperationResponse;
        }

        case "DELETE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } as LoopOperationResponse;
          }
          await deleteLoop(videoId, message.loopId);
          if (activeLoopId === message.loopId) {
            resetState();
          }
          return { success: true } as LoopOperationResponse;
        }

        case "ACTIVATE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } as LoopOperationResponse;
          }
          const loop = await setActiveLoop(videoId, message.loopId);
          if (loop) {
            startTime = loop.startTime;
            endTime = loop.endTime;
            enabled = true;
            activeLoopId = loop.id;
            // 開始位置へ移動
            if (video) {
              video.currentTime = startTime;
            }
          } else {
            resetState();
          }
          return { success: true, loop: loop ?? undefined } as LoopOperationResponse;
        }

        case "SEEK_TO_LOOP_START": {
          if (enabled && video && activeLoopId) {
            video.currentTime = startTime;
          }
          return { success: true };
        }
      }
    };

    handleMessage().then(sendResponse);
    return true;
  }
);

init();
