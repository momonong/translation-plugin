import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import RelatedTerms from "./components/RelatedTerms";
import HighlightedText from "./components/HighlightedText";
import KnowledgeGraph from "./components/KnowledgeGraph";
import PdfUploader from "./components/PdfUploader";
import { API_BASE_URL } from "./config";
import { Document, Page } from "react-pdf";

type RelationItem = { source: string; target: string; weight: number };
type RelationGroup = { relation: string; items: RelationItem[] };

// --- 主頁 ---
function MainPage() {
  // ...你的原有狀態
  const [inputText, setInputText] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [relationGroups, setRelationGroups] = useState<RelationGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let text = "";
  
    // 先抓 search
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      text = params.get("text") || "";
    } 
    // 如果沒有 search，檢查 hash（HashRouter 路由參數）
    else if (window.location.hash) {
      // hash 可能長 "#/?text=xxx" 或 "#/xxx?text=yyy"
      const hash = window.location.hash; // 例: "#/?text=xxx"
      const queryStr = hash.includes("?") ? hash.substring(hash.indexOf("?") + 1) : "";
      const params = new URLSearchParams(queryStr);
      text = params.get("text") || "";
    }
  
    console.log("解析出來的 text:", text);
  
    if (text) {
      const decoded = decodeURIComponent(text);
      setInputText(decoded);
      setIsLoading(true);
      fetch(`${API_BASE_URL}/api/keywords?text=${encodeURIComponent(decoded)}`)
        .then((res) => res.json())
        .then((data) => {
          setKeywords(data.keywords);
          setError(null);
        })
        .catch(() => setError("❌ 擷取關鍵詞失敗"))
        .finally(() => setIsLoading(false));
    }
  }, []);  

  const fetchRelations = (term: string) => {
    setSelectedTerm(term);
    setRelationGroups([]);
    setIsLoading(true);
    fetch(`${API_BASE_URL}/api/related_terms?term=${term}`)
      .then((res) => res.json())
      .then((data) => {
        setRelationGroups(data.groups);
        setError(null);
      })
      .catch(() => setError("❌ 查詢語意關係失敗"))
      .finally(() => setIsLoading(false));
  };

  return (
    <Box sx={{ width: "100vw", minHeight: "100vh", p: 4, boxSizing: "border-box" }}>
      <Box sx={{ maxWidth: "1000px", mx: "auto", mb: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          🔍 選取文字：
        </Typography>
        <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', p: 2, borderRadius: 2 }}>
          <HighlightedText text={inputText} keywords={keywords} onClick={fetchRelations} />
        </Box>
      </Box>
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ maxWidth: 800, mx: "auto", mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      {selectedTerm && (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "center",
            gap: 4,
            maxWidth: "1200px",
            mx: "auto",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {relationGroups.length > 0 && (
              <RelatedTerms
                term={selectedTerm}
                groups={relationGroups}
                onTermClick={fetchRelations}
              />
            )}
          </Box>
          <Box sx={{ flex: 3, minWidth: 0 }}>
            {relationGroups.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  📈 知識圖譜視覺化：
                </Typography>
                <KnowledgeGraph term={selectedTerm} />
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// --- PDF 上傳頁 ---
function PdfUploaderPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      <Button onClick={() => navigate("/")} variant="outlined" sx={{ mb: 2 }}>
        ← 返回首頁
      </Button>
      <PdfUploader />
    </Box>
  );
}

// --- PDF 預覽頁（可直接開 /pdfview/:pdfId）---
function PdfViewerPage() {
  const params = useParams();
  const pdfId = params.pdfId;  
  const [numPages, setNumPages] = useState(0);

  if (!pdfId) return <Alert severity="error">PDF ID 不存在</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" gutterBottom>
        PDF 預覽
      </Typography>
      <Document
        file={`${API_BASE_URL}/api/pdf_download/${pdfId}`}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<Box sx={{ py: 4 }}><CircularProgress /></Box>}
      >
        {[...Array(numPages).keys()].map(i => (
          <Page key={i} pageNumber={i + 1} width={800} renderTextLayer />
        ))}
      </Document>
    </Box>
  );
}

// --- App 路由 ---
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/pdf-uploader" element={<PdfUploaderPage />} />
      <Route path="/pdfview/:pdfId" element={<PdfViewerPage />} />
    </Routes>
  );
}

export default App;
