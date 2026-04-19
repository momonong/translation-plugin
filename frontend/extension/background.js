// extension/background.js

// 統一的 API_BASE_URL
const API_BASE_URL = "https://cball.computing.ncku.edu.tw/lexilight";

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
    let targetUrl = message.url;
    
    // 補齊不完整的 URL 或替換掉舊的 localhost
    if (targetUrl.includes("http://localhost:8000")) {
      targetUrl = targetUrl.replace("http://localhost:8000", API_BASE_URL);
    } else if (targetUrl.startsWith("/")) {
      targetUrl = API_BASE_URL + targetUrl;
    } else if (!targetUrl.startsWith("http")) {
      targetUrl = API_BASE_URL + "/" + targetUrl;
    }
    
    // 避免重複的 /lexilight/lexilight
    if (targetUrl.includes("/lexilight/lexilight")) {
      targetUrl = targetUrl.replace("/lexilight/lexilight", "/lexilight");
    }

    console.log("[PROXY_FETCH] Original URL:", message.url);
    console.log("[PROXY_FETCH] Target URL:", targetUrl);
    console.log("[PROXY_FETCH] Method:", message.options?.method || 'GET');
    
    // 執行實際的 API 請求
    fetch(targetUrl, message.options)
      .then(async (res) => {
        const raw = await res.text();
        let data = {};
        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch (e) {
            console.error("[PROXY_FETCH] Non-JSON response:", raw.slice(0, 300));
            return sendResponse({ error: `Non-JSON response (HTTP ${res.status}): ${raw.slice(0, 300)}` });
          }
        }
        if (!res.ok) {
          const msg = (data && (data.detail || data.message)) || raw || (`HTTP ${res.status}`);
          console.error(`[PROXY_FETCH] HTTP Error ${res.status}:`, msg);
          return sendResponse({ error: `HTTP ${res.status}: ${msg}` });
        }
        console.log("[PROXY_FETCH] Success!");
        sendResponse({ data: data });
      })
      .catch((error) => {
        console.error("[PROXY_FETCH] Network Error:", error);
        sendResponse({ error: error.message || String(error) });
      });
      
    // 回傳 true 表示 sendResponse 會非同步執行
    return true;
  }
});
