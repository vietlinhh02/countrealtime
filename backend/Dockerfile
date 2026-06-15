# syntax=docker/dockerfile:1.7
# Cache intentionally disabled. uv and pip are invoked with --no-cache and we
# wipe bytecode / pyc files so a re-built image cannot reuse stale artefacts.

FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_NO_CACHE=1 \
    UV_LINK_MODE=copy \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DATABASE_URL=sqlite:////data/app.db \
    PORT=8000

WORKDIR /app

# Install uv without using the wheel cache if possible.
RUN pip install --no-cache-dir --disable-pip-version-check uv==0.10.10

COPY pyproject.toml README.md ./
# Force a clean sync with no cache and no bytecode.
RUN uv sync --no-dev --no-cache

COPY app ./app

RUN mkdir -p /data

EXPOSE ${PORT}

CMD ["sh", "-c", "uv run --no-cache uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
