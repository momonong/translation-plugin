import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

load_dotenv()
PDF_FOLDER = os.getenv("PDF_FOLDER", "pdf_files")

router = APIRouter()


@router.get("/pdf_download/{pdf_id}")
async def download_pdf(pdf_id: str):
    pdf_path = os.path.join(PDF_FOLDER, f"{pdf_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(
        pdf_path, filename=f"{pdf_id}.pdf", media_type="application/pdf"
    )
