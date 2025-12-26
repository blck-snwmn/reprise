import type { Message } from "./types";

export function parseTime(timeStr: string): number {
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    const min = parts[0];
    const sec = parts[1];
    if (min === undefined || sec === undefined || isNaN(min) || isNaN(sec))
      return NaN;
    return min * 60 + sec;
  } else if (parts.length === 3) {
    const hour = parts[0];
    const min = parts[1];
    const sec = parts[2];
    if (
      hour === undefined ||
      min === undefined ||
      sec === undefined ||
      isNaN(hour) ||
      isNaN(min) ||
      isNaN(sec)
    )
      return NaN;
    return hour * 3600 + min * 60 + sec;
  }
  return NaN;
}

export function formatTime(seconds: number): string {
  const hour = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  if (hour > 0) {
    return `${hour}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export async function sendMessage<T>(message: Message): Promise<T | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return undefined;

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Content Scriptが応答しない場合、再注入を試みる
    const injectResult = await chrome.runtime.sendMessage({
      type: "INJECT_CONTENT_SCRIPT",
      tabId: tab.id,
    });
    if (injectResult?.success) {
      // 少し待ってからリトライ
      await new Promise((resolve) => setTimeout(resolve, 100));
      return chrome.tabs.sendMessage(tab.id, message);
    }
    return undefined;
  }
}
