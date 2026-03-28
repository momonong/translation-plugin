# tools/normalize_nlp.py
import threading
from typing import Dict
import spacy

_nlp = None
_lock = threading.Lock()

def _get_nlp():
    global _nlp
    if _nlp is None:
        with _lock:
            if _nlp is None:
                # 需要先安裝模型： python -m spacy download en_core_web_sm
                _nlp = spacy.load("en_core_web_sm")
    return _nlp

def _expand_span(doc, sel_start: int, sel_end: int) -> Dict[str, str] | None:
    toks = [t for t in doc if not (t.idx + len(t) <= sel_start or t.idx >= sel_end)]
    if not toks:
        return None

    core = toks[len(toks)//2]
    span_tokens = set([core])

    # 1) verb <-> particle (prt)
    if core.dep_ == "prt" and core.head.pos_ == "VERB":
        span_tokens.add(core.head)
    if core.pos_ == "VERB":
        span_tokens |= {c for c in core.children if c.dep_ == "prt"}

    # 2) negation（no/not/never）
    span_tokens |= {c for c in core.children if c.dep_ == "neg"}
    if core.pos_ == "ADV":
        span_tokens |= {c for c in core.children if c.dep_ == "neg"}

    # 3) fixed expressions（in spite of / according to…）
    span_tokens |= {c for c in core.children if c.dep_ == "fixed"}
    if core.dep_ == "fixed":
        span_tokens.add(core.head)
        span_tokens |= {c for c in core.head.children if c.dep_ == "fixed"}

    # 4) auxiliaries（have to / used to）
    span_tokens |= {c for c in core.children if c.dep_ in ("aux","auxpass")}
    if core.dep_ in ("aux","auxpass") and core.head.pos_ == "VERB":
        span_tokens.add(core.head)

    start = min(t.idx for t in span_tokens)
    end   = max(t.idx + len(t) for t in span_tokens)
    text  = doc.text[start:end]

    pos = "phrase" if len(span_tokens) > 1 else (core.pos_.lower() if core.pos_ else "unknown")
    pos = {
        "adj":"adj", "adjective":"adj",
        "adv":"adv", "adverb":"adv",
        "noun":"noun", "verb":"verb",
        "phrase":"phrase"
    }.get(pos, "unknown")

    return {"target": text, "pos": pos}

def normalize_phrase(sentence: str, selection: str) -> Dict[str, str]:
    """
    回傳 {"target": 擴張後的查詢目標, "pos": noun/verb/adj/adv/phrase/unknown}
    若無法定位 selection，回傳原 selection 與 unknown。
    """
    sent = sentence or ""
    sel  = selection or ""
    if not sent.strip() or not sel.strip():
        return {"target": sel, "pos": "unknown"}

    nlp = _get_nlp()
    doc = nlp(sent)

    i = sent.lower().find(sel.lower())
    if i < 0:
        return {"target": sel, "pos": "unknown"}
    j = i + len(sel)

    out = _expand_span(doc, i, j)
    return out or {"target": sel, "pos": "unknown"}
