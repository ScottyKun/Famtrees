package com.famtrees.repos;

import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.famtrees.entities.Famille;

public interface FamilleRepository extends Neo4jRepository<Famille, String> {
	
	Optional<Famille> findByNom(String nom);


}
