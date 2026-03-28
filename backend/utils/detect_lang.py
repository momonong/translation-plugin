import re


def detect_lang(term: str) -> str:
    if re.search(r"[\u4e00-\u9fff]", term):
        return "zh"
    elif re.search(r"[a-zA-Z]", term):
        return "en"
    else:
        return "unsupported"

# def detect_lang(text, context=""):
#     try:
#         sample = context if context else text
#         lang = detect(sample)
#         return lang[:2]  # 'en', 'zh-cn', 'zh-tw', etc
#     except:
#         return "unknown"


if __name__ == "__main__":
    # 測試語言檢測
    test_terms = [
        "Hello, how are you?",
        "你好，你好吗？",
        "Bonjour, comment ça va?",
        "こんにちは、お元気ですか？",
    ]

    for term in test_terms:
        lang_prefix = detect_lang(term)
        print(f"Term: {term} | Detected Language Prefix: {lang_prefix}")

    print(detect_lang("你好"))  # zh
    print(detect_lang("hello world"))  # en
    print(detect_lang("bonjour"))  # unsupported
    print(detect_lang("123456"))  # unsupported
