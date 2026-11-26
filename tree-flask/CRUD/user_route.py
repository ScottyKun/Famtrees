"""
CRUD des comptes utilisateurs (PostgreSQL).

Pas de rôle admin : tout utilisateur connecté peut lister, créer, modifier et
supprimer des comptes. Supprimer son propre compte déconnecte immédiatement
(le cookie est effacé et toute requête suivante est refusée).
"""
import re

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from auth import clear_auth_cookie
from CRUD.extensions import db
from CRUD.models.user import User

users_bp = Blueprint("users", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_MIN, PASSWORD_MAX = 8, 128


def normalize_email(value):
    return (value or "").strip().lower()


def validate_user_payload(body, partial=False):
    """
    Renvoie (données nettoyées, erreurs). partial=True pour un PUT : seuls les
    champs présents sont validés, et le mot de passe est optionnel.
    """
    errors, data = {}, {}

    if not partial or "email" in body:
        email = normalize_email(body.get("email"))
        if not EMAIL_RE.match(email) or len(email) > 254:
            errors["email"] = "Email invalide"
        data["email"] = email

    for field in ("prenom", "nom"):
        if not partial or field in body:
            value = (body.get(field) or "").strip()
            if not value or len(value) > 100:
                errors[field] = "Requis (100 caractères max.)"
            data[field] = value

    if not partial or body.get("password"):
        password = body.get("password") or ""
        if not (PASSWORD_MIN <= len(password) <= PASSWORD_MAX):
            errors["password"] = f"{PASSWORD_MIN} à {PASSWORD_MAX} caractères"
        data["password"] = password

    if "personne_id" in body:
        data["personne_id"] = (body.get("personne_id") or "").strip() or None

    return data, errors


def apply_user_data(user, data):
    for field in ("email", "prenom", "nom", "personne_id"):
        if field in data:
            setattr(user, field, data[field])
    if data.get("password"):
        user.password_hash = generate_password_hash(data["password"])


def email_taken(email, exclude_id=None):
    q = User.query.filter(User.email == email)
    if exclude_id:
        q = q.filter(User.id != exclude_id)
    return db.session.query(q.exists()).scalar()


def conflict():
    return jsonify({"error": "Un compte existe déjà avec cet email", "fields": {"email": "Déjà utilisé"}}), 409


# ── Routes ───────────────────────────────────────────────────────────────────

@users_bp.route("/users", methods=["GET"])
def list_users():
    users = User.query.order_by(User.nom, User.prenom).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.route("/users/<string:user_id>", methods=["GET"])
def get_user(user_id):
    return jsonify(User.query.get_or_404(user_id).to_dict())


@users_bp.route("/users", methods=["POST"])
def create_user():
    data, errors = validate_user_payload(request.get_json(silent=True) or {})
    if errors:
        return jsonify({"error": "Champs invalides", "fields": errors}), 400
    if email_taken(data["email"]):
        return conflict()

    user = User()
    apply_user_data(user, data)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:          # même email inséré en parallèle
        db.session.rollback()
        return conflict()
    return jsonify(user.to_dict()), 201


@users_bp.route("/users/<string:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data, errors = validate_user_payload(request.get_json(silent=True) or {}, partial=True)
    if errors:
        return jsonify({"error": "Champs invalides", "fields": errors}), 400
    if "email" in data and email_taken(data["email"], exclude_id=user.id):
        return conflict()

    apply_user_data(user, data)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return conflict()
    return jsonify(user.to_dict())


@users_bp.route("/users/<string:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    is_self = user.id == g.user.id
    db.session.delete(user)
    db.session.commit()

    resp = jsonify({"message": "Utilisateur supprimé", "self": is_self})
    if is_self:
        clear_auth_cookie(resp)
    return resp
