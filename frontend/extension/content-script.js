// ====== 版本標示（確認載入的是最新檔）======
console.log("[OCR] content-script build v2025-08-16-3");

// ====== 基本設定 ======
const API_BASE_URL = window.API_BASE_URL || "http://localhost:8000";
const DEBUG_SHOW_SENTENCE = false; // 正式版建議 false
const OS_IS_MAC = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

// ====== 安全/轉義 ======
function sanitizeHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const allowed = new Set(["B","BR","UL","LI"]);
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (!allowed.has(el.tagName)) toRemove.push(el);
    if (el.tagName === "B") el.setAttribute("style", "font-weight:bold");
    for (const attr of [].slice.call(el.attributes)) {
      if (el.tagName === "B" && attr.name === "style") continue;
      el.removeAttribute(attr.name);
    }
  }
  for (let i = 0; i < toRemove.length; i++) {
    const el = toRemove[i];
    const span = document.createElement('span');
    span.textContent = el.textContent || '';
    el.replaceWith(span);
  }
  return tpl.innerHTML;
}
function escapeHtml(s) {
  s = s == null ? "" : String(s);
  return s.replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

// ====== 文字情境 ======

// 獲取選取文字周圍的擴展上下文（前後各 1-2 個字）
function getExtendedSelectionText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  if (!selectedText) return null;
  
  try {
    // 擴展範圍來獲取前後文字
    const extendedRange = range.cloneRange();
    
    // 向前擴展 - 嘗試獲取前面 2-3 個單字
    let startContainer = range.startContainer;
    let startOffset = range.startOffset;
    
    // 如果在文本節點中，嘗試向前取更多文字
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const beforeText = startContainer.textContent.substring(0, startOffset);
      const words = beforeText.trim().split(/\s+/);
      if (words.length > 1) {
        // 取前面 1-2 個完整單字
        const wordsToTake = Math.min(2, words.length - 1);
        const beforeWords = words.slice(-wordsToTake);
        const beforeLength = beforeWords.join(' ').length + 1; // +1 for space
        const newStartOffset = Math.max(0, startOffset - beforeLength);
        extendedRange.setStart(startContainer, newStartOffset);
      }
    }
    
    // 向後擴展 - 嘗試獲取後面 2-3 個單字  
    let endContainer = range.endContainer;
    let endOffset = range.endOffset;
    
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const afterText = endContainer.textContent.substring(endOffset);
      const words = afterText.trim().split(/\s+/);
      if (words.length > 0) {
        // 取後面 1-2 個完整單字
        const wordsToTake = Math.min(2, words.length);
        const afterWords = words.slice(0, wordsToTake);
        const afterLength = afterWords.join(' ').length;
        if (afterLength > 0) {
          const newEndOffset = Math.min(endContainer.textContent.length, endOffset + afterLength + 1); // +1 for space
          extendedRange.setEnd(endContainer, newEndOffset);
        }
      }
    }
    
    const extendedText = extendedRange.toString().replace(/\s+/g, ' ').trim();
    
    return {
      selected: selectedText,
      extended: extendedText || selectedText
    };
  } catch (error) {
    return {
      selected: selectedText,
      extended: selectedText
    };
  }
}

function getSentenceContext() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  
  const selectionInfo = getExtendedSelectionText();
  if (!selectionInfo) return "";
  
  const range = selection.getRangeAt(0);
  let node = range.startContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
  if (!node || typeof node.innerText !== 'string') return "";
  
  const fullText = (node.innerText || node.textContent).replace(/\s+/g, ' ');
  const sentences = fullText.match(/[^.!?。！？]+[.!?。！？]?/g) || [fullText];
  
  // 使用擴展的文字片段來找到正確的句子
  const searchText = selectionInfo.extended;
  let context = sentences.find(function(s){ return s.includes(searchText); });
  
  // 如果擴展片段沒找到，退回到原始選取文字
  if (!context) {
    context = sentences.find(function(s){ return s.includes(selectionInfo.selected); });
  }
  
  return (context || selectionInfo.selected).trim();
}

