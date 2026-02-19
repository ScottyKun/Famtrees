package com.famtrees.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.neo4j.driver.types.Node;


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

    public ArbreDTO buildArbreComplet(String racineElementId, int profondeur) {

        String query = String.format("""
            MATCH (root:Personne)
            WHERE elementId(root) = $id
            
            OPTIONAL MATCH (root)-[:PARENT_DE*0..%d]-(relative:Personne)
            WITH collect(DISTINCT root) + collect(DISTINCT relative) AS personnes
            
            UNWIND personnes AS p
            
            OPTIONAL MATCH (p)-[:PARENT_DE]->(parent:Personne)
            OPTIONAL MATCH (p)-[:CONJOINT_DANS]->(u:Union)
            OPTIONAL MATCH (u)-[:A_ENFANT]->(child:Personne)
            OPTIONAL MATCH (u)-[:FORME_FAMILLE]->(f:Famille)
            OPTIONAL MATCH (f)<-[:MEMBRE_DE]-(member:Personne)

            RETURN DISTINCT p, u, child, f, member, parent
        """, profondeur);

        Set<NodeDTO> nodes = new HashSet<>();
        Set<EdgeDTO> edges = new HashSet<>();

        client.query(query)
                .bind(racineElementId).to("id")
                .fetch()
                .all()
                .forEach(record -> {

                    addPersonNode(record.get("p"), nodes);
                    addPersonNode(record.get("child"), nodes);
                    addPersonNode(record.get("member"), nodes);
                    addUnionNode(record.get("u"), nodes);
                    addFamilleNode(record.get("f"), nodes);
                    addPersonNode(record.get("parent"), nodes);
                    
                    addEdge(record.get("p"), record.get("parent"), "PARENT_DE", edges);
                    addEdge(record.get("p"), record.get("u"), "CONJOINT_DANS", edges);
                    addEdge(record.get("u"), record.get("child"), "A_ENFANT", edges);
                    addEdge(record.get("u"), record.get("f"), "FORME_FAMILLE", edges);
                    addEdge(record.get("member"), record.get("f"), "MEMBRE_DE", edges);
                });

        return new ArbreDTO(
                racineElementId,
                profondeur,
                new ArrayList<>(nodes),
                new ArrayList<>(edges)
        );
    }

    // =========================
    // Méthodes utilitaires
    // =========================

    private void addPersonNode(Object nodeObj, Set<NodeDTO> nodes) {
        if (nodeObj == null) return;

        Node node = (Node) nodeObj;

        Map<String, Object> data = new HashMap<>();
        data.put("prenom", node.get("prenom").asString(null));
        data.put("nom", node.get("nom").asString(null));
        data.put("sexe", node.get("sexe").asString(null));
        data.put("dateNaissance", node.get("dateNaissance").asObject());


        nodes.add(new NodeDTO(
                node.elementId(),
                node.get("prenom").asString("") + " " + node.get("nom").asString(""),
                "PERSONNE",
                data
        ));
    }


    private void addUnionNode(Object nodeObj, Set<NodeDTO> nodes) {
        if (nodeObj == null) return;

        Node node = (Node) nodeObj;

        Map<String, Object> data = new HashMap<>();
        data.put("type", node.get("type").asString(null));
        data.put("dateDebut", node.get("dateDebut").asObject());

        nodes.add(new NodeDTO(
                node.elementId(),
                "Union",
                "UNION",
                data
        ));
    }


    private void addFamilleNode(Object nodeObj, Set<NodeDTO> nodes) {
        if (nodeObj == null) return;

        Node node = (Node) nodeObj;

        nodes.add(new NodeDTO(
                node.elementId(),
                "Famille",
                "FAMILLE",
                Map.of()
        ));
    }


    private void addEdge(Object fromObj, Object toObj, String type, Set<EdgeDTO> edges) {
        if (fromObj == null || toObj == null) return;

        Node from = (Node) fromObj;
        Node to = (Node) toObj;

        edges.add(new EdgeDTO(
                from.elementId(),
                to.elementId(),
                type
        ));
    }

}
