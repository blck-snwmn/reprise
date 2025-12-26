chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Failed to set side panel behavior:", error));

// Content Scriptを再注入するメッセージハンドラー
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "INJECT_CONTENT_SCRIPT") {
    const tabId = message.tabId as number;
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content.js"],
      })
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: String(error) }));
    return true;
  }
});
