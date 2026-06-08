# Count Realtime Backend

FastAPI backend for grouped realtime counters.

## Local

```bash
uv sync
uv run uvicorn app.main:app --reload
```

## Docker

```bash
docker build -t countrealtime-backend .
docker run -p 8000:8000 -v count-data:/data countrealtime-backend
```

Set `DATABASE_URL=sqlite:////data/app.db` in Coolify and mount `/data`.
