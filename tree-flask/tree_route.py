from flask import Blueprint, jsonify, request
import requests
from tree_generator import build_tree

tree_bp = Blueprint("tree", __name__)

SPRING_BASE_URL = "http://localhost:8070/api/arbres"


@tree_bp.route("/tree/<path:root_id>")
def get_tree(root_id):

    depth = request.args.get("depth", default=3, type=int)

    try:
        spring_url = f"{SPRING_BASE_URL}/{root_id}?depth={depth}"

        response = requests.get(spring_url)

        if response.status_code != 200:
            return jsonify({
                "error": "Erreur Spring API",
                "details": response.text
            }), 500

        data = response.json()

        print("Données reçues de Spring API:", data)
        
        tree = build_tree(data, root_id)

        return jsonify(tree)

    except Exception as e:
        return jsonify({
            "error": "Erreur Flask",
            "details": str(e)
        }), 500
