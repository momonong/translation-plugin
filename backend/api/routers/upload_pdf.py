# api/routers/upload_pdf.py
import os
from dotenv import load_dotenv
from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse
from tools.pdf_reader import save_and_return_pdf_id

load_dotenv()
PDF_FOLDER = os.getenv("PDF_FOLDER", "pdf_files")
os.makedirs(PDF_FOLDER, exist_ok=True)

router = APIRouter()

@router.post("/upload_pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    pdf_id = save_and_return_pdf_id(file)
    # 這裡要用 API_BASE_URL
    # base_url = os.getenv("API_BASE_URL", "http://localhost:8080")
    base_url = str(request.base_url).rstrip("/")
    pdf_url = f"{base_url}/api/pdfview/{pdf_id}"
    print("pdf_url:", pdf_url)
    return JSONResponse({"pdf_url": pdf_url})