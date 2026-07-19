# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Upgrade pip and install dependencies (cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# curl is needed for the docker-compose healthcheck below
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Copy installed site-packages and executables from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Data directory for the SQLite volume (docker-compose mounts a named volume here)
RUN mkdir -p /app/data

# Production defaults — override with env vars or .env file at runtime
ENV USE_NGROK=False
ENV PORT=8000
# Point this at your Ollama host when it isn't running on the same machine —
# e.g. http://host.docker.internal:11434 for Ollama running on the Docker host.
ENV OLLAMA_HOST=http://localhost:11434

EXPOSE 8000

# Run uvicorn directly for production (clean, no ngrok startup logic)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]