# syntax=docker/dockerfile:1
# ── Flask (comptes, arbres sauvegardés, génération de l'arbre) ──────────────
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
RUN useradd --system --uid 10001 --no-create-home app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod 0755 docker-entrypoint.sh

USER app
EXPOSE 5000
# Applique les migrations Alembic puis lance gunicorn (voir docker-entrypoint.sh)
ENTRYPOINT ["./docker-entrypoint.sh"]
