from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import keywords, related_terms, graph, translate, upload_pdf, view_pdf, download_pdf, ocr
from tools.load_graph import load_graph_from_pickle

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origin_regex=r"^chrome-extension://.*$",
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.graph = load_graph_from_pickle("data/graph.pkl") 

# Knowledge Graph API
app.include_router(keywords.router, prefix="/api")
app.include_router(related_terms.router, prefix="/api")
app.include_router(graph.router, prefix="/api")  

# Translation API
app.include_router(translate.router, prefix="/api")

# PDF Reader API
app.include_router(upload_pdf.router, prefix="/api")
app.include_router(view_pdf.router, prefix="/api") 
app.include_router(download_pdf.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
