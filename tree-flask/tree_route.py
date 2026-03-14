from flask import Blueprint, jsonify, request
import requests
from tree_generator import build_tree

tree_bp = Blueprint("tree", __name__)

SPRING_BASE_URL = "http://localhost:8070/api/arbres"


def filter_by_depth(tree, root_id, depth):
    """
    Filtre l'arbre autour de la racine selon la profondeur demandée.

    Logique :
      - La génération de la racine est le point d'ancrage (gen_root).
      - On inclut toujours 1 niveau au-dessus (gen_root - 1) pour voir
        les parents directs de la racine.
      - On descend jusqu'à gen_root + depth.

      depth=0 → racine + ses parents directs
      depth=1 → + ses enfants
      depth=2 → + ses petits-enfants
      ...

    Unions et Familles sont filtrées en cohérence :
      - Union gardée si au moins un conjoint est dans les personnes gardées.
      - Famille gardée si au moins un membre est dans les personnes gardées.
      - Les listes internes (children, conjoints, members) sont purgées
        des ids hors périmètre.
    """
    persons  = tree["persons"]
    unions   = tree["unions"]
    families = tree["families"]

    root_gen    = persons[root_id]["generation"]
    min_allowed = root_gen - 1          # 1 niveau d'ascendance toujours visible
    max_allowed = root_gen + depth      # N niveaux de descendance

    # ── 1. Personnes dans le périmètre ───────────────────────────
    allowed_persons = {
        pid for pid, p in persons.items()
        if p["generation"] is not None
        and min_allowed <= p["generation"] <= max_allowed
    }

    allowed_gens = {
        g for g in tree["generations"]
        if min_allowed <= int(g) <= max_allowed
    }

    # ── 2. Unions : garder si au moins un conjoint est visible ───
    allowed_unions = {
        uid for uid, u in unions.items()
        if any(c in allowed_persons for c in u["conjoints"])
    }

    # ── 3. Familles : garder si au moins un membre est visible ───
    allowed_families = {
        fid for fid, f in families.items()
        if any(m in allowed_persons for m in f["members"])
    }

    # ── 4. Reconstruire avec listes internes purgées ─────────────
    filtered_unions = {}
    for uid in allowed_unions:
        u = dict(unions[uid])
        u["conjoints"] = [c for c in u["conjoints"] if c in allowed_persons]
        u["children"]  = [c for c in u["children"]  if c in allowed_persons]
        filtered_unions[uid] = u

    filtered_families = {}
    for fid in allowed_families:
        f = dict(families[fid])
        f["members"] = [m for m in f["members"] if m in allowed_persons]
        filtered_families[fid] = f

    filtered_persons = {
        pid: p for pid, p in persons.items() if pid in allowed_persons
    }
    # Purger les références hors périmètre dans chaque personne
    for p in filtered_persons.values():
        p["unions"]           = [u for u in p["unions"]           if u in allowed_unions]
        p["families_formed"]  = [f for f in p["families_formed"]  if f in allowed_families]
        p["families_origin"]  = [f for f in p["families_origin"]  if f in allowed_families]

    filtered_gens = {
        g: [pid for pid in ids if pid in allowed_persons]
        for g, ids in tree["generations"].items()
        if g in allowed_gens
    }

    return {
        "generations": filtered_gens,
        "persons":     filtered_persons,
        "unions":      filtered_unions,
        "families":    filtered_families,
    }


@tree_bp.route("/tree/<path:root_id>")
def get_tree(root_id):

    depth = request.args.get("depth", default=None, type=int)

    try:
        spring_url = f"{SPRING_BASE_URL}/{root_id}"
        response = requests.get(spring_url)

        if response.status_code != 200:
            return jsonify({
                "error":   "Erreur Spring API",
                "details": response.text
            }), 500

        data = response.json()

        tree = build_tree(data, root_id)

        # Appliquer le filtre de profondeur si demandé
        if depth is not None and root_id in tree["persons"]:
            tree = filter_by_depth(tree, root_id, depth)

        return jsonify(tree)

    except Exception as e:
        import traceback
        return jsonify({
            "error":   "Erreur Flask",
            "details": str(e),
            "trace":   traceback.format_exc()
        }), 500