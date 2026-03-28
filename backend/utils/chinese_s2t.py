from opencc import OpenCC

# 預設使用簡體轉繁體配置（s2t: Simplified to Traditional Chinese）
cc = OpenCC("s2t.json")

def to_traditional(text: str) -> str:
    """Convert Simplified Chinese text to Traditional Chinese."""
    return cc.convert(text)

def convert_list(texts: list[str]) -> list[str]:
    """Convert a list of Simplified Chinese strings to Traditional."""
    return [cc.convert(t) for t in texts]
