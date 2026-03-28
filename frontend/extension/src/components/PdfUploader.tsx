import { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import { CloudUpload, NavigateBefore, NavigateNext } from "@mui/icons-material";
import { Document, Page, pdfjs } from "react-pdf";
import { API_BASE_URL } from "../config";

pdfjs.GlobalWorkerOptions.workerSrc = "/assets/pdf.worker.min.mjs";

export default function PdfUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // 讓預覽寬度與上方上傳區塊差不多（稍微小一點以免撐滿）
  const PREVIEW_WIDTH = 520;

  // 拖曳事件
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploading) return;
    const newFile = e.dataTransfer.files?.[0];
    if (newFile && newFile.type === "application/pdf") {
      handleFile(newFile);
    }
  };

  // 處理本地檔案
  const handleFile = (newFile: File) => {
    setFile(newFile);
    setError("");
    setPageNumber(1);
    setNumPages(0);
    setPreviewUrl(URL.createObjectURL(newFile));
  };

  // 上傳流程
  const handleUpload = async () => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${API_BASE_URL}/api/upload_pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      console.log("後端回傳 pdf_url:", data.pdf_url);
      if (data.pdf_url) {
        window.open(data.pdf_url, "_blank");
      } else {
        setError("上傳失敗，請再試一次！");
      }
    } catch (err) {
      setError("上傳失敗：" + (err as any).message);
    }
    setUploading(false);
  };

  // 鍵盤左右鍵也能翻頁
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!previewUrl) return;
      if (e.key === "ArrowLeft") setPageNumber((p) => Math.max(p - 1, 1));
      if (e.key === "ArrowRight") setPageNumber((p) => Math.min(p + 1, numPages));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl, numPages]);

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" gutterBottom>
        PDF Reader
      </Typography>

      {/* 上傳區塊 */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : '#f8fafc',
          border: "2px dashed #90caf9",
          textAlign: "center",
          mb: 2,
          cursor: uploading ? "not-allowed" : "pointer",
        }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 40, color: "#90caf9" }} />
        <Typography sx={{ mt: 1 }}>拖曳 PDF 到這裡，或點擊選擇檔案</Typography>
        <Button variant="contained" sx={{ mt: 2 }} disabled={uploading} component="span">
          選擇檔案
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onClick={(e) => {
            (e.target as HTMLInputElement).value = "";
          }}
          onChange={(e) => {
            const newFile = e.target.files?.[0];
            if (newFile && newFile.type === "application/pdf") handleFile(newFile);
          }}
        />
        {file && <Typography sx={{ mt: 1 }} color="primary">{file.name}</Typography>}
      </Paper>

      {/* 預覽＋控制列（縮小尺寸＋左右箭頭） */}
      {previewUrl && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              position: "relative",
              mx: "auto",
              width: PREVIEW_WIDTH,
              border: "1px solid #eee",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            <Document
              file={previewUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setPageNumber((p) => Math.min(p, numPages || 1));
              }}
              onLoadError={(err) => setError("PDF 載入失敗: " + err.message)}
              loading={
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress />
                </Box>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={PREVIEW_WIDTH}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* 左右浮動箭頭 */}
            <IconButton
              aria-label="上一頁"
              onClick={(e) => {
                e.stopPropagation();
                setPageNumber((p) => Math.max(p - 1, 1));
              }}
              disabled={pageNumber <= 1}
              sx={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                boxShadow: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <NavigateBefore />
            </IconButton>

            <IconButton
              aria-label="下一頁"
              onClick={(e) => {
                e.stopPropagation();
                setPageNumber((p) => Math.min(p + 1, numPages));
              }}
              disabled={pageNumber >= numPages}
              sx={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                boxShadow: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <NavigateNext />
            </IconButton>

            {/* 右上角顯示目前頁碼 */}
            <Chip
              label={`${pageNumber} / ${numPages || 0}`}
              size="small"
              sx={{ position: "absolute", right: 8, top: 8, bgcolor: "rgba(255,255,255,0.9)" }}
            />
          </Box>

          {/* 操作按鈕：放在預覽正下方，永遠看得到 */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mt: 1.5 }}
          >
            <Button variant="contained" color="primary" disabled={uploading} onClick={handleUpload}>
              {uploading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "確認上傳"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={uploading}
              onClick={() => {
                setFile(null);
                setPreviewUrl(undefined);
                setNumPages(0);
                setPageNumber(1);
              }}
            >
              重新選擇
            </Button>
          </Stack>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