// ====== 浮窗：翻譯用骨架 ======
function removeFloat() {
  const oldFloat = document.getElementById('mini-translate-float');
  if (oldFloat) oldFloat.remove();
  document.removeEventListener('mousedown', handleOutsideClick, true);
}
function handleOutsideClick(e) {
  const float = document.getElementById('mini-translate-float');
  if (float && !float.contains(e.target)) removeFloat();
}
function showFloatSkeleton(selected, left, top, context) {
  removeFloat();
  const div = document.createElement('div');
  div.id = 'mini-translate-float';
  
  // 固定淺色主題（確保在任何網頁背景下都清楚可見）
  div.style.cssText = [
    "position:absolute",
    "z-index:2147483647",
    "top:" + (top + 6) + "px",
    "left:" + left + "px",
    "background:#fff",
    "color:#000",
    "border:1.5px solid #d7d7d7",
    "border-radius:10px",
    "box-shadow:0 2px 12px 1px rgba(0,0,0,0.15)",
    "padding:14px 18px",
    "min-width:210px",
    "max-width:360px",
    "font-size:15px",
    "line-height:1.5",
    "transition:box-shadow 0.1s",
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    "word-break:break-word"
  ].join(";");
  const sentenceRow = DEBUG_SHOW_SENTENCE
    ? "<b>所在句：</b><span style=\"color:#1e7efb\">" + escapeHtml(context) + "</span><br>"
    : "";
  div.innerHTML = [
    "<b>選字：</b><span style=\"color:#1e7efb\">", escapeHtml(selected), "</span><br>",
    sentenceRow,
    "<span style=\"color:#999;\">查詢中...</span>"
  ].join("");
  document.body.appendChild(div);
  setTimeout(function(){ document.addEventListener('mousedown', handleOutsideClick, true); }, 10);
  return div;
}

// ====== 只顯示 OCR 結果的小浮窗（不做翻譯） ======
function showOcrFloat(text, left, top) {
  const id = "ocr-only-float";
  const old = document.getElementById(id);
  if (old) old.remove();

  // 🟢 清理 OCR 文字
  let cleanText = (text || "")
    .replace(/\n{2,}/g, "\n\n")  // 兩個以上換行保留段落
    .replace(/\s*\n\s*/g, " ");  // 單一換行 → 空格

  // 固定淺色主題
  const div = document.createElement("div");
  div.id = id;
  Object.assign(div.style, {
    position: "fixed",
    zIndex: "2147483647",
    top: `${top}px`,
    left: `${left}px`,
    background: "#fff",
    color: "#000",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    padding: "12px 14px",
    maxWidth: "420px",
    maxHeight: "40vh",
    overflow: "auto",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fontSize: "14px",
    lineHeight: "1.5",
    userSelect: "text",
    WebkitUserSelect: "text",
    cursor: "text"
  });

  function esc(s){ 
    s = s == null ? "" : String(s); 
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); 
  }

  div.innerHTML = `
    <div style="font-weight:bold;margin-bottom:6px;">文字辨識結果</div>
    <div style="white-space:pre-wrap;">${esc(cleanText || "（無辨識結果）")}</div>
  `;

  document.body.appendChild(div);

  // --- 智慧定位（避免超出視窗） ---
  const pad = 12;
  const r = div.getBoundingClientRect();
  let newLeft = left, newTop = top;
  if (r.right > window.innerWidth - pad)  newLeft = Math.max(pad, window.innerWidth - r.width - pad);
  if (r.bottom > window.innerHeight - pad) newTop  = Math.max(pad, window.innerHeight - r.height - pad);
  if (newLeft < pad) newLeft = pad;
  if (newTop  < pad) newTop  = pad;
  div.style.left = `${newLeft}px`;
  div.style.top  = `${newTop}px`;

  // --- 點擊外部或 Esc 關閉 ---
  function handleOutsideClick(e) {
    if (!div.contains(e.target)) {
      div.remove();
      document.removeEventListener("mousedown", handleOutsideClick, true);
      document.removeEventListener("keydown", handleEsc, true);
    }
  }
  function handleEsc(e) {
    if (e.key === "Escape") {
      div.remove();
      document.removeEventListener("mousedown", handleOutsideClick, true);
      document.removeEventListener("keydown", handleEsc, true);
    }
  }

  setTimeout(() => {
    document.addEventListener("mousedown", handleOutsideClick, true);
    document.addEventListener("keydown", handleEsc, true);
  }, 10);

  console.log("[OCR] float mounted at", { left: newLeft, top: newTop, w: r.width, h: r.height });
}


// ====== 穩定 fetch：帶逾時、HTTP狀態與非JSON錯誤訊息 ======
// [Refactored for MV3] 將原本直接打跨網域 API 的行為，改為透過 background service worker 代理
async function fetchJSON(url, opts, ms) {
  opts = opts || {};
  ms = ms || 10000;
  
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: "PROXY_FETCH",
      url: url, // 會交由 background 判斷是否需要加上 API_BASE_URL
      options: {
        method: opts.method || 'GET',
        headers: opts.headers,
        body: opts.body
      },
      timeout: ms
    }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error("Extension Error: " + chrome.runtime.lastError.message));
      }
      if (!response) {
        return reject(new Error("No response from background script."));
      }
      if (response.error) {
        return reject(new Error(response.error));
      }
      resolve(response.data);
    });
  });
}

