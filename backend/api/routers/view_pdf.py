# api/routers/view_pdf.py
import os
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

PDF_FOLDER = os.getenv("PDF_FOLDER", "pdf_files")
TEMPLATES_FOLDER = "templates"
os.makedirs(PDF_FOLDER, exist_ok=True)

router = APIRouter()
templates = Jinja2Templates(directory=TEMPLATES_FOLDER)

@router.get("/pdfview/{pdf_id}", response_class=HTMLResponse)
async def view_pdf(request: Request, pdf_id: str):
    pdf_path = os.path.join(PDF_FOLDER, f"{pdf_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return templates.TemplateResponse(
        "pdf_view.html", {"request": request, "pdf_id": pdf_id}
    )
