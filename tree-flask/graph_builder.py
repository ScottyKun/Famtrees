def index_graph(data):
    nodes = {n["id"]: n for n in data["nodes"]}

    outgoing = {}
    incoming = {}

    for edge in data["edges"]:
        outgoing.setdefault(edge["from"], []).append(edge)
        incoming.setdefault(edge["to"], []).append(edge)

    return nodes, outgoing, incoming



from collections import deque

def compute_generations(root_id, outgoing, incoming):
    generations = {}
    visited = set()

    queue = deque([(root_id, 0)])

    while queue:
        node_id, level = queue.popleft()

        if node_id in visited:
            continue

        visited.add(node_id)
        generations[node_id] = level

        # Descendants
        for edge in outgoing.get(node_id, []):
            if edge["type"] == "PARENT_DE":
                queue.append((edge["to"], level + 1))

        # Ascendants
        for edge in incoming.get(node_id, []):
            if edge["type"] == "PARENT_DE":
                queue.append((edge["from"], level - 1))

        # Conjoints
        for edge in outgoing.get(node_id, []):
            if edge["type"] == "CONJOINT_DANS":
                queue.append((edge["to"], level))

        for edge in incoming.get(node_id, []):
            if edge["type"] == "CONJOINT_DANS":
                queue.append((edge["from"], level))

    return generations
