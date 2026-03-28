# api/routers/ocr.py
from __future__ import annotations
import json, os, logging
from typing import List

from fastapi import APIRouter, HTTPException
from google.cloud import vision
from google.oauth2 import service_account

from api.models.ocr import OCRIn, OCROut
from tools.ocr import dataurl_to_bytes

router = APIRouter()

log = logging.getLogger("ocr")
log.setLevel(logging.INFO)

_client: vision.ImageAnnotatorClient | None = None

def _get_vision_client() -> vision.ImageAnnotatorClient:
    creds_json = os.getenv("GCP_CREDENTIALS_JSON")
    if creds_json:
        log.info("[OCR] init client via GCP_CREDENTIALS_JSON")
        creds = service_account.Credentials.from_service_account_info(json.loads(creds_json))
        return vision.ImageAnnotatorClient(credentials=creds)

    gac = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if gac:
        log.info(f"[OCR] init client via GOOGLE_APPLICATION_CREDENTIALS={gac}")
    else:
        log.info("[OCR] init client via ADC (no explicit env)")

    return vision.ImageAnnotatorClient()

@router.post("/ocr", response_model=OCROut)
def ocr_image(body: OCRIn) -> OCROut:
    global _client
    try:
        if _client is None:
            _client = _get_vision_client()

        content = dataurl_to_bytes(body.image)
        log.info(f"[OCR] received image bytes: {len(content)}")

        image = vision.Image(content=content)
        lang_hints: List[str] = body.lang_hints or []
        log.info(f"[OCR] lang_hints={lang_hints}")

        # 使用最便宜的文件 OCR（準確度也較好）
        if lang_hints:
            resp = _client.document_text_detection(image=image,
                                                   image_context=vision.ImageContext(language_hints=lang_hints))
        else:
            resp = _client.document_text_detection(image=image)

        if resp.error and resp.error.message:
            # 這個錯多半是：專案沒啟用 Vision API / 金鑰無權限 / 帳單未啟用
            raise HTTPException(status_code=502, detail=f"GCP Vision error: {resp.error.message}")

        text = (resp.full_text_annotation.text or "").strip()
        if not text and resp.text_annotations:
            text = (resp.text_annotations[0].description or "").strip()

        log.info(f"[OCR] text length={len(text)}")
        return OCROut(text=text or "")
    except HTTPException:
        raise
    except Exception as e:
        # 把錯誤打清楚，方便你從容器日誌定位
        log.exception("[OCR] unexpected failure")
        raise HTTPException(status_code=500, detail=f"OCR failed: {type(e).__name__}: {e}")
