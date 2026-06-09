FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1
ENV DATABASE_URL=sqlite:////data/app.db
ENV PORT=8000

WORKDIR /app

RUN pip install --no-cache-dir uv==0.10.10

COPY pyproject.toml README.md ./
RUN uv sync --no-dev

COPY app ./app

RUN mkdir -p /data

EXPOSE ${PORT}

CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
