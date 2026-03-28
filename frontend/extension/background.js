// extension/background.js

// 安裝/更新時：僅建立一個右鍵選單「開啟 PDF 閱讀器」
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "open-pdf-reader",
      title: "開啟 PDF 閱讀器",
      contexts: ["all"], // 也可改成 ["page","frame"] 只在頁面上顯示
    });
  });
});

// 點選右鍵選單：開啟擴充套件內的 PDF 閱讀器頁面
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-pdf-reader") {
    // 依你的實際檔名調整：pdf.html / pdf-viewer.html / index.html#pdf
    chrome.tabs.create({ url: chrome.runtime.getURL("pdf.html") });
  }
});

// （保留）接收 content script 要求開啟語意圖譜頁籤
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_GRAPH_TAB" && message.text) {
    const url = chrome.runtime.getURL(
      `index.html?text=${encodeURIComponent(message.text)}`
    );
    chrome.tabs.create({ url });
  }
});
