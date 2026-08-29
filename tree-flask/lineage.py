"""
lineage.py

Classifie chaque personne de l'arbre par rapport à une racine donnée,
selon 3 axes indépendants au lieu d'un seul "depth" global :

  - ANCESTOR    : ancêtre direct (parent, grand-parent, ...)      -> champ "up"
  - DESCENDANT  : descendant direct (enfant, petit-enfant, ...)   -> champ "down"
  - COLLATERAL  : parent "de côté" (fratrie, oncles/tantes,
                  cousins, neveux/nièces...)                       -> champs "anchorUp" + "collateralOrder"
  - SPOUSE      : conjoint d'une personne déjà classifiée (coût 0, hérite
                  des coordonnées du partenaire via "baseAxis")
  - ROOT        : la personne centrale elle-même

Pourquoi séparer "génération" et "collatéralité" ?
Le simple numéro de génération (déjà calculé par graph_builder.compute_generations)
place la fratrie ET les cousins germains ET les oncles/tantes au même niveau
que la racine ou ses parents. Il ne permet donc pas de répondre à la question
"depth=1 doit-il montrer ma fratrie sans montrer mes cousins ?" — d'où ce module.

Définitions (classiques en généalogie) :
  - anchorUp=1, collateralOrder=1  -> fratrie (frères/sœurs)
  - anchorUp=1, collateralOrder=2  -> neveux/nièces
  - anchorUp=2, collateralOrder=1  -> oncles/tantes
  - anchorUp=2, collateralOrder=2  -> cousins germains
  - anchorUp=2, collateralOrder=3  -> enfants de cousins germains
  - etc.

Entrée : persons (dict id -> dict avec au moins "id"), unions (dict id -> {"conjoints": [...], "children": [...]})
         tels que produits par tree_generator.build_tree() AVANT le calcul de lineage.
Sortie : mutate persons en place, ajoute pour chaque personne classifiée :
         axis, baseAxis, up, down, anchorUp, collateralOrder
"""

from collections import deque

DEFAULT_MAX_COLLATERAL_ORDER = 8  # garde-fou anti-explosion sur de très grandes familles


def enrich_with_lineage(persons, unions, root_id, max_collateral_order=DEFAULT_MAX_COLLATERAL_ORDER):
    if root_id not in persons:
        return

    # ── Index utilitaires ────────────────────────────────────────────
    birth_unions = {}  # person_id -> [union_id, ...] (personne = enfant de cette union)
    own_unions = {}    # person_id -> [union_id, ...] (personne = conjoint dans cette union)
    for uid, u in unions.items():
        for c in u["children"]:
            birth_unions.setdefault(c, []).append(uid)
        for p in u["conjoints"]:
            own_unions.setdefault(p, []).append(uid)

    lineage = {
        root_id: {"axis": "ROOT", "baseAxis": "ROOT", "up": 0, "down": 0,
                  "anchorUp": 0, "collateralOrder": 0}
    }
    visited = {root_id}

    # ── 1. Ancêtres directs (remontée via unions de naissance) ─────────
    ancestor_levels = {0: {root_id}}
    frontier = {root_id}
    level = 0
    while frontier:
        level += 1
        nxt = set()
        for pid in frontier:
            for uid in birth_unions.get(pid, []):
                for parent in unions[uid]["conjoints"]:
                    if parent in visited:
                        continue
                    visited.add(parent)
                    nxt.add(parent)
                    lineage[parent] = {"axis": "ANCESTOR", "baseAxis": "ANCESTOR",
                                        "up": level, "down": 0,
                                        "anchorUp": 0, "collateralOrder": 0}
        if nxt:
            ancestor_levels[level] = nxt
        frontier = nxt

    # ── 2. Descendants directs (descente via propres unions) ───────────
    frontier = {root_id}
    level = 0
    while frontier:
        level += 1
        nxt = set()
        for pid in frontier:
            for uid in own_unions.get(pid, []):
                for child in unions[uid]["children"]:
                    if child in visited:
                        continue
                    visited.add(child)
                    nxt.add(child)
                    lineage[child] = {"axis": "DESCENDANT", "baseAxis": "DESCENDANT",
                                       "up": 0, "down": level,
                                       "anchorUp": 0, "collateralOrder": 0}
        frontier = nxt

    # ── 3. Collatéraux : pour chaque ancêtre direct, explorer SES autres
    #      branches (celles qui ne mènent pas vers la racine) ──────────
    q = deque()
    for up_dist, ancestors in ancestor_levels.items():
        if up_dist == 0:
            continue
        for anc in ancestors:
            for uid in own_unions.get(anc, []):
                for child in unions[uid]["children"]:
                    if child not in visited:
                        q.append((child, up_dist, 1))

    while q:
        pid, anchor_up, order = q.popleft()
        if pid in visited or order > max_collateral_order:
            continue
        visited.add(pid)
        lineage[pid] = {"axis": "COLLATERAL", "baseAxis": "COLLATERAL",
                         "up": 0, "down": 0,
                         "anchorUp": anchor_up, "collateralOrder": order}
        for uid in own_unions.get(pid, []):
            for child in unions[uid]["children"]:
                if child not in visited:
                    q.append((child, anchor_up, order + 1))

    # ── 4. Conjoints : coût 0, héritent des coordonnées du partenaire ──
    changed = True
    while changed:
        changed = False
        for pid in list(lineage.keys()):
            info = lineage[pid]
            for uid in own_unions.get(pid, []):
                for partner in unions[uid]["conjoints"]:
                    if partner == pid or partner in lineage:
                        continue
                    lineage[partner] = {
                        "axis": "SPOUSE",
                        "baseAxis": info["baseAxis"],
                        "up": info["up"], "down": info["down"],
                        "anchorUp": info["anchorUp"], "collateralOrder": info["collateralOrder"],
                    }
                    visited.add(partner)
                    changed = True

    # ── 5. Écrire les résultats dans persons ────────────────────────────
    # "generation" est réutilisé comme niveau vertical d'affichage (racine=0) —
    # remplace l'ancien calcul BFS de graph_builder.compute_generations, qui
    # plaçait la racine à -1 par convention historique et ne correspondait
    # plus à rien d'utile une fois le modèle à 3 axes en place.
    for pid, info in lineage.items():
        if pid in persons:
            persons[pid].update(info)
            persons[pid]["generation"] = compute_level(info)


