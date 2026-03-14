"""
graph_builder.py

Deux responsabilités :
  1. index_graph()         — indexe et NETTOIE les arêtes depuis Spring Boot
  2. compute_generations() — calcule les générations depuis les arêtes propres

On travaille avec les elementId complets Neo4j :
  ex. "4:d71b891d-30e7-44f2-a352-573617564688:0"
Aucune transformation d'id n'est faite ici.

Pourquoi nettoyer les arêtes ?
La requête Cypher utilise une direction libre (-) pour traverser le graphe.
Neo4j retourne donc chaque relation dans les deux sens.
Ex. :  PERSONNE --[CONJOINT_DANS]--> UNION   (✓ sens canonique)
       UNION    --[CONJOINT_DANS]--> PERSONNE (✗ sens inversé, à ignorer)
Sans ce filtre, le BFS de générations produit des résultats aberrants.
"""
from collections import deque


# ─── Sens canonique de chaque type de relation ───────────────────────────────
CANONICAL = {
    "PARENT_DE":     ("PERSONNE", "PERSONNE"),
    "CONJOINT_DANS": ("PERSONNE", "UNION"),
    "A_ENFANT":      ("UNION",    "PERSONNE"),
    "FORME_FAMILLE": ("FAMILLE",  "UNION"),
    "MEMBRE_DE":     ("PERSONNE", "FAMILLE"),
}


def _filter_canonical(edges, nodes_map):
    """Garde uniquement les arêtes dont la direction correspond au sens canonique."""
    result = []
    for e in edges:
        rule     = CANONICAL.get(e["type"])
        type_fr  = nodes_map.get(e["from"], {}).get("type")
        type_to  = nodes_map.get(e["to"],   {}).get("type")
        if rule and type_fr == rule[0] and type_to == rule[1]:
            result.append(e)
    return result


def _compute_raw_gen(root_id, edges):
    """
    BFS en 3 niveaux pour ancrer correctement les générations.

    Niveau 1 — A_ENFANT, CONJOINT_DANS, FORME_FAMILLE
        Structure verticale et liens forts. MEMBRE_DE est exclu ici car
        il propage horizontalement et peut court-circuiter la verticalité
        (ex. : Marie-Laurianne reçoit gen=0 via Famille avant gen=1 via A_ENFANT).

    Niveau 2 — MEMBRE_DE
        Complète les nœuds Famille et Personne non encore atteints.

    Niveau 3 — PARENT_DE
        Complétion finale pour les Personnes qui n'ont pas de lien Union.
    """
    out, inc = {}, {}
    for e in edges:
        out.setdefault(e["from"], []).append(e)
        inc.setdefault(e["to"],   []).append(e)

    gen = {}
    visited = set()
    q = deque([(root_id, 0)])

    # Niveau 1
    while q:
        nid, lvl = q.popleft()
        if nid in visited:
            continue
        visited.add(nid)
        gen[nid] = lvl
        for e in out.get(nid, []):
            t, to = e["type"], e["to"]
            if to in visited or t in ("PARENT_DE", "MEMBRE_DE"):
                continue
            q.append((to, lvl + 1 if t == "A_ENFANT" else lvl))
        for e in inc.get(nid, []):
            t, fr = e["type"], e["from"]
            if fr in visited or t in ("PARENT_DE", "MEMBRE_DE"):
                continue
            q.append((fr, lvl - 1 if t == "A_ENFANT" else lvl))

    # Niveau 2 : MEMBRE_DE
    changed = True
    while changed:
        changed = False
        for e in edges:
            if e["type"] != "MEMBRE_DE":
                continue
            fr, to = e["from"], e["to"]
            if fr in gen and to not in gen:
                gen[to] = gen[fr]; changed = True
            elif to in gen and fr not in gen:
                gen[fr] = gen[to]; changed = True

    # Niveau 3 : PARENT_DE
    changed = True
    while changed:
        changed = False
        for e in edges:
            if e["type"] != "PARENT_DE":
                continue
            fr, to = e["from"], e["to"]
            if fr in gen and to not in gen:
                gen[to] = gen[fr] + 1; changed = True
            elif to in gen and fr not in gen:
                gen[fr] = gen[to] - 1; changed = True

    return gen


def index_graph(data):
    """
    Point d'entrée principal.

    Paramètre
    ---------
    data : dict retourné par ArbreService.java Spring Boot
           { "racineId": str, "profondeur": int, "nodes": [...], "edges": [...] }

    Retourne
    --------
    nodes_map : dict { elementId → node_dict }
    outgoing  : dict { elementId → [edge, ...] }   arêtes sortantes nettoyées
    incoming  : dict { elementId → [edge, ...] }   arêtes entrantes nettoyées
    """
    nodes_map = {n["id"]: n for n in data["nodes"]}
    root_id   = data.get("racineId")

    # 1. Filtrer le sens canonique
    canonical = _filter_canonical(data["edges"], nodes_map)

    # 2. Calculer les générations brutes (pour filtrer PARENT_DE directionnel)
    raw_gen = _compute_raw_gen(root_id, canonical)

    # 3. Supprimer les PARENT_DE « remontants » (enfant → parent)
    clean = []
    for e in canonical:
        if e["type"] == "PARENT_DE":
            gf = raw_gen.get(e["from"])
            gt = raw_gen.get(e["to"])
            if gf is not None and gt is not None and gf >= gt:
                continue   # sens inversé, on jette
        clean.append(e)

    # 4. Indexer
    outgoing, incoming = {}, {}
    for e in clean:
        outgoing.setdefault(e["from"], []).append(e)
        incoming.setdefault(e["to"],   []).append(e)

    return nodes_map, outgoing, incoming


def compute_generations(root_id, outgoing, incoming):
    """
    BFS final sur les arêtes déjà nettoyées.
    Appelé par tree_gen.build_tree() après index_graph().
    Retourne dict { elementId → int (génération brute, racine = 0) }.
    """
    gen = {}
    visited = set()
    q = deque([(root_id, 0)])

    while q:
        nid, lvl = q.popleft()
        if nid in visited:
            continue
        visited.add(nid)
        gen[nid] = lvl

        for e in outgoing.get(nid, []):
            t, to = e["type"], e["to"]
            if to not in visited:
                q.append((to, lvl + 1 if t in ("A_ENFANT", "PARENT_DE") else lvl))

        for e in incoming.get(nid, []):
            t, fr = e["type"], e["from"]
            if fr not in visited:
                q.append((fr, lvl - 1 if t in ("A_ENFANT", "PARENT_DE") else lvl))

    return gen