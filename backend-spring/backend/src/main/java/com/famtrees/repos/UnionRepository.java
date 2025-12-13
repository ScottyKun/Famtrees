package com.famtrees.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;

public interface UnionRepository extends Neo4jRepository<Union, String>{
	
	List<Union> findByType(String type);

    @Query("""
        MATCH (u:Union {id: $id})
        OPTIONAL MATCH (p:Personne)-[:CONJOINT_DANS]->(u)
        OPTIONAL MATCH (u)-[:FORME_FAMILLE]->(f:Famille)
        RETURN u, collect(p), f
    """)
    Optional<Union> findWithConjointsById(String id);

    @Query("""
        MATCH (u:Union {id: $id})<-[:CONJOINT_DANS]-(p1:Personne)
		MATCH (u)<-[:CONJOINT_DANS]-(p2:Personne)
		MATCH (p1)-[:PARENT_DE]->(e:Personne)<-[:PARENT_DE]-(p2)
		RETURN DISTINCT e
    """)
    List<Personne> findChildsByUnionId(String id);
}
