from graph_builder import index_graph, compute_generations


def build_tree(data, root_id):
    nodes, outgoing, incoming = index_graph(data)
    generations = compute_generations(root_id, outgoing, incoming)

    persons = {}
    unions = {}
    families = {}
    generations_grouped = {}

    # --- Initialisation personnes ---
    for node_id, node in nodes.items():

        if node["type"] != "PERSONNE":
            continue

        if node_id not in generations:
            continue

        persons[node_id] = {
            "id": node_id,
            "nom": node["data"].get("nom"),
            "prenom": node["data"].get("prenom"),
            "generation": generations[node_id],
            "unions": [],
            "children_out_of_union": [],
            "families_origin": [],
            "families_formed": []
        }

        generations_grouped.setdefault(
            generations[node_id], []
        ).append(node_id)

    # --- Analyse relations ---
    for from_id, edges in outgoing.items():

        for edge in edges:

            label = edge["type"]   # ✅ correction
            to_id = edge["to"]

            # UNION
            if label == "CONJOINT_DANS":
                unions.setdefault(to_id, {
                    "id": to_id,
                    "conjoints": [],
                    "children": []
                })

                if from_id in persons:
                    unions[to_id]["conjoints"].append(from_id)
                    persons[from_id]["unions"].append(to_id)

            # ENFANT D'UNION
            if label == "A_ENFANT":
                unions.setdefault(from_id, {
                    "id": from_id,
                    "conjoints": [],
                    "children": []
                })

                unions[from_id]["children"].append(to_id)

            # ENFANT HORS UNION
            if label == "PARENT_DE":

                has_union_parent = any(
                    e["type"] == "CONJOINT_DANS"
                    for e in outgoing.get(from_id, [])
                )

                if not has_union_parent and from_id in persons:
                    persons[from_id]["children_out_of_union"].append(to_id)

            # FAMILLE FORMEE
            if label == "FORME_FAMILLE":
                families.setdefault(to_id, {
                    "id": to_id,
                    "members": []
                })

                if from_id in persons:
                    persons[from_id]["families_formed"].append(to_id)

            # MEMBRE FAMILLE ORIGINE
            if label == "MEMBRE_DE":
                families.setdefault(to_id, {
                    "id": to_id,
                    "members": []
                })

                families[to_id]["members"].append(from_id)

                if from_id in persons:
                    persons[from_id]["families_origin"].append(to_id)

    return {
        "generations": generations_grouped,
        "persons": persons,
        "unions": unions,
        "families": families
    }
