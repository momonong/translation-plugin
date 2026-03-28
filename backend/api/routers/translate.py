from fastapi import APIRouter, HTTPException
from api.models.translate import TranslateResponse, TranslateRequest
from tools.translate_llm import translate_with_llm

router = APIRouter()

@router.post("/translate", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest):
    try:
        out = translate_with_llm(
            word=payload.text,
            context=payload.context,
        )
        return TranslateResponse(
            result=out["html"],
            normalized_target=out["normalized_target"],
            normalized_pos=out["normalized_pos"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
