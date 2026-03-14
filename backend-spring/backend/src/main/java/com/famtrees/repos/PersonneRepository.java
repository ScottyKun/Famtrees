package com.famtrees.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.famtrees.entities.Personne;

public interface PersonneRepository extends Neo4jRepository<Personne, String>{
	
	Optional<Personne> findByPrenomAndNom(String prenom, String nom);
	List<Personne> findByNom(String nom);
	
	
}
