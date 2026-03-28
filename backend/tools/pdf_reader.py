import uuid
import os
from fastapi import UploadFile
from datetime import datetime
import shutil
from dotenv import load_dotenv

load_dotenv()
PDF_FOLDER = os.getenv("PDF_FOLDER", "pdf_files")
os.makedirs(PDF_FOLDER, exist_ok=True)


def save_and_return_pdf_id(file: UploadFile):
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    pdf_id = str(uuid.uuid4())
    pdf_path = os.path.join(PDF_FOLDER, f"{pdf_id}{ext}")
    with open(pdf_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)
    os.utime(pdf_path, (datetime.now().timestamp(), datetime.now().timestamp()))
    return pdf_id
