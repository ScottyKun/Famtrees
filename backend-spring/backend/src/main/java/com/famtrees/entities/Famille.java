package com.famtrees.entities;


import org.springframework.data.neo4j.core.schema.*;

import java.util.*;

@Node("Famille")

public class Famille {
	@Id
    private String id = UUID.randomUUID().toString();

    private String nom;
    
    @Relationship(type = "MEMBRE_DE", direction = Relationship.Direction.INCOMING)
    private List<Personne> membres = new ArrayList<>();

    
    public Famille(String id, String nom, List<Personne> membres) {
		super();
		this.id = id;
		this.nom = nom;
		this.membres = membres;
	}


	public Famille() {
		super();
		// TODO Auto-generated constructor stub
	}


	public String getId() {
		return id;
	}


	public void setId(String id) {
		this.id = id;
	}


	public String getNom() {
		return nom;
	}


	public void setNom(String nom) {
		this.nom = nom;
	}


	public List<Personne> getMembres() {
		return membres;
	}


	public void setMembres(List<Personne> membres) {
		this.membres = membres;
	}


	

}
