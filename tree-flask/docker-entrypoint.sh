#!/bin/sh
# Démarrage du conteneur Flask :
#   1) met la base à jour (flask db upgrade — idempotent, ne fait rien si c'est déjà à jour)
#   2) lance gunicorn (serveur de prod ; app.run() / debug=True ne sert qu'en dev)
set -e

flask --app app db upgrade

exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-60}" \
  --worker-tmp-dir /dev/shm \
  --access-logfile - \
  --error-logfile - \
  app:app
