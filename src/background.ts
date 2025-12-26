chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Failed to set side panel behavior:", error));

// Content Scriptを再注入するメッセージハンドラー
chrome.runtime.onMessage.addListener(
  (message: { type: string; tabId?: number }, _sender, sendResponse) => {
    if (message.type === "INJECT_CONTENT_SCRIPT" && typeof message.tabId === "number") {
      const tabId = message.tabId;
      chrome.scripting
        .executeScript({
          target: { tabId },
          files: ["content.js"],
        })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }
  },
);
