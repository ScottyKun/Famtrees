from flask import Blueprint, jsonify, request
import requests
from CRUD.extensions import db
from CRUD.models.arbre import Arbre
from tree_route import SPRING_BASE_URL
from tree_generator import build_tree

arbre_bp = Blueprint("arbres", __name__)

# ── CRUD PostgreSQL 
 
@arbre_bp.route("/arbres", methods=["GET"])
def get_all():
    arbres = Arbre.query.order_by(Arbre.created_at.desc()).all()
    return jsonify([a.to_dict() for a in arbres])
 
 
@arbre_bp.route("/arbres/<string:arbre_id>", methods=["GET"])
def get_by_id(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)
    return jsonify(arbre.to_dict())
 
 
@arbre_bp.route("/arbres", methods=["POST"])
def create():
    body = request.get_json()
 
    if not body.get("nom") or not body.get("racine_id"):
        return jsonify({"error": "nom et racine_id sont obligatoires"}), 400
 
    arbre = Arbre(
        nom       = body["nom"],
        racine_id = body["racine_id"],
        depth     = body.get("depth", 3),
    )
    db.session.add(arbre)
    db.session.commit()
    return jsonify(arbre.to_dict()), 201
 
 
@arbre_bp.route("/arbres/<string:arbre_id>", methods=["PUT"])
def update(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)
    body  = request.get_json()
 
    if "nom"      in body: arbre.nom      = body["nom"]
    if "depth"    in body: arbre.depth    = body["depth"]
    if "racine_id" in body: arbre.racine_id = body["racine_id"]
 
    db.session.commit()
    return jsonify(arbre.to_dict())
 
 
@arbre_bp.route("/arbres/<string:arbre_id>", methods=["DELETE"])
def delete(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)
    db.session.delete(arbre)
    db.session.commit()
    return jsonify({"message": "Arbre supprimé"}), 200


# ── Génération Neo4j ──────────────────────────────────────────────────────────
# GET /api/arbres/<arbre_id>/generate
# Récupère les infos de l'arbre en PostgreSQL, puis interroge Neo4j via Spring.
# Un paramètre ?depth= optionnel permet de surcharger le depth par défaut.
 
@arbre_bp.route("/arbres/<string:arbre_id>/generate", methods=["GET"])
def generate(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)
 
    depth = request.args.get("depth", default=arbre.depth, type=int)
 
    try:
        spring_url = f"{SPRING_BASE_URL}/{arbre.racine_id}"
        response   = requests.get(spring_url, timeout=15)
 
        if response.status_code != 200:
            return jsonify({
                "error":   "Erreur Spring API",
                "details": response.text,
            }), 500
 
        data = response.json()
        tree = build_tree(data, arbre.racine_id)
 
        if depth is not None and tree["generations"]:
            from tree_route import filter_by_depth
            tree = filter_by_depth(tree, arbre.racine_id, depth)
 
        return jsonify({
            "arbre": arbre.to_dict(),
            "tree":  tree,
        })
 
    except requests.exceptions.ConnectionError:
        return jsonify({
            "error":   "Impossible de joindre Spring Boot",
            "details": f"URL : {SPRING_BASE_URL}/{arbre.racine_id}",
        }), 503
 
    except Exception as e:
        import traceback
        return jsonify({
            "error":   "Erreur Flask",
            "details": str(e),
            "trace":   traceback.format_exc(),
        }), 500
 