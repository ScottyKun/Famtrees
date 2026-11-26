#!/usr/bin/env bash

set -euo pipefail

DOMAIN="${1:-genealogie.famproject.cloud}"
OUT="$(cd "$(dirname "$0")" && pwd)/env"

command -v openssl >/dev/null || { echo "openssl est requis" >&2; exit 1; }

if [ -d "$OUT" ] && [ -n "$(ls -A "$OUT" 2>/dev/null)" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "deploy/env/ existe déjà : rien n'est écrasé (FORCE=1 pour forcer, lire l'avertissement en tête du script)." >&2
  exit 1
fi

rand() { openssl rand -base64 $(( $1 * 2 )) | tr -dc 'A-Za-z0-9' | head -c "$1"; }

JWT_SECRET="$(rand 64)"
POSTGRES_PASSWORD="$(rand 32)"
NEO4J_PASSWORD="$(rand 32)"
POSTGRES_USER="famtrees"
POSTGRES_DB="famtrees"

umask 077
mkdir -p "$OUT"

cat > "$OUT/postgres.env" <<ENV
# Conteneur PostgreSQL (lu au PREMIER démarrage, quand le volume est vide)
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV

cat > "$OUT/neo4j.env" <<ENV
# Conteneur Neo4j (lu au PREMIER démarrage, quand le volume est vide)
NEO4J_AUTH=neo4j/$NEO4J_PASSWORD
ENV

cat > "$OUT/spring.env" <<ENV
# Spring Boot
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=$NEO4J_PASSWORD
NEO4J_DATABASE=neo4j
JWT_SECRET=$JWT_SECRET
CORS_ALLOWED_ORIGINS=https://$DOMAIN
LOG_LEVEL_WEB=INFO
ENV

cat > "$OUT/flask.env" <<ENV
# Flask
DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/$POSTGRES_DB
SPRING_URL=http://spring:8070
JWT_SECRET=$JWT_SECRET
JWT_TTL_SECONDS=28800
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://$DOMAIN
ENV

chmod 600 "$OUT"/*.env
echo "Fichiers générés dans $OUT :"
ls -1 "$OUT"
echo "Domaine : https://$DOMAIN"
