package com.famtrees.repos;

import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import com.famtrees.entities.Famille;

public interface FamilleRepository extends Neo4jRepository<Famille, String> {
	
	Optional<Famille> findByNom(String nom);

    @Query("""
        MATCH (f:Famille {id: $id})
        OPTIONAL MATCH (p:Personne)-[:MEMBRE_DE]->(f)
        RETURN f, collect(p)
    """)
    Optional<Famille> findWithMembresById(String id);

}
