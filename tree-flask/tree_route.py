from flask import Blueprint, jsonify, request
import requests
from tree_generator import build_tree
from lineage import is_visible, required_hops

tree_bp = Blueprint("tree", __name__)

SPRING_BASE_URL = "http://localhost:8070/api/arbres"

# Cap de sécurité quand aucun filtre n'est demandé (vue "arbre complet").
# Volontairement large plutôt qu'illimité : évite un scan sans borne sur une
# très grande famille élargie tout en couvrant tout cas réaliste (~20 générations).
FULL_TREE_HOPS_CAP = 40


def filter_by_axes(tree, root_id, up=1, down=1, collateral=1):
    """
    Filtre l'arbre autour de la racine selon 3 axes indépendants
    (voir lineage.py pour la classification et les définitions) :

      up         : nb de générations d'ascendance directe (parents, grands-parents...)
      down       : nb de générations de descendance directe (enfants, petits-enfants...)
      collateral : nb de "sauts de côté" à partir de chaque ancêtre direct
                   (1 = fratrie/oncles-tantes, 2 = cousins/neveux-nièces, ...)

    Un conjoint (SPOUSE) hérite des coordonnées de son partenaire, donc il
    apparaît/disparaît toujours avec lui, sans coût de profondeur supplémentaire.

    Unions et Familles sont filtrées en cohérence :
      - Union gardée si au moins un conjoint est dans les personnes gardées.
      - Famille gardée si au moins un membre est dans les personnes gardées.
      - Les listes internes (children, conjoints, members) sont purgées
        des ids hors périmètre.
    """
    persons  = tree["persons"]
    unions   = tree["unions"]
    families = tree["families"]

    # ── 1. Personnes dans le périmètre ───────────────────────────
    allowed_persons = {
        pid for pid, p in persons.items()
        if "axis" in p and is_visible(p, up=up, down=down, collateral=collateral)
    }

    allowed_gens = {
        g for g, ids in tree["generations"].items()
        if any(pid in allowed_persons for pid in ids)
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

    # Nouveaux paramètres V2 (voir filter_by_axes / lineage.py)
    up         = request.args.get("up",         default=None, type=int)
    down       = request.args.get("down",       default=None, type=int)
    collateral = request.args.get("collateral", default=None, type=int)

    # Alias legacy : ?depth=N seul équivaut à up=1, down=N, collateral=1
    # (se rapproche du comportement V1 mais inclut désormais la fratrie par défaut)
    depth = request.args.get("depth", default=None, type=int)
    if depth is not None:
        up         = up         if up         is not None else 1
        down       = down       if down       is not None else depth
        collateral = collateral if collateral is not None else 1

    any_filter_requested = any(v is not None for v in (up, down, collateral))

    # Sauts Neo4j nécessaires côté Spring pour couvrir ce qui sera affiché
    # (voir lineage.required_hops). Sans filtre demandé : cap large plutôt
    # que la requête sans borne d'avant.
    if any_filter_requested:
        hops = required_hops(
            up=up if up is not None else 1,
            down=down if down is not None else 1,
            collateral=collateral if collateral is not None else 1,
        )
    else:
        hops = FULL_TREE_HOPS_CAP

    try:
        spring_url = f"{SPRING_BASE_URL}/{root_id}"
        response = requests.get(spring_url, params={"depth": hops})

        if response.status_code != 200:
            return jsonify({
                "error":   "Erreur Spring API",
                "details": response.text
            }), 500

        data = response.json()

        tree = build_tree(data, root_id)

        # Appliquer le filtre si au moins un des 3 paramètres est demandé
        if any_filter_requested and root_id in tree["persons"]:
            tree = filter_by_axes(
                tree, root_id,
                up=up if up is not None else 1,
                down=down if down is not None else 1,
                collateral=collateral if collateral is not None else 1,
            )

        return jsonify(tree)

    except Exception as e:
        import traceback
        return jsonify({
            "error":   "Erreur Flask",
            "details": str(e),
            "trace":   traceback.format_exc()
        }), 500