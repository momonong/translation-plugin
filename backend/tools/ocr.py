# tools/ocr.py
import base64, re
from fastapi import HTTPException

_DATAURL_RE = re.compile(r"^data:(?P<mime>[\w/+.-]+);base64,(?P<b64>.+)$")

def dataurl_to_bytes(dataurl: str) -> bytes:
    m = _DATAURL_RE.match(dataurl or "")
    if not m:
        raise HTTPException(status_code=400, detail="invalid dataURL")
    try:
        return base64.b64decode(m.group("b64"))
    except Exception:
        raise HTTPException(status_code=400, detail="malformed base64 in dataURL")
