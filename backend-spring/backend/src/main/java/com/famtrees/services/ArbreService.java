package com.famtrees.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;

import com.famtrees.dto.ArbreDTO;
import com.famtrees.dto.EdgeDTO;
import com.famtrees.dto.NodeDTO;

@Service
@Transactional
public class ArbreService {

	private final Neo4jClient client;

    public ArbreService(Neo4jClient neo4jClient) {
        this.client = neo4jClient;
    }

    /**
     * Le motif de traversée Neo4j : Personne <-[CONJOINT_DANS]- Union -[A_ENFANT]->
     * Personne (+ MEMBRE_DE/FORME_FAMILLE pour les familles). Le nombre de sauts
     * (maxHops) est calculé côté Flask (voir tree-flask/lineage.py:required_hops) à
     * partir des 3 axes demandés (up/down/collateral) et transmis ici via le
     * paramètre "profondeur" du controller.
     *
     * Neo4j ne permet pas de paramétrer la borne d'une relation à longueur variable
     * (ex. *0..$n n'est pas supporté) : on doit l'injecter directement dans le texte
     * de la requête. Sans risque d'injection puisque c'est un int déjà validé par
     * Spring (@RequestParam int) — jamais une chaîne fournie par l'appelant.
     */
    private static String buildQuery(int maxHops) {
        return """
                MATCH (root)
                WHERE elementId(root) = $id

                // Étape 1 : collecter les nœuds connexes, jusqu'à maxHops sauts
                OPTIONAL MATCH (root)-[:PARENT_DE|CONJOINT_DANS|A_ENFANT|MEMBRE_DE|FORME_FAMILLE*0..%d]-(node)
                WITH root, collect(DISTINCT node) AS relatives
                WITH relatives + [root] AS all_nodes
                UNWIND all_nodes AS n

                // Étape 2 : pour chaque nœud, ramener ses relations directes
                //           uniquement entre les nœuds de l'ensemble
                OPTIONAL MATCH (n)-[r:PARENT_DE|CONJOINT_DANS|A_ENFANT|MEMBRE_DE|FORME_FAMILLE]-(target)
                WHERE target IN all_nodes

                RETURN n AS node, r, target
                """.formatted(maxHops);
    }

    public ArbreDTO buildArbreComplet(String racineElementId, int profondeur) {

        // Borne de sécurité : quel que soit ce qu'on nous demande, on ne part
        // jamais sans limite sur une famille élargie potentiellement très grande.
        int maxHops = Math.max(profondeur, 0);

        Set<NodeDTO> nodes = new HashSet<>();
        Set<EdgeDTO> edges = new HashSet<>();
 
        client.query(buildQuery(maxHops))
                .bind(racineElementId).to("id")
                .fetch()
                .all()
                .forEach(record -> {
 
                    // ── Nœud source ──────────────────────────────────────────
                    Object nodeObj = record.get("node");
                    if (nodeObj instanceof Node node) {
                        dispatchNode(node, nodes);
                    }
 
                    // ── Nœud cible ───────────────────────────────────────────
                    Object targetObj = record.get("target");
                    if (targetObj instanceof Node target) {
                        dispatchNode(target, nodes);
                    }
 
                    // ── Relation ─────────────────────────────────────────────
                    // La relation r porte son propre type et ses nœuds start/end.
                    // On n'a plus besoin de la reconstruire manuellement.
                    Object relObj = record.get("r");
                    if (relObj instanceof Relationship rel
                            && nodeObj instanceof Node src
                            && targetObj instanceof Node tgt) {
 
                        edges.add(new EdgeDTO(
                                src.elementId(),
                                tgt.elementId(),
                                rel.type()          // type réel stocké en BDD
                        ));
                    }
                });
 
        return new ArbreDTO(
                racineElementId,
                profondeur,            // conservé pour info dans la réponse (nb de sauts utilisé)
                new ArrayList<>(nodes),
                new ArrayList<>(edges)
        );
    }
 
    // =========================================================================
    //  Dispatch : crée le bon NodeDTO selon le label du nœud Neo4j
    // =========================================================================
 
    private void dispatchNode(Node node, Set<NodeDTO> nodes) {
        List<String> labels = new ArrayList<>();
        node.labels().forEach(labels::add);
 
        if (labels.contains("Personne")) {
            nodes.add(buildPersonneNode(node));
        } else if (labels.contains("Union")) {
            nodes.add(buildUnionNode(node));
        } else if (labels.contains("Famille")) {
            nodes.add(buildFamilleNode(node));
        }
        // Autres labels ignorés silencieusement
    }
 
    // ── Constructeurs de NodeDTO ─────────────────────────────────────────────
 
    private NodeDTO buildPersonneNode(Node node) {
        Map<String, Object> data = new HashMap<>();
        data.put("prenom",        node.get("prenom").asString(null));
        data.put("nom",           node.get("nom").asString(null));
        data.put("sexe",          node.get("sexe").asString(null));
        data.put("dateNaissance", node.get("dateNaissance").asObject());
 
        return new NodeDTO(
                node.elementId(),
                node.get("prenom").asString("") + " " + node.get("nom").asString(""),
                "PERSONNE",
                data
        );
    }
 
    private NodeDTO buildUnionNode(Node node) {
        Map<String, Object> data = new HashMap<>();
        data.put("type",      node.get("type").asString(null));
        data.put("libelle",   node.get("libelle").asString(null));
        data.put("dateDebut", node.get("dateDebut").asObject());
 
        return new NodeDTO(
                node.elementId(),
                "Union",
                "UNION",
                data
        );
    }
 
    private NodeDTO buildFamilleNode(Node node) {
        Map<String, Object> data = new HashMap<>();
        data.put("nom", node.get("nom").asString(null));
 
        return new NodeDTO(
                node.elementId(),
                "Famille",
                "FAMILLE",
                data
        );
    }
}