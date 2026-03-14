"""
tree_gen.py

Construit l'arbre généalogique structuré depuis les données Spring Boot.

Sortie (dict JSON-sérialisable) :
{
  "generations": { "-1": [elementId, ...], "0": [...], ... },
  "persons":     { elementId: { ...champs... } },
  "unions":      { elementId: { "conjoints": [...], "children": [...] } },
  "families":    { elementId: { "members": [...] } }
}

Les clés et valeurs de ids sont les elementId COMPLETS Neo4j
(ex. "4:d71b891d-30e7-44f2-a352-573617564688:0"), exactement comme
Spring Boot les fournit. Aucune transformation n'est appliquée.
"""
from graph_builder import index_graph, compute_generations


def _normalize_sexe(raw):
    v = str(raw or "").upper()
    if v in ("M", "H", "HOMME", "MASCULIN"):
        return "M"
    if v in ("F", "FEMME", "FEMININ", "FÉMININ"):
        return "F"
    return "U"


def build_tree(data, root_id):
    """
    Paramètres
    ----------
    data    : dict  — sortie d'ArbreService.java
              { "racineId": str, "profondeur": int, "nodes": [...], "edges": [...] }
    root_id : str   — elementId complet de la racine
                      ex. "4:d71b891d-30e7-44f2-a352-573617564688:0"

    Retourne
    --------
    dict avec clés : generations, persons, unions, families
    """
    # ── 1. Indexer et nettoyer le graphe ────────────────────────
    nodes_map, outgoing, incoming = index_graph(data)

    # ── 2. Calculer les générations ──────────────────────────────
    raw_gen = compute_generations(root_id, outgoing, incoming)

    # Décalage : la racine → génération -1, ses enfants → 0, etc.
    root_raw = raw_gen.get(root_id, 0)
    offset   = root_raw + 1

    def adj(nid):
        g = raw_gen.get(nid)
        return (g - offset) if g is not None else None

    # ── 3. Collecter les structures depuis les arêtes nettoyées ─
    union_conjoints = {}   # union_id → set(person_id)
    union_children  = {}   # union_id → set(person_id)
    famille_members = {}   # famille_id → set(id)
    famille_to_union = {}  # famille_id → union_id  (via FORME_FAMILLE)

    for nid, edges in outgoing.items():
        for e in edges:
            t, to = e["type"], e["to"]
            if t == "CONJOINT_DANS":
                union_conjoints.setdefault(to, set()).add(nid)
            elif t == "A_ENFANT":
                union_children.setdefault(nid, set()).add(to)
            elif t == "MEMBRE_DE":
                famille_members.setdefault(to, set()).add(nid)
            elif t == "FORME_FAMILLE":
                famille_to_union[nid] = to   # FAMILLE → UNION

    union_to_famille = {v: k for k, v in famille_to_union.items()}

    # ── 4. Initialiser les Personnes ─────────────────────────────
    persons = {}
    for nid, node in nodes_map.items():
        if node["type"] != "PERSONNE":
            continue
        persons[nid] = {
            "id":                    nid,
            "nom":                   node["data"].get("nom"),
            "prenom":                node["data"].get("prenom"),
            "sexe":                  _normalize_sexe(node["data"].get("sexe")),
            "generation":            adj(nid),
            "unions":                [],
            "children_out_of_union": [],
            "families_origin":       [],
            "families_formed":       [],
        }

    # ── 5. Construire Unions et Familles ─────────────────────────
    unions = {}
    for uid in set(union_conjoints) | set(union_children):
        unions[uid] = {
            "id":        uid,
            "conjoints": list(union_conjoints.get(uid, set())),
            "children":  list(union_children.get(uid,  set())),
        }

    families = {
        fid: {"id": fid, "members": list(members)}
        for fid, members in famille_members.items()
    }

    # ── 6. Enrichir les Personnes ────────────────────────────────
    for uid, u in unions.items():
        fam_id = union_to_famille.get(uid)

        for p_id in u["conjoints"]:
            if p_id not in persons:
                continue
            p = persons[p_id]
            if uid not in p["unions"]:
                p["unions"].append(uid)
            if fam_id and fam_id not in p["families_formed"]:
                p["families_formed"].append(fam_id)

        for c_id in u["children"]:
            if c_id not in persons:
                continue
            p = persons[c_id]
            if fam_id and fam_id not in p["families_origin"]:
                p["families_origin"].append(fam_id)

    # ── 7. Grouper par génération ────────────────────────────────
    generations_grouped = {}
    for p_id, p in persons.items():
        g = p["generation"]
        if g is not None:
            generations_grouped.setdefault(str(g), []).append(p_id)

    return {
        "generations": generations_grouped,
        "persons":     persons,
        "unions":      unions,
        "families":    families,
    }