import os
from dotenv import load_dotenv

load_dotenv()
PDF_FOLDER = os.getenv("PDF_FOLDER", "pdf_files")

# 自動清理 function（不 expose）
def clean_old_pdfs(days=2):
    import time

    now = time.time()
    for fname in os.listdir(PDF_FOLDER):
        if fname.endswith(".pdf"):
            fpath = os.path.join(PDF_FOLDER, fname)
            if os.path.isfile(fpath):
                age_days = (now - os.path.getmtime(fpath)) / 86400
                if age_days > days:
                    os.remove(fpath)
                    print("Deleted:", fpath)