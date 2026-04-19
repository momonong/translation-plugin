// extension/background.js

// 統一的 API_BASE_URL，所有透過 background 代理的請求都會使用這個 base
const API_BASE_URL = "https://cball.computing.ncku.edu.tw";

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

// 接收 content script 要求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_GRAPH_TAB" && message.text) {
    const url = chrome.runtime.getURL(
      `index.html?text=${encodeURIComponent(message.text)}`
    );
    chrome.tabs.create({ url });
    return false; // 不需要異步回應
  }
  
  if (message.type === "PROXY_FETCH") {
    // 確保 URL 是以我們統一的 API_BASE_URL 開頭，避免 content script 帶舊的 localhost
    const API_BASE_URL = "https://cball.computing.ncku.edu.tw/lexilight";
    
    let targetUrl = message.url;
    if (targetUrl.includes("http://localhost:8000")) {
      targetUrl = targetUrl.replace("http://localhost:8000", API_BASE_URL);
    } else if (!targetUrl.startsWith("http")) {
      // 處理相對路徑
      targetUrl = API_BASE_URL + (targetUrl.startsWith("/") ? "" : "/") + targetUrl;
    }
    
    // 執行實際的 API 請求
    fetch(targetUrl, message.options)
      .then(async (res) => {
        const raw = await res.text();
        let data = {};
        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch (e) {
            return sendResponse({ error: `Non-JSON response (HTTP ${res.status}): ${raw.slice(0, 300)}` });
          }
        }
        if (!res.ok) {
          const msg = (data && (data.detail || data.message)) || raw || (`HTTP ${res.status}`);
          return sendResponse({ error: `HTTP ${res.status}: ${msg}` });
        }
        sendResponse({ data: data });
      })
      .catch((error) => {
        sendResponse({ error: error.message || String(error) });
      });
      
    // 回傳 true 表示 sendResponse 會非同步執行
    return true;
  }
});
