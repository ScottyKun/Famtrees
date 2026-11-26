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
from graph_builder import index_graph
from lineage import enrich_with_lineage


def _normalize_sexe(raw):
    v = str(raw or "").upper()
    if v in ("M", "H", "HOMME", "MASCULIN"):
        return "M"
    if v in ("F", "FEMME", "FEMININ", "FÉMININ"):
        return "F"
    return "U"


def _normalize_date(raw):
    """
    Spring sérialise un LocalDate soit en "YYYY-MM-DD" (Jackson JavaTimeModule,
    défaut Spring Boot), soit en tableau [YYYY, M, D] selon la config.
    On renvoie toujours une chaîne ISO (ou None) : le front s'en sert pour
    ordonner les fratries par âge.
    """
    if raw is None:
        return None
    if isinstance(raw, (list, tuple)) and len(raw) >= 3:
        return f"{int(raw[0]):04d}-{int(raw[1]):02d}-{int(raw[2]):02d}"
    if isinstance(raw, dict) and "year" in raw:
        return f"{int(raw['year']):04d}-{int(raw.get('monthValue', raw.get('month', 1))):02d}-{int(raw.get('dayOfMonth', raw.get('day', 1))):02d}"
    return str(raw)[:10]


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

    # ── 2. Collecter les structures depuis les arêtes nettoyées ─
    union_conjoints  = {}   # union_id → set(person_id)
    union_children   = {}   # union_id → set(person_id)
    famille_members  = {}   # famille_id → set(id)
    union_to_famille = {}   # union_id → famille_id  (via FORME_FAMILLE, sens UNION→FAMILLE)

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
                union_to_famille[nid] = to   # nid = union, to = famille

    # ── 3. Initialiser les Personnes ─────────────────────────────
    # "generation" est calculé plus bas (étape 6bis, via lineage.compute_level) —
    # None ici tant que la classification n'est pas passée (personnes hors
    # périmètre de la racine, cas normalement inexistant mais gardé par sécurité).
    persons = {}
    for nid, node in nodes_map.items():
        if node["type"] != "PERSONNE":
            continue
        persons[nid] = {
            "id":                    nid,
            "nom":                   node["data"].get("nom"),
            "prenom":                node["data"].get("prenom"),
            "sexe":                  _normalize_sexe(node["data"].get("sexe")),
            "dateNaissance":         _normalize_date(node["data"].get("dateNaissance")),
            "generation":            None,
            "unions":                [],
            "children_out_of_union": [],
            "families_origin":       [],
            "families_formed":       [],
        }

    # ── 4. Construire Unions et Familles ─────────────────────────
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

    # ── 5. Enrichir les Personnes ────────────────────────────────
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

    # ── 6. Classifier chaque personne (lignée directe / collatérale) et
    #      calculer "generation" comme niveau vertical d'affichage ──────
    enrich_with_lineage(persons, unions, root_id)

    # ── 7. Grouper par génération (niveau vertical) ────────────────
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