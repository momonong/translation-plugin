# Translation Plugin

Monorepo combining a **browser extension (frontend)** and a **FastAPI backend**. The frontend provides PDF, translation, and knowledge-graph UI; the backend exposes APIs for translation, OCR, graph queries, and PDF management.

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | React + TypeScript + Vite; build output is a Chrome extension under `dist/` |
| `backend/` | FastAPI, `pyproject.toml` (Poetry), and Docker deployment |

## Prerequisites

- **Node.js**: 20 LTS or newer recommended (see `frontend/package.json` and Vite 6)
- **Python**: 3.11 or 3.12 (`backend/pyproject.toml` requires `<3.13`)
- **Docker** (optional): for containerized backend deployment

## Backend environment variables

With `python-dotenv`, you can place a `.env` file in `backend/` (listed in `.gitignore`—do not commit secrets).

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini (translation / LLM) |
| `PDF_FOLDER` | Directory for uploaded PDFs; default `pdf_files` |
| `GCP_CREDENTIALS_JSON` | GCP Vision (etc.) credentials as a JSON string (see `api/routers/ocr.py`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a credentials file (if not using the JSON env var) |

Before starting the API, you need the knowledge graph binary at `backend/data/graph.pkl` (see **Knowledge graph data** below).

## Run the backend locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Start the API from the `backend` directory (it loads `data/graph.pkl` by default):

```bash
cd backend
uvicorn api.main:app --reload --port 8080
```

With Poetry:

```bash
cd backend
poetry install
poetry run python -m spacy download en_core_web_sm
poetry run uvicorn api.main:app --reload --port 8080
```

## Frontend: develop and build

```bash
cd frontend
npm ci          # or npm install
npm run dev     # dev server
npm run build   # extension output → frontend/dist/
```

In Chrome or Edge: **Extensions → Developer mode → Load unpacked**, then select `frontend/dist/`.

### API base URL

For a local backend, set `API_BASE_URL` in `frontend/extension/src/config.ts` (examples are commented in the file).

## Knowledge graph data

Graph assets are large and are not tracked in Git (see `backend/data/*` in the root `.gitignore`).

- Use the data link from the original project docs, or
- Generate them inside `backend` (excerpt from `backend/README.md`):

```bash
cd backend
# Requires inputs such as data/conceptnet.csv
poetry run python -m scripts.csv_filter
poetry run python -m scripts.build_graph
poetry run python -m scripts.export_graph
```

For producing `graph.pkl`, also see `backend/scripts/jsonl_to_pickle.py` and `backend/README.md`.

## Docker (backend)

Build and run from `backend` (see that directory’s `Dockerfile`):

```bash
cd backend
docker build -t translation-backend .
docker run -p 8080:8080 --env-file .env translation-backend
```

## Notes

- **`.gitignore`**: Covers Node, `dist/`, Python virtualenvs, `backend/data/*`, `backend/pdf_files/`, common IDE files, and credential-like filenames. If `frontend/dist/` was ever committed, run `git rm -r --cached frontend/dist` and commit; rely on `npm run build` for artifacts.
- **Per-package docs**: `backend/README.md` and `frontend/README.md` still hold extra detail (e.g. Docker push examples, ESLint notes).

## License

Add a `LICENSE` if you publish this repo; otherwise follow the terms of the upstream projects you merged.
