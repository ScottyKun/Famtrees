"""
auth.py — sessions par JWT dans un cookie HttpOnly.

  - Flask émet le jeton à la connexion / l'inscription (CRUD/auth_route.py) et le
    pose dans le cookie "famtrees_token" : HttpOnly (illisible par le JavaScript),
    SameSite=Strict (jamais envoyé depuis un autre site), Secure en prod.
  - Chaque requête vers Flask est vérifiée ici (signature, expiration, émetteur,
    et le compte existe toujours en base).
  - Spring Security vérifie le même jeton avec le même secret (JWT_SECRET). Quand
    Flask appelle Spring, il le transmet en "Authorization: Bearer" (spring_headers()).
  - L'en-tête Authorization: Bearer est aussi accepté (outils, tests, appels serveur).
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from flask import g, jsonify, request

from CRUD.extensions import db
from CRUD.models.user import User

# Même valeur par défaut DEV que backend-spring (application.properties).
# En prod, JWT_SECRET vient des secrets Docker / de l'environnement.
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-secret-change-me-in-prod-0123456789")
JWT_ISSUER = os.environ.get("JWT_ISSUER", "famtrees")
JWT_TTL = timedelta(seconds=int(os.environ.get("JWT_TTL_SECONDS", 8 * 3600)))

COOKIE_NAME = "famtrees_token"
# En prod (HTTPS) : COOKIE_SECURE=true. En dev (http://localhost) il doit rester false.
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

if len(JWT_SECRET.encode("utf-8")) < 32:
    raise RuntimeError("JWT_SECRET doit faire au moins 32 caractères (HS256)")

# Routes accessibles sans être connecté (noms d'endpoint Flask)
PUBLIC_ENDPOINTS = {"auth.login", "auth.register", "auth.logout"}


# ── Jeton ────────────────────────────────────────────────────────────────────

def issue_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "iss":   JWT_ISSUER,
        "sub":   user.id,
        "email": user.email,
        "iat":   now,
        "exp":   now + JWT_TTL,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def set_auth_cookie(response, token):
    response.set_cookie(
        COOKIE_NAME, token,
        max_age=int(JWT_TTL.total_seconds()),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="Strict",
        path="/",
    )
    return response


def clear_auth_cookie(response):
    response.delete_cookie(COOKIE_NAME, path="/", secure=COOKIE_SECURE, httponly=True, samesite="Strict")
    return response


def _read_token():
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[len("Bearer "):].strip()
    return request.cookies.get(COOKIE_NAME)


def _unauthorized(message):
    resp = jsonify({"error": "Non authentifié", "details": message})
    resp.status_code = 401
    resp.headers["WWW-Authenticate"] = "Bearer"
    return resp


# ── Vérification sur toutes les routes ───────────────────────────────────────

def init_auth(app):
    @app.before_request
    def require_auth():
        if request.method == "OPTIONS":                 # pré-vol CORS
            return None
        if request.endpoint in PUBLIC_ENDPOINTS:
            return None

        token = _read_token()
        if not token:
            return _unauthorized("Non connecté")
        try:
            claims = jwt.decode(
                token, JWT_SECRET,
                algorithms=["HS256"],
                issuer=JWT_ISSUER,
                options={"require": ["exp", "iat", "iss", "sub"]},
            )
        except jwt.ExpiredSignatureError:
            return _unauthorized("Session expirée")
        except jwt.InvalidTokenError:
            return _unauthorized("Jeton invalide")

        user = db.session.get(User, claims["sub"])
        if user is None:                                # compte supprimé depuis
            return _unauthorized("Compte introuvable")

        g.user = user
        g.jwt_token = token
        return None


def spring_headers():
    """En-têtes à joindre à chaque appel Flask → Spring (même jeton que l'utilisateur)."""
    return {"Authorization": f"Bearer {g.jwt_token}"}