def compute_level(info):
    """
    Niveau vertical intuitif pour l'affichage (racine = 0, négatif = ascendance,
    positif = descendance) — indépendant du champ historique "generation" (BFS
    brut avec décalage) qui n'est plus fiable pour l'affichage.

    ANCESTOR   : -up            (parent = -1, grand-parent = -2, ...)
    DESCENDANT : +down          (enfant = +1, petit-enfant = +2, ...)
    COLLATERAL : order - anchorUp
        fratrie        (anchorUp=1, order=1) → 0   (même génération que la racine)
        neveux/nièces  (anchorUp=1, order=2) → +1
        oncles/tantes  (anchorUp=2, order=1) → -1  (même génération que les parents)
        cousins germains (anchorUp=2, order=2) → 0
    SPOUSE : même niveau que le partenaire (calculé via baseAxis + mêmes coordonnées)
    ROOT : 0
    """
    axis = info.get("baseAxis", info.get("axis"))
    if axis == "ROOT":
        return 0
    if axis == "ANCESTOR":
        return -info["up"]
    if axis == "DESCENDANT":
        return info["down"]
    if axis == "COLLATERAL":
        return info["collateralOrder"] - info["anchorUp"]
    return 0


def is_visible(info, up=1, down=1, collateral=1):
    """
    info : dict tel que produit par enrich_with_lineage (un person["axis"], etc.)
    up / down / collateral : bornes demandées par le client (query params)
    """
    axis = info.get("baseAxis", info.get("axis"))
    if axis == "ROOT":
        return True
    if axis == "ANCESTOR":
        return info["up"] <= up
    if axis == "DESCENDANT":
        return info["down"] <= down
    if axis == "COLLATERAL":
        return info["anchorUp"] <= up and info["collateralOrder"] <= collateral
    return False


def required_hops(up=1, down=1, collateral=1, margin=2):
    """
    Nombre maximum de sauts (relations) nécessaires dans le graphe Neo4j
    pour que la classification ci-dessus puisse être calculée correctement,
    càd pour être sûr de ramener toutes les personnes potentiellement
    visibles avec ces bornes (up/down/collateral) — et pas plus.

    Coût par saut dans le modèle Personne <-[CONJOINT_DANS]- Union -[A_ENFANT]->
    Personne :
      - 1 génération d'ascendance ou de descendance directe = 2 sauts
        (Personne -> Union -> Personne)
      - Atteindre un collatéral à anchorUp=U, collateralOrder=O coûte :
        2*U (monter à l'ancêtre commun) + 1 (rejoindre son union) +
        (2*O - 1) (redescendre O générations) = 2*(U + O) sauts

    On prend le pire des deux directions, plus une marge pour les conjoints
    supplémentaires rencontrés en route (coût 0 dans le modèle logique mais
    +1 saut dans le graphe réel).
    """
    up_side = 2 * (max(up, 0) + max(collateral, 0))
    down_side = 2 * max(down, 0)
    return max(up_side, down_side) + margin