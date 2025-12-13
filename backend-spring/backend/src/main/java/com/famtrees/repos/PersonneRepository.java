package com.famtrees.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import com.famtrees.entities.Personne;

public interface PersonneRepository extends Neo4jRepository<Personne, String>{
	
	Optional<Personne> findByPrenomAndNom(String prenom, String nom);
	List<Personne> findByNom(String nom);
	
	// Charger une personne avec ses relations directes
    @Query("""
        MATCH (p:Personne {id: $id})
        OPTIONAL MATCH (p)-[:PARENT_DE]->(e:Personne)
        OPTIONAL MATCH (p)-[:CONJOINT_DANS]->(u:Union)
        OPTIONAL MATCH (p)-[:MEMBRE_DE]->(f:Famille)
        RETURN p, collect(e), collect(u), f
    """)
    Optional<Personne> findWithRelationsById(String id);
    
    
    // Recherche des descendants
    @Query("""
    	    MATCH (p:Personne {id: $id})-[:PARENT_DE*1..$depth]->(descendant)
    	    RETURN collect(DISTINCT descendant)
    	""")
    List<Personne> findDescendants(String id, int depth);
    
    
    //Recherche des ascendants
    @Query("""
    	    MATCH (p:Personne {id: $id})<-[:PARENT_DE*1..$depth]-(ancestor)
    	    RETURN collect(DISTINCT ancestor)
    	""")
    List<Personne> findAncestors(String id, int depth);

}
