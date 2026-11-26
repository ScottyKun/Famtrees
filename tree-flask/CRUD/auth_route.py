"""
Connexion / inscription / déconnexion.

  POST /api/auth/register  (public)  crée un compte et connecte
  POST /api/auth/login     (public)  connecte
  POST /api/auth/logout    (public)  efface le cookie
  GET  /api/auth/me        (connecté) l'utilisateur courant

Le jeton n'est jamais renvoyé dans le corps de la réponse : il n'existe que
dans le cookie HttpOnly (voir auth.py).
"""
from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from auth import clear_auth_cookie, issue_token, set_auth_cookie
from CRUD.extensions import db
from CRUD.models.user import User
from CRUD.user_route import apply_user_data, conflict, email_taken, normalize_email, validate_user_payload

auth_bp = Blueprint("auth", __name__)

# Comparé quand l'email est inconnu : la réponse prend le même temps qu'avec un
# mauvais mot de passe, ce qui ne révèle pas quels emails ont un compte.
_DUMMY_HASH = generate_password_hash("famtrees-dummy-password")


def _logged_in(user, status=200):
    resp = jsonify(user.to_dict())
    resp.status_code = status
    return set_auth_cookie(resp, issue_token(user))


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data, errors = validate_user_payload(request.get_json(silent=True) or {})
    data.pop("personne_id", None)   # le lien vers une Personne se fait ensuite, depuis la page Utilisateurs
    if errors:
        return jsonify({"error": "Champs invalides", "fields": errors}), 400
    if email_taken(data["email"]):
        return conflict()

    user = User()
    apply_user_data(user, data)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return conflict()
    return _logged_in(user, 201)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    user = User.query.filter_by(email=normalize_email(body.get("email"))).first()
    password = body.get("password") or ""
    valid = check_password_hash(user.password_hash if user else _DUMMY_HASH, password)
    if not user or not valid:
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401
    return _logged_in(user)


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    resp = jsonify({"message": "Déconnecté"})
    return clear_auth_cookie(resp)


@auth_bp.route("/auth/me", methods=["GET"])
def me():
    return jsonify(g.user.to_dict())
