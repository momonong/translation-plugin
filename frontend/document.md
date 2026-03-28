# Lexilight 翻譯器技術文件

## 1. 系統概述

此前端系統主要功能為提供語義增強的翻譯服務。系統採用 React 19 + TypeScript 前端技術棧，整合 Material-UI 設計系統，透過 Chrome Extension API 實現無縫的網頁文字翻譯體驗。

### 1.1 主要功能

- **即時翻譯引擎**：雙擊選取網頁文字即可獲得情境化翻譯結果
- **語意圖譜視覺化**：使用 Cytoscape.js 繪製詞彙關係網路
- **PDF 檔案處理**：支援檔案上傳、OCR 文字辨識及分頁預覽
- **跨網域整合**：完整 Chrome Extension 權限管理與安全通訊
- **知識圖譜查詢**：基於後端 API 的語義關係探索

### 1.2 技術架構概覽

系統採用典型的 Chrome Extension 架構設計，包含 Background Service Worker、Content Script 及 React SPA 三大核心模組，透過統一的 API 層與後端服務進行通訊，確保系統的可擴展性與維護性。

## 2. 系統架構設計

### 2.1 整體架構圖

```mermaid
flowchart TB
    %% Chrome Extension 層
    subgraph CE ["Chrome Extension 架構"]
        BG["Background Service Worker<br/>右鍵選單管理<br/>訊息中繼處理<br/>頁籤管理"]
        CS["Content Script<br/>文字選取監聽<br/>翻譯浮窗顯示<br/>OCR 框選功能"]
    
        subgraph REACT ["React 應用程式核心"]
            MP["MainPage 主介面<br/>關鍵詞擷取<br/>語意圖譜<br/>相關詞彙"]
            PU["PdfUploader 處理器<br/>檔案上傳<br/>OCR 辨識<br/>格式轉換"]
            PV["PdfViewer 檢視器<br/>文件預覽<br/>分頁導覽<br/>內容渲染"]
        
        subgraph COMPONENTS ["共享元件模組"]
                HT["HighlightedText<br/>高亮顯示文字"]
                KG["KnowledgeGraph<br/>知識圖譜視覺化"]
                RT["RelatedTerms<br/>相關詞彙列表"]
                UTIL["API 整合層<br/>統一後端服務介面"]
            end
        end
    
        %% Extension 內部連接
        BG <--> CS
        BG --> MP
        CS --> MP
        MP --> HT
        MP --> KG
        MP --> RT
        PU --> UTIL
        PV --> UTIL
    end
  
    %% 後端 API 服務層
    subgraph API ["後端 API 服務"]
        TS["翻譯服務<br/>/api/translate<br/>情境化翻譯<br/>詞性標註<br/>多語言支援"]
        SA["語意分析<br/>/api/keywords<br/>/api/graph<br/>關鍵詞擷取<br/>語意關係<br/>知識圖譜"]
        FP["檔案處理<br/>/api/upload_pdf<br/>/api/ocr<br/>PDF 處理<br/>OCR 辨識<br/>格式轉換"]
    end
  
    %% 跨層連接
    UTIL --> TS
    UTIL --> SA
    UTIL --> FP
  
    %% 樣式定義
    classDef extension fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef react fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef api fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef component fill:#fff3e0,stroke:#e65100,stroke-width:1px
  
    %% 應用樣式
    class BG,CS extension
    class MP,PU,PV react
    class HT,KG,RT,UTIL component
    class TS,SA,FP api
```

### 2.2 架構層級說明

#### 2.2.1 Chrome Extension 層

**Background Service Worker**

- 採用 Manifest V3 標準的現代化背景腳本機制
- 管理右鍵選單的建立與事件處理
- 實現跨 Tab 的訊息中繼與狀態同步
- 處理新分頁開啟與 URL 參數傳遞

**Content Script**

- 無侵入式注入至目標網頁環境
- 監聽文字選取事件（雙擊、右鍵選單觸發）
- 實現翻譯浮窗的動態生成與定位
- 支援 PDF 頁面的 OCR 框選功能
- 使用 `window.contentScriptLoaded` 防止重複注入

#### 2.2.2 React 應用程式層

**路由管理系統**

```mermaid
flowchart LR
    subgraph ROUTES ["應用程式路由"]
        A["/ 根路由<br/>MainPage"] --> A1["關鍵詞分析"]
        B["/pdf-uploader<br/>PDF上傳"] --> B1["檔案處理"]
        C["/pdfview/:pdfId<br/>PDF檢視"] --> C1["文件預覽"]
    end
  
    classDef route fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef function fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
  
    class A,B,C route
    class A1,B1,C1 function
```

**核心元件架構**