// ====== 顯示翻譯浮窗（雙擊選字時用）======
async function showTranslateFloat(selected, left, top, context) {
  const div = showFloatSkeleton(selected, left, top, context);
  
  try {
    const res = await fetchJSON(API_BASE_URL + "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selected, context: context })
    }, 15000);

    const target = (res && res.normalized_target) || selected;
    const posEn  = (res && res.normalized_pos) || "unknown";
    const posZhMap = { noun:"名詞", verb:"動詞", adj:"形容詞", adv:"副詞", det:"限定詞", pron:"代名詞", num:"數詞", phrase:"片語", unknown:"" };
    const posZh = posZhMap[posEn] || "";
    const posSuffix = posZh ? "（" + posZh + "）" : "";

    let content = "";
    if (typeof res === "string") content = res;
    else if (res && res.result) content = res.result;
    else if (res && res.text) content = res.text;
    else if (res && res.translated) content = res.translated;
    else content = "<span style='color:#d32f2f'>查無翻譯</span>";
    const safe = sanitizeHtml(String(content || ""));

    const sentenceRow = DEBUG_SHOW_SENTENCE
      ? "<b>所在句：</b><span style=\"color:#1e7efb\">" + escapeHtml(context) + "</span><br>"
      : "";
    div.innerHTML = [
      "<b>選字：</b><span style=\"color:#1e7efb\">", escapeHtml(target), "</span>", posSuffix, "<br>",
      sentenceRow,
      "<div style=\"margin:8px 0 0 0;font-size:15px;line-height:1.6;white-space:normal;\">", safe, "</div>",
      '<div style="display:flex;justify-content:flex-end;align-items:center;margin-top:8px;">',
        '<button id="show-kg-btn" style="font-size:15px;background:linear-gradient(90deg,#257cff 40%,#0dcaf0 100%);color:#fff;border-radius:6px;border:none;padding:6px 16px;cursor:pointer;font-weight:600;box-shadow:0 1px 8px #257cff22;transition:background 0.2s;">查語意圖譜</button>',
        '<a href="#" id="close-mini-translate" style="color:#666;margin-left:10px;font-size:15px;text-decoration:none;">關閉</a>',
      "</div>"
    ].join("");

    const closeLink = div.querySelector("#close-mini-translate");
    if (closeLink) closeLink.onclick = function(e){ e.preventDefault(); removeFloat(); };
    const btn = div.querySelector("#show-kg-btn");
    if (btn) {
      btn.onmouseover = function(){ btn.style.background = "linear-gradient(90deg,#1e60c9 40%,#0da5c0 100%)"; };
      btn.onmouseout  = function(){ btn.style.background = "linear-gradient(90deg,#257cff 40%,#0dcaf0 100%)"; };
      btn.onclick     = function(){
        try { chrome.runtime.sendMessage({ type: "OPEN_GRAPH_TAB", text: context }); } catch(e){}
        removeFloat();
      };
    }
  } catch (error) {
    console.error("翻譯 API 請求失敗:", error);
    const msg = String(error).indexOf("timeout") >= 0 ? "⏱️ 逾時，請重試或重新整理頁面並再次選字" : "❌ 取得翻譯失敗";
    const sentenceRow = DEBUG_SHOW_SENTENCE
      ? "<b>所在句：</b><span style=\"color:#1e7efb\">" + escapeHtml(context) + "</span><br>"
      : "";
    div.innerHTML = [
      "<b>選字：</b><span style=\"color:#1e7efb\">", escapeHtml(selected), "</span><br>",
      sentenceRow,
      "<div style=\"color:#d32f2f;margin-top:8px;\">", msg, "</div>",
      '<div style="display:flex;justify-content:flex-end;margin-top:8px;">',
        '<a href="#" id="close-mini-translate" style="color:#666;font-size:15px;text-decoration:none;">關閉</a>',
      "</div>"
    ].join("");
    const close = div.querySelector("#close-mini-translate");
    if (close) close.onclick = function(e){ e.preventDefault(); removeFloat(); };
  }
}

