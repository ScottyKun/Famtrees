"""
Test manuel, sans dépendances (pas de Neo4j/Spring/DB requis).
Construit un petit arbre synthétique au format ArbreDTO (nodes/edges) et
vérifie la classification produite par lineage.py + le filtrage par axes.

Lancer avec : python3 test_lineage_manual.py
"""

from tree_generator import build_tree
from tree_route import filter_by_axes

# ── Famille synthétique ───────────────────────────────────────────────
# GP_H + GP_F ─U_GP─> Parent, Aunt
# Parent + Spouse ─U_Parent─> Root, Sibling
# Aunt + AuntSpouse ─U_Aunt─> Cousin
# Sibling + SiblingSpouse ─U_Sibling─> Nephew
# Root + RootSpouse ─U_Root─> Child

PERSONS = ["GP_H", "GP_F", "Parent", "Aunt", "Spouse", "AuntSpouse",
           "Root", "Sibling", "Cousin", "SiblingSpouse", "Nephew",
           "RootSpouse", "Child"]

UNIONS = {
    "U_GP":      {"conjoints": ["GP_H", "GP_F"],       "children": ["Parent", "Aunt"]},
    "U_Parent":  {"conjoints": ["Parent", "Spouse"],   "children": ["Root", "Sibling"]},
    "U_Aunt":    {"conjoints": ["Aunt", "AuntSpouse"], "children": ["Cousin"]},
    "U_Sibling": {"conjoints": ["Sibling", "SiblingSpouse"], "children": ["Nephew"]},
    "U_Root":    {"conjoints": ["Root", "RootSpouse"], "children": ["Child"]},
}

nodes = [{"id": pid, "type": "PERSONNE", "data": {"prenom": pid, "nom": "", "sexe": "U"}}
         for pid in PERSONS]
nodes += [{"id": uid, "type": "UNION", "data": {"type": "MARIAGE"}}
          for uid in UNIONS]

edges = []
for uid, u in UNIONS.items():
    for c in u["conjoints"]:
        edges.append({"from": c, "to": uid, "type": "CONJOINT_DANS"})
    for ch in u["children"]:
        edges.append({"from": uid, "to": ch, "type": "A_ENFANT"})

data = {"racineId": "Root", "profondeur": 99, "nodes": nodes, "edges": edges}

tree = build_tree(data, "Root")
persons = tree["persons"]

expected = {
    "Root":          ("ROOT", 0, 0, 0, 0),
    "Parent":        ("ANCESTOR", 1, 0, 0, 0),
    "Spouse":        ("ANCESTOR", 1, 0, 0, 0),
    "GP_H":          ("ANCESTOR", 2, 0, 0, 0),
    "GP_F":          ("ANCESTOR", 2, 0, 0, 0),
    "Sibling":       ("COLLATERAL", 0, 0, 1, 1),
    "SiblingSpouse": ("SPOUSE",    0, 0, 1, 1),   # baseAxis COLLATERAL
    "Nephew":        ("COLLATERAL", 0, 0, 1, 2),
    "Aunt":          ("COLLATERAL", 0, 0, 2, 1),
    "AuntSpouse":    ("SPOUSE",    0, 0, 2, 1),   # baseAxis COLLATERAL
    "Cousin":        ("COLLATERAL", 0, 0, 2, 2),
    "RootSpouse":    ("SPOUSE",    0, 0, 0, 0),   # baseAxis ROOT
    "Child":         ("DESCENDANT", 0, 1, 0, 0),
}

print("=== Classification ===")
ok = True
for pid, (exp_axis, exp_up, exp_down, exp_anchor, exp_order) in expected.items():
    p = persons[pid]
    got = (p["axis"], p["up"], p["down"], p["anchorUp"], p["collateralOrder"])
    exp = (exp_axis, exp_up, exp_down, exp_anchor, exp_order)
    status = "OK " if got == exp else "FAIL"
    if got != exp:
        ok = False
    print(f"[{status}] {pid:15s} got={got} expected={exp}")

print()
print("=== Filtrage up=1, down=1, collateral=1 (fratrie visible, pas les cousins) ===")
filtered = filter_by_axes(tree, "Root", up=1, down=1, collateral=1)
visible = set(filtered["persons"].keys())
print("Visibles :", sorted(visible))
assert "Sibling" in visible, "la fratrie doit être visible avec collateral=1"
assert "Cousin" not in visible, "les cousins ne doivent PAS être visibles avec up=1 (anchorUp=2 > up=1)"
assert "Aunt" not in visible, "les oncles/tantes ne doivent PAS être visibles avec up=1"
assert "GP_H" not in visible, "les grands-parents ne doivent pas être visibles avec up=1"

print()
print("=== Filtrage up=2, down=1, collateral=2 (cousins + oncles/tantes visibles) ===")
filtered2 = filter_by_axes(tree, "Root", up=2, down=1, collateral=2)
visible2 = set(filtered2["persons"].keys())
print("Visibles :", sorted(visible2))
assert "Cousin" in visible2, "les cousins doivent être visibles avec up=2, collateral=2"
assert "Aunt" in visible2
assert "GP_H" in visible2 and "GP_F" in visible2

print()
print("TOUT EST OK" if ok else "DES ASSERTIONS DE CLASSIFICATION ONT ÉCHOUÉ")