- **MainPage**：主要翻譯介面，負責關鍵詞擷取、語意圖譜展示
- **PdfUploader**：檔案上傳處理，支援拖拽上傳與預覽
- **PdfViewer**：PDF 文件檢視器，提供分頁導覽功能
- **KnowledgeGraph**：基於 Cytoscape.js 的圖譜視覺化元件
- **RelatedTerms**：語意關係資料的階層式顯示
- **HighlightedText**：支援關鍵詞點擊互動的文字渲染元件

#### 2.2.3 技術棧規格

**前端核心技術**

- **React 19**：現代化 UI 框架，支援 Concurrent Features
- **TypeScript**：強型別語言支援，提升開發效率與程式碼品質
- **Vite 6.3.5**：高效能建構工具，支援 ES modules 與熱更新
- **Material-UI v7**：Google Material Design 元件庫

**視覺化與圖表**

- **Cytoscape.js 3.32.0**：網路圖視覺化引擎
- **React-Cytoscapejs 2.0.0**：React 整合套件
- **Html2canvas 1.4.1**：畫面截圖功能支援

**檔案處理技術**

- **React-PDF 10.0.1**：PDF 文件渲染與操作
- **PDF.js**：Mozilla PDF 處理引擎（通過 react-pdf 整合）
- **Tesseract.js 6.0.1**：WebAssembly OCR 引擎

**路由與狀態管理**

- **React Router DOM 7.7.1**：採用 HashRouter 確保 Extension 相容性
- **React Hooks**：內建狀態管理，無需外部狀態庫

## 3. 系統工作流程

### 3.1 文字翻譯處理流程

```mermaid
sequenceDiagram
    participant U as 使用者
    participant CS as Content Script
    participant BG as Background Worker
    participant API as 翻譯 API
    participant SPA as React 主介面
  
    U->>CS: 雙擊選取網頁文字
    CS->>CS: 監聽選取事件
    CS->>CS: 擷取文字內容與情境
    CS->>CS: 顯示載入中翻譯浮窗
    CS->>API: POST /api/translate
    API->>CS: 回傳翻譯結果
  
    alt 翻譯成功
        CS->>CS: 顯示翻譯結果與操作按鈕
        U->>CS: 點擊「查語意圖譜」按鈕
        CS->>BG: 發送開啟新頁籤訊息
        BG->>SPA: 開啟主介面並傳遞文字參數
    else 翻譯失敗
        CS->>CS: 顯示錯誤訊息與重試選項
    end
```

### 3.2 語意圖譜查詢流程

```mermaid
sequenceDiagram
    participant U as 使用者
    participant MP as MainPage
    participant API as 後端 API
    participant KG as KnowledgeGraph 元件
    participant RT as RelatedTerms 元件
  
    U->>MP: 開啟主介面（含文字參數）
    MP->>MP: 解析 URL 參數取得選取文字
    MP->>API: GET /api/keywords?text={text}
    API->>MP: 回傳關鍵詞列表
    MP->>MP: 渲染標記文字，標記關鍵詞
  
    U->>MP: 點擊特定關鍵詞
    MP->>MP: 設置 selectedTerm 狀態
  
    par 並行處理
        MP->>API: GET /api/related_terms?term={term}
        API->>RT: 回傳相關詞彙分類清單
    and
        MP->>API: GET /api/graph?term={term}
        API->>KG: 回傳圖譜節點與邊資料
    end
  
    RT->>RT: 渲染階層式相關詞列表
    KG->>KG: 渲染 Cytoscape 圖譜
  
    Note over KG: 圖譜節點互動觸發新查詢
    U->>KG: 點擊圖譜節點
    KG->>MP: 觸發 fetchRelations 函數
```

### 3.3 PDF 文件處理流程

```mermaid
sequenceDiagram
    participant U as 使用者
    participant PU as PdfUploader
    participant PV as PdfViewer
    participant CS as Content Script
    participant API as 後端 API
  
    %% PDF 上傳流程
    U->>PU: 拖曳或選擇 PDF 檔案
    PU->>PU: 驗證檔案格式與大小
    PU->>PU: 產生本地預覽 URL
    PU->>PU: 載入 PDF 內容並渲染預覽
  
    U->>PU: 點擊確認上傳
    PU->>API: POST /api/upload_pdf (FormData)
    API->>API: 檔案儲存與處理
    API->>PU: 回傳 PDF URL
    PU->>PV: 開啟新頁籤載入檢視器
  
    %% OCR 功能流程
    Note over U,API: OCR 功能（在 PDF 頁面）
    U->>CS: Alt/Cmd + 拖曳選取區域
    CS->>CS: 偵測 PDF Canvas 元素
    CS->>CS: 擷取選取區域影像資料
    CS->>API: POST /api/ocr (Base64 圖像)
    API->>API: OCR 文字識別處理
    API->>CS: 回傳識別文字結果
    CS->>CS: 顯示辨識結果浮窗
```

