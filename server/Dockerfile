FROM python:3.13-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock* ./

RUN uv sync --frozen --no-dev

COPY . .

# EXPOSE 8000

CMD ["sh", "-c", ".venv/bin/uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]