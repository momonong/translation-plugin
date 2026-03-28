from fastapi import APIRouter, Query
from api.models.kg import KeywordResponse
from tools.parser import parse_text, extract_keywords

router = APIRouter()


@router.get("/keywords", response_model=KeywordResponse)
def extract_keywords_api(text: str = Query(..., description="輸入句子或段落")):
    tokens = parse_text(text)
    keywords = extract_keywords(tokens)
    return {"keywords": keywords}