### 3.4 資料流與狀態管理

```mermaid
flowchart TD
    %% 前端資料層
    subgraph FE ["前端資料層"]
        STATE["React State Management<br/>useState + useEffect"]
        ROUTER["React Router<br/>URL 參數解析"]
        API_CLIENT["API 客戶端<br/>Fetch + Error Handling"]
    end
  
    %% API 通訊層
    subgraph API_LAYER ["API 通信層"]
        TRANSLATE["/api/translate<br/>POST 翻譯請求"]
        KEYWORDS["/api/keywords<br/>GET 關鍵詞擷取"]
        GRAPH["/api/graph<br/>GET 圖譜資料"]
        RELATED["/api/related_terms<br/>GET 相關詞查詢"]
        UPLOAD["/api/upload_pdf<br/>POST 檔案上傳"]
        OCR_API["/api/ocr<br/>POST 圖像識別"]
    end
  
    %% 後端服務層
    subgraph BE ["後端服務層"]
        TRANS_ENGINE["翻譯引擎"]
        NLP_ENGINE["語意分析引擎"]
        KG_ENGINE["知識圖譜引擎"]
        FILE_SERVICE["檔案處理服務"]
        OCR_SERVICE["OCR 識別服務"]
    end
  
    %% 前端內部連接
    ROUTER --> STATE
    STATE --> API_CLIENT
  
    %% 前端到 API 連接
    API_CLIENT --> TRANSLATE
    API_CLIENT --> KEYWORDS
    API_CLIENT --> GRAPH
    API_CLIENT --> RELATED
    API_CLIENT --> UPLOAD
    API_CLIENT --> OCR_API
  
    %% API 到後端服務連接
    TRANSLATE --> TRANS_ENGINE
    KEYWORDS --> NLP_ENGINE
    GRAPH --> KG_ENGINE
    RELATED --> KG_ENGINE
    UPLOAD --> FILE_SERVICE
    OCR_API --> OCR_SERVICE
  
    %% 樣式定義
    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef api fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    classDef backend fill:#fce4ec,stroke:#c2185b,stroke-width:2px
  
    %% 應用樣式
    class STATE,ROUTER,API_CLIENT frontend
    class TRANSLATE,KEYWORDS,GRAPH,RELATED,UPLOAD,OCR_API api
    class TRANS_ENGINE,NLP_ENGINE,KG_ENGINE,FILE_SERVICE,OCR_SERVICE backend
```

## 4. API 介面規格

### 4.1 翻譯服務 API

**請求格式**

```http
POST /api/translate
Content-Type: application/json

{
  "text": "hello world",
  "context": "greeting in conversation"
}
```

**回應格式**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": "<b>翻譯結果：</b>你好世界<br><b>語境說明：</b>常見問候語...",
  "normalized_target": "hello world",
  "normalized_pos": "phrase"
}
```

### 4.2 語意分析 API

**關鍵詞擷取**

```http
GET /api/keywords?text=The quick brown fox jumps over the lazy dog

Response: {
  "keywords": ["quick", "brown", "fox", "jumps", "lazy", "dog"]
}
```

**相關詞查詢**

```http
GET /api/related_terms?term=cat

Response: {
  "groups": [
    {
      "relation": "IsA",
      "items": [
        {"source": "cat", "target": "animal", "weight": 0.85},
        {"source": "cat", "target": "mammal", "weight": 0.78}
      ]
    }
  ]
}
```

**知識圖譜資料**

```http
GET /api/graph?term=cat

Response: [
  {
    "relation": "IsA",
    "items": [
      {"source": "cat", "target": "animal", "weight": 0.85}
    ]
  }
]
```

### 4.3 檔案處理 API

**PDF 上傳**

```http
POST /api/upload_pdf
Content-Type: multipart/form-data

Response: {
  "pdf_url": "chrome-extension://{extension-id}/pdf.html#/pdfview/{file-id}",
  "message": "Upload successful"
}
```

**OCR 文字識別**

```http
POST /api/ocr
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "lang_hints": ["en", "zh-Hant"]
}

