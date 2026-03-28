from pydantic import BaseModel
from typing import Optional, List

class OCRIn(BaseModel):
    image: str  # dataURL
    lang_hints: Optional[List[str]] = None

class OCROut(BaseModel):
    text: str
