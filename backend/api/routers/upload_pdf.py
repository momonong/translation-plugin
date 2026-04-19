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
    
    # Get the protocol and host from headers (set by Nginx) or fallback to request
    proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    host = request.headers.get("X-Forwarded-Host", request.headers.get("Host", request.url.netloc))
    
    # Use environment variable directly since app.root_path is commented out in main.py
    root_path = os.getenv("ROOT_PATH", "/lexilight")
    
    # Construct the correct external URL
    base_url = f"{proto}://{host}{root_path}"
    pdf_url = f"{base_url}/api/pdfview/{pdf_id}"
    
    print("pdf_url:", pdf_url)
    return JSONResponse({"pdf_url": pdf_url})