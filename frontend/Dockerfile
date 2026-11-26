# syntax=docker/dockerfile:1
# ── Front React : build Vite puis fichiers statiques servis par nginx ──────

# 1) Build (utilise .env.production : URLs relatives /spring/api et /flask/api)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# 2) nginx non root (écoute sur 8080), compatible conteneur en lecture seule
FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
