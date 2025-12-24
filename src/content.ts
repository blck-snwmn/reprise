import type { Message, StateResponse } from "./types";

let video: HTMLVideoElement | null = null;
let startTime = 0;
let endTime = 0;
let enabled = false;
let lastVideoId: string | null = null;

function getVideoId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("v");
}

function findVideo(): HTMLVideoElement | null {
  return document.querySelector("video.html5-main-video");
}

function handleTimeUpdate() {
  if (!enabled || !video) return;
  if (video.currentTime >= endTime) {
    video.currentTime = startTime;
  }
}

function resetState() {
  startTime = 0;
  endTime = 0;
  enabled = false;
}

function checkVideoChange() {
  const currentVideoId = getVideoId();
  if (currentVideoId !== lastVideoId) {
    lastVideoId = currentVideoId;
    resetState();
    video = findVideo();
  }
}

function init() {
  video = findVideo();
  if (video) {
    video.addEventListener("timeupdate", handleTimeUpdate);
  }

  // Watch for YouTube SPA navigation
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

// Message handler
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: StateResponse) => void) => {
    if (!video) {
      video = findVideo();
    }

    switch (message.type) {
      case "GET_STATE":
        sendResponse({
          duration: video?.duration ?? 0,
          start: startTime,
          end: endTime,
          enabled,
        });
        break;
      case "SET_LOOP":
        startTime = message.start;
        endTime = message.end;
        break;
      case "SET_ENABLED":
        enabled = message.enabled;
        break;
    }

    return true;
  }
);

init();
