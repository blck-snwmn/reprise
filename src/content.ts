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

type ResponseType = VideoInfoResponse | LoopsResponse | CurrentTimeResponse | LoopOperationResponse;

let video: HTMLVideoElement | null = null;
let startTime = 0;
let endTime = 0;
let enabled = false;
let lastVideoId: string | null = null;
let activeLoopSettingId: string | null = null;

function getVideoId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("v");
}

function getVideoTitle(): string | null {
  const titleElement = document.querySelector(
    "h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string",
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
  activeLoopSettingId = null;
}

function setVideo(newVideo: HTMLVideoElement | null) {
  if (video === newVideo) return;

  // Remove listener from old video to prevent memory leaks
  if (video) {
    video.removeEventListener("timeupdate", handleTimeUpdate);
  }

  video = newVideo;

  // Add listener to new video
  if (video) {
    video.addEventListener("timeupdate", handleTimeUpdate);
  }
}

async function restoreLoopState(videoId: string) {
  const config = await getVideoConfig(videoId);
  const track = await getActiveLoop(videoId);
  if (track && config?.activeLoopSettingId) {
    startTime = track.startTime;
    endTime = track.endTime;
    enabled = true;
    activeLoopSettingId = config.activeLoopSettingId;
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
    setVideo(findVideo());

    // Side Panel に動画変更を通知（リスナーがいない場合は無視）
    try {
      await chrome.runtime.sendMessage({ type: "VIDEO_CHANGED", videoId: currentVideoId });
    } catch {
      // Side Panel が開いていない場合は無視
    }
  }
}

async function init() {
  setVideo(findVideo());

  const videoId = getVideoId();
  if (videoId) {
    lastVideoId = videoId;
    await restoreLoopState(videoId);
  }

  const observer = new MutationObserver(() => {
    void checkVideoChange();
    // Always try to find video - setVideo handles deduplication
    setVideo(findVideo());
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: ResponseType) => void) => {
    // Always get the latest video element (DOM may have been rebuilt while tab was inactive)
    setVideo(findVideo());

    const videoId = getVideoId();

    const handleMessage = async (): Promise<ResponseType> => {
      switch (message.type) {
        case "GET_VIDEO_INFO":
          return {
            videoId,
            videoTitle: getVideoTitle(),
            duration: video?.duration ?? 0,
            currentTime: video?.currentTime ?? 0,
          } satisfies VideoInfoResponse;

        case "GET_CURRENT_TIME":
          return {
            currentTime: video?.currentTime ?? 0,
          } satisfies CurrentTimeResponse;

        case "GET_LOOPS": {
          if (!videoId) {
            return {
              videoId: null,
              tracks: [],
              loopSettings: [],
              activeLoopSettingId: null,
            } satisfies LoopsResponse;
          }
          const config = await getVideoConfig(videoId);
          return {
            videoId,
            tracks: config?.tracks ?? [],
            loopSettings: config?.loopSettings ?? [],
            activeLoopSettingId: config?.activeLoopSettingId ?? null,
          } satisfies LoopsResponse;
        }

        case "ADD_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } satisfies LoopOperationResponse;
          }
          const { track: newTrack, loopSetting: newLoopSetting } = await addLoop(
            videoId,
            message.track,
            getVideoTitle() ?? undefined,
          );
          return {
            success: true,
            track: newTrack,
            loopSetting: newLoopSetting,
          } satisfies LoopOperationResponse;
        }

        case "UPDATE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } satisfies LoopOperationResponse;
          }
          await updateLoop(videoId, message.track);
          // Check if the updated track is the one currently being looped
          const config = await getVideoConfig(videoId);
          if (config && activeLoopSettingId) {
            const activeSetting = config.loopSettings.find((ls) => ls.id === activeLoopSettingId);
            if (activeSetting && activeSetting.trackId === message.track.id) {
              startTime = message.track.startTime;
              endTime = message.track.endTime;
              // 範囲外なら開始位置へ移動
              if (video && (video.currentTime < startTime || video.currentTime >= endTime)) {
                video.currentTime = startTime;
              }
            }
          }
          return { success: true, track: message.track } satisfies LoopOperationResponse;
        }

        case "DELETE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } satisfies LoopOperationResponse;
          }
          // Check if the track being deleted is the one currently being looped
          const configBeforeDelete = await getVideoConfig(videoId);
          let shouldReset = false;
          if (configBeforeDelete && activeLoopSettingId) {
            const activeSetting = configBeforeDelete.loopSettings.find(
              (ls) => ls.id === activeLoopSettingId,
            );
            if (activeSetting && activeSetting.trackId === message.trackId) {
              shouldReset = true;
            }
          }
          await deleteLoop(videoId, message.trackId);
          if (shouldReset) {
            resetState();
          }
          return { success: true } satisfies LoopOperationResponse;
        }

        case "ACTIVATE_LOOP": {
          if (!videoId) {
            return { success: false, error: "No video" } satisfies LoopOperationResponse;
          }
          const track = await setActiveLoop(videoId, message.loopSettingId);
          if (track && message.loopSettingId) {
            startTime = track.startTime;
            endTime = track.endTime;
            enabled = true;
            activeLoopSettingId = message.loopSettingId;
            // 開始位置へ移動
            if (video) {
              video.currentTime = startTime;
            }
          } else {
            resetState();
          }
          return { success: true, track: track ?? undefined } satisfies LoopOperationResponse;
        }

        case "SEEK_TO_LOOP_START": {
          if (enabled && video && activeLoopSettingId) {
            video.currentTime = startTime;
          }
          return { success: true };
        }

        default:
          return { success: false, error: "Unknown message type" };
      }
    };

    handleMessage()
      .then(sendResponse)
      .catch(() => sendResponse({ success: false, error: "Internal error" }));
    return true;
  },
);

void init();