// ====== 事件掛載（雙擊選字＆背景呼叫＋框選OCR）======
if (typeof window.contentScriptLoaded === 'undefined') {
  window.contentScriptLoaded = true;

  // 雙擊選字 → 翻譯泡泡
  document.addEventListener("dblclick", function (e) {
    const selection = window.getSelection();
    const selected = selection ? selection.toString().trim() : "";
    if (selected) {
      let rect = null;
      if (selection && selection.rangeCount > 0) rect = selection.getRangeAt(0).getBoundingClientRect();
      const top  = rect ? rect.bottom + window.scrollY : e.clientY + window.scrollY;
      const left = rect ? rect.left   + window.scrollX : e.clientX  + window.scrollX;
      const context = getSentenceContext();
      showTranslateFloat(selected, left, top, context);
    }
  });

  // 背景觸發（保留）
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg && msg.type === "SHOW_TRANSLATE_FLOAT" && msg.text) {
      const sel = window.getSelection();
      let rect = null;
      if (sel && sel.rangeCount > 0) rect = sel.getRangeAt(0).getBoundingClientRect();
      const top  = rect ? (rect.bottom + window.scrollY) : (window.innerHeight / 2 + window.scrollY);
      const left = rect ? (rect.left   + window.scrollX) : (window.innerWidth  / 2 + window.scrollX);
      const context = getSentenceContext();
      showTranslateFloat(msg.text, left, top, context);
      if (typeof sendResponse === "function") sendResponse({ status: "ok" });
    }
    return true;
  });

  // ====== 框選模式：Option/Alt 或 Command(⌘) 拖曳；Alt+S 切換常駐模式 ======
  let __holdModifier = false;     // 目前是否按住 Alt/Option 或（Mac）Meta
  let __stickyMode = false;       // Alt+S 切換常駐模式
  let __overlay, __box, __startX = 0, __startY = 0;

  function log(){ try{ console.log.apply(console, ["[OCR]"].concat([].slice.call(arguments))); }catch(e){} }

  function showHUD(text) {
    let hud = document.getElementById("__ocr_hud__");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "__ocr_hud__";
      
      // 固定深色 HUD（在任何背景下都清楚）
      Object.assign(hud.style, {
        position: "fixed", top: "12px", right: "12px",
        zIndex: "2147483647", padding: "6px 10px",
        background: "#333", color: "#fff", borderRadius: "8px",
        font: "12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial",
        opacity: "0.9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      });
      document.body.appendChild(hud);
    }
    hud.textContent = text;
    clearTimeout(hud._t);
    hud._t = setTimeout(function(){ hud.remove(); }, 1800);
  }

  function ensureOverlay() {
    if (__overlay) return;
    __overlay = document.createElement("div");
    __overlay.id = "__ocr_overlay__";
    Object.assign(__overlay.style, {
      position: "fixed", inset: "0",
      zIndex: "2147483647", background: "rgba(0,0,0,0.12)",
      cursor: "crosshair", pointerEvents: "auto"
    });
    __box = document.createElement("div");
    Object.assign(__box.style, {
      position: "absolute",
      border: "2px dashed #1976d2",
      background: "rgba(25,118,210,0.2)",
      left: "0", top: "0", width: "0", height: "0",
      pointerEvents: "none"
    });
    __overlay.appendChild(__box);
  }

  function removeOverlay(){
    const ov = document.getElementById("__ocr_overlay__");
    if (ov) ov.remove();
    __overlay = null; __box = null;
  }

  function shouldStartFromEvent(e){
    const held = e.altKey || (OS_IS_MAC && e.metaKey) || __holdModifier;
    return held || __stickyMode;
  }

  // ---- 熱鍵：按住/放開；以及 Alt+S 切換 sticky ----
  window.addEventListener("keydown", function(e){
    if (e.key === "Alt" || (OS_IS_MAC && e.key === "Meta")) {
      __holdModifier = true; log("modifier down");
    }
    if (String(e.key).toLowerCase() === "s" && e.altKey) {
      __stickyMode = !__stickyMode;
      showHUD(__stickyMode ? "框選模式：開啟" : "框選模式：關閉");
      log("toggle sticky =", __stickyMode);
    }
    if (e.key === "Escape") {
      __stickyMode = false; __holdModifier = false;
      removeOverlay(); log("ESC -> cancel");
    }
  }, true);

  window.addEventListener("keyup", function(e){
    if (e.key === "Alt" || (OS_IS_MAC && e.key === "Meta")) {
      __holdModifier = false; log("modifier up");
    }
  }, true);

  window.addEventListener("blur", function(){
    __holdModifier = false;
    removeOverlay(); log("window blur -> reset");
  }, true);

  // ---- 同時監聽 pointer 與 mouse（用 capture 抢先拿事件）----
  function onStart(e){
    log("down event:", e.type);
    if (!shouldStartFromEvent(e)) return;

    e.preventDefault(); e.stopPropagation();
    ensureOverlay();
    __startX = e.clientX; __startY = e.clientY;
    __box.style.left = __startX + "px";
    __box.style.top  = __startY + "px";
    __box.style.width = "0px";
    __box.style.height= "0px";
    document.body.appendChild(__overlay);
  }

  function onMove(e){
    if (!__overlay || !__box) return;
    const w = e.clientX - __startX;
    const h = e.clientY - __startY;
    __box.style.left   = (w < 0 ? e.clientX : __startX) + "px";
    __box.style.top    = (h < 0 ? e.clientY : __startY) + "px";
    __box.style.width  = Math.abs(w) + "px";
    __box.style.height = Math.abs(h) + "px";
  }

  async function onEnd(){
    if (!__overlay || !__box) return;
    const rect = {
      x: parseInt(__box.style.left, 10),
      y: parseInt(__box.style.top,  10),
      w: parseInt(__box.style.width,10),
      h: parseInt(__box.style.height,10),
    };
    removeOverlay();

    if (rect.w < 4 || rect.h < 4) { log("tiny rect -> ignore"); return; }
    log("end rect:", rect);

    try {
      const canvas = findTopPdfCanvasIntersecting(rect);
      const showX = rect.x + window.scrollX, showY = rect.y + rect.h + 8 + window.scrollY;

      if (!canvas) {
        showOcrFloat("（請在 PDF 畫面上框選：未偵測到 PDF 畫布）", showX, showY);
        return;
      }

      const dataUrl = cropFromCanvas(canvas, rect);
      log("crop size:", dataUrl.length);
      console.log("[OCR] API_BASE_URL =", API_BASE_URL);
      console.log("[OCR] payload bytes ≈", Math.round(dataUrl.length * 0.75));

      const res = await fetchJSON(API_BASE_URL + "/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          lang_hints: ["en", "zh-Hant"]
        })
      }, 20000);

      console.log("[OCR] response =", res);
      const text = (res && (res.text || res.result || res.ocr) || "").trim();
      console.log("[OCR] showing float with text length =", (text || "").length);
      showOcrFloat(text, showX, showY);
    } catch (err){
      log("OCR failed:", err);
      const showX = rect.x + window.scrollX, showY = rect.y + rect.h + 8 + window.scrollY;
      showOcrFloat("（OCR 失敗）", showX, showY);
    } finally {
      __holdModifier = false;
    }
  }

  document.addEventListener("pointerdown", onStart, true);
  document.addEventListener("pointermove", onMove,  true);
  document.addEventListener("pointerup",   onEnd,   true);
  document.addEventListener("mousedown",   onStart, true);
  document.addEventListener("mousemove",   onMove,  true);
  document.addEventListener("mouseup",     onEnd,   true);

  // ------- 工具函式 -------
  function findTopPdfCanvasIntersecting(sel) {
    const canvases = Array.prototype.slice.call(document.querySelectorAll("canvas"));
    let best = null, bestArea = 0;
    const selRect = new DOMRect(sel.x, sel.y, sel.w, sel.h);
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      const r = c.getBoundingClientRect();
      const interW = Math.max(0, Math.min(selRect.right, r.right) - Math.max(selRect.left, r.left));
      const interH = Math.max(0, Math.min(selRect.bottom, r.bottom) - Math.max(selRect.top, r.top));
      const area = interW * interH;
      if (area > bestArea) { bestArea = area; best = c; }
    }
    return bestArea > 0 ? best : null;
  }

  function cropFromCanvas(canvasEl, sel) {
    const cRect = canvasEl.getBoundingClientRect();

    const interLeft   = Math.max(sel.x, cRect.left);
    const interTop    = Math.max(sel.y, cRect.top);
    const interRight  = Math.min(sel.x + sel.w, cRect.right);
    const interBottom = Math.min(sel.y + sel.h, cRect.bottom);
    const interW = Math.max(0, interRight - interLeft);
    const interH = Math.max(0, interBottom - interTop);
    if (interW === 0 || interH === 0) throw new Error("選取範圍不在畫面內");

    const scaleX = canvasEl.width  / cRect.width;
    const scaleY = canvasEl.height / cRect.height;

    const sx = Math.round((interLeft  - cRect.left) * scaleX);
    const sy = Math.round((interTop   - cRect.top ) * scaleY);
    const sw = Math.round(interW * scaleX);
    const sh = Math.round(interH * scaleY);

    const out = document.createElement("canvas");
    out.width = sw; out.height = sh;
    const ctx = out.getContext("2d");
    ctx.drawImage(canvasEl, sx, sy, sw, sh, 0, 0, sw, sh);
    // 省流量用 JPEG
    return out.toDataURL("image/jpeg", 0.9);
  }
}
