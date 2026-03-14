package com.famtrees.repos;

import java.util.List;


import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.famtrees.entities.Union;

public interface UnionRepository extends Neo4jRepository<Union, String>{
	
	List<Union> findByType(String type);

}
