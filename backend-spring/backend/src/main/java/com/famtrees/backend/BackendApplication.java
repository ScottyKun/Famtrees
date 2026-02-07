package com.famtrees.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;

@SpringBootApplication(
	    scanBasePackages = "com.famtrees"
	)
	@EnableNeo4jRepositories(basePackages = "com.famtrees")
	public class BackendApplication {
	    public static void main(String[] args) {
	        SpringApplication.run(BackendApplication.class, args);
	    }
	}

