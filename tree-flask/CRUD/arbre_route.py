from flask import Blueprint, jsonify, request
import requests
from CRUD.extensions import db
from CRUD.models.arbre import Arbre
from tree_route import SPRING_BASE_URL, filter_by_axes
from tree_generator import build_tree
from lineage import required_hops

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
        nom              = body["nom"],
        racine_id        = body["racine_id"],
        depth            = body.get("depth", 3),
        up_depth         = body.get("up_depth", 1),
        down_depth       = body.get("down_depth", 1),
        collateral_depth = body.get("collateral_depth", 1),
    )
    db.session.add(arbre)
    db.session.commit()
    return jsonify(arbre.to_dict()), 201
 
 
@arbre_bp.route("/arbres/<string:arbre_id>", methods=["PUT"])
def update(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)
    body  = request.get_json()
 
    if "nom"              in body: arbre.nom              = body["nom"]
    if "depth"            in body: arbre.depth            = body["depth"]
    if "racine_id"        in body: arbre.racine_id        = body["racine_id"]
    if "up_depth"         in body: arbre.up_depth         = body["up_depth"]
    if "down_depth"       in body: arbre.down_depth       = body["down_depth"]
    if "collateral_depth" in body: arbre.collateral_depth = body["collateral_depth"]
 
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
# ?up= / ?down= / ?collateral= optionnels permettent de surcharger les valeurs
# enregistrées sur l'arbre. ?depth= reste supporté (legacy, voir tree_route.py).
 
@arbre_bp.route("/arbres/<string:arbre_id>/generate", methods=["GET"])
def generate(arbre_id):
    arbre = Arbre.query.get_or_404(arbre_id)

    up         = request.args.get("up",         default=arbre.up_depth,         type=int)
    down       = request.args.get("down",       default=arbre.down_depth,       type=int)
    collateral = request.args.get("collateral", default=arbre.collateral_depth, type=int)

    # Alias legacy explicite : ?depth=N surcharge up/down/collateral comme dans tree_route.py
    depth = request.args.get("depth", default=None, type=int)
    if depth is not None:
        up, down, collateral = 1, depth, 1

    hops = required_hops(up=up, down=down, collateral=collateral)
 
    try:
        spring_url = f"{SPRING_BASE_URL}/{arbre.racine_id}"
        response   = requests.get(spring_url, params={"depth": hops}, timeout=15)
 
        if response.status_code != 200:
            return jsonify({
                "error":   "Erreur Spring API",
                "details": response.text,
            }), 500
 
        data = response.json()
        tree = build_tree(data, arbre.racine_id)

        if tree["persons"]:
            tree = filter_by_axes(tree, arbre.racine_id, up=up, down=down, collateral=collateral)
 
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