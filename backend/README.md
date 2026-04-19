# translation-KG

Download the extention pack through [this link](https://drive.google.com/file/d/1BnjQUdvXLQYBcoiD7zqaw0j3mmoATEpM/view?usp=sharing).

## Knowledge Graph

[data file link](https://u.pcloud.link/publink/show?code=kZu6Ph5ZcKL2TVPtKgupG9cUmR5y98UD7Tik)

```bash
# data preparation
poetry run python -m scripts.csv_filter
poetry run python -m scripts.build_graph
poetry run python -m scripts.export_graph
```

## Translating

```bash
poetry run uvicorn api.main:app --reload
```

## Clean data

```bash
0 4 * * * cd /your/project/path && python -c "from routers.pdf_manage import clean_old_pdfs; clean_old_pdfs(2)"
```

## Docker
```bash
cd backend
docker build -t momonong/lexilight:v1.3.0 -t momonong/lexilight:latest .
docker push momonong/lexilight:v1.3.0
docker push momonong/lexilight:latest
```


```bash
docker build --platform linux/amd64 -t gcr.io/agent-hackathon-463002/lexilight:latest .
docker push gcr.io/agent-hackathon-463002/lexilight:latest
```