Response: {
  "text": "This is the extracted text from the image...",
  "result": "This is the extracted text from the image..."
}
```

## 5. 技術規格與部署

### 5.1 技術棧

**前端核心技術**

- **UI 框架**：React 19 + TypeScript
- **建置工具**：Vite 6.3.5
- **UI 元件庫**：Material-UI v7
- **路由管理**：React Router DOM 7.7.1 (HashRouter)
- **狀態管理**：React Hooks (useState, useEffect)

**視覺化與圖表**

- **圖譜引擎**：Cytoscape.js 3.32.0
- **圖譜整合**：React-Cytoscapejs 2.0.0
- **截圖功能**：Html2canvas 1.4.1

**檔案處理技術**

- **PDF 渲染**：React-PDF 10.0.1 + PDF.js
- **OCR 引擎**：Tesseract.js 6.0.1
- **PDF Worker**：pdf.worker.min.mjs (從 pdfjs-dist 複製)

**Chrome Extension**

- **標準版本**：Manifest V3
- **權限配置**：contextMenus, tabs, scripting, notifications
- **主機權限**：*://*/*
- **Web 可存取資源**：index.html, pdf.html, assets/*

### 5.2 建構配置

**Vite 設定檔 (vite.config.ts)**

```typescript
export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'extension/manifest.json', dest: '.' },
        { src: 'extension/icon.png', dest: '.' },
        { src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', dest: 'assets' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        pdf: resolve(__dirname, 'pdf.html'),
        background: resolve(__dirname, 'extension/background.js'),
        'content-script': resolve(__dirname, 'extension/content-script.js'),
        config: resolve(__dirname, 'extension/config.js')
      }
    }
  }
})
```

**建置流程**

```bash
# 安裝相依套件
npm install

# 開發環境啟動
npm run dev

# 生產環境建置
npm run build

# 程式碼品質檢查
npm run lint

# 預覽建置結果
npm run preview
```

### 5.3 部署架構

```mermaid
flowchart LR
    %% 開發環境
    subgraph DEV_ENV ["開發環境"]
        DEV["Vite 開發伺服器<br/>HMR 熱更新<br/>DevTools 整合"]
    end
  
    %% 建置產出
    subgraph BUILD_OUT ["建置產出"]
        subgraph DIST ["dist/ 目錄結構"]
            HTML["index.html<br/>pdf.html"]
            ASSETS["assets/<br/>background.js<br/>content-script.js<br/>config.js<br/>[hash].js"]
            MANIFEST["manifest.json<br/>icon.png"]
        end
    end
  
    %% Chrome 擴充功能部署
    subgraph DEPLOY ["Chrome 擴充功能部署"]
        STORE["Chrome Web Store<br/>擴充功能商店"]
        LOCAL["本地開發測試<br/>載入未封裝擴充功能"]
    end
  
    %% 建置流程
    DEV -->|"npm run build"| HTML
    DEV -->|"npm run build"| ASSETS
    DEV -->|"npm run build"| MANIFEST
  
    %% 部署流程
    HTML --> STORE
    ASSETS --> STORE
    MANIFEST --> STORE
  
    HTML --> LOCAL
    ASSETS --> LOCAL
    MANIFEST --> LOCAL
  
    %% 樣式定義
    classDef dev fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef build fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef deploy fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
  
    %% 應用樣式
    class DEV dev
    class HTML,ASSETS,MANIFEST build
    class STORE,LOCAL deploy
```

### 5.4 系統需求

**開發環境需求**

- Node.js 18 或以上版本
- npm 8 或以上版本
- Chrome 瀏覽器 88 或以上版本（支援 Manifest V3）

**必要的環境配置**

- `extension/src/config.ts` 中的 `API_BASE_URL` 設定
- Chrome Extension Developer Mode 啟用
- 後端 API 服務正常運行

## 6. 系統特色與優勢

### 6.1 技術創新

**Chrome Extension 整合**

- 採用 Manifest V3 現代標準，確保安全性與效能
- 無侵入式 Content Script 注入，保持網頁原有功能
- 完整的跨域通信機制，支援複雜的前後端協作

**React 現代化架構**

- 使用 React 19 最新特性，支援 Concurrent Features
- TypeScript 強型別系統，提升程式碼品質與開發效率
- 採用 Hooks 模式進行狀態管理，避免過度複雜的狀態庫

**多模態處理能力**

- 整合 OCR、PDF 處理、圖譜視覺化等多種技術
- 支援文字選取、圖像辨識、檔案上傳等多種輸入方式
- 統一的 API 介面設計，便於功能擴展與維護

### 6.2 系統可靠性

**效能最佳化**

- Vite 建置工具提供快速的開發體驗與最佳化打包
- 程式碼分割與按需載入，減少初始載入時間
- Cytoscape.js 高效能圖譜渲染，支援大規模節點顯示

**用戶體驗設計**

- Material-UI 一致性設計語言
- 響應式介面設計，支援多種螢幕尺寸
- 直覺的操作流程，降低學習成本

**擴展性架構**

- 模組化元件設計，支援功能獨立開發與測試
- RESTful API 介面，便於後端服務替換與升級
- 清晰的資料流設計，便於狀態追蹤與除錯
