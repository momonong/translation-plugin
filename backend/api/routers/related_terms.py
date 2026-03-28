from fastapi import APIRouter, Query, Request
from api.models.kg import GroupedRelatedTermsResponse
from tools.graph_query import extract_subgraph_data
from utils.detect_lang import detect_lang

router = APIRouter()


@router.get("/related_terms", response_model=GroupedRelatedTermsResponse)
def get_related_terms_api(request: Request, term: str = Query(...), top_k: int = 20):
    G = request.app.state.graph
    lang = detect_lang(term)
    term_uri = f"/c/{lang}/{term.strip().lower()}"
    groups = extract_subgraph_data(G, term_uri, top_k_per_relation=top_k)
    return {"term": term.strip(), "groups": groups}
