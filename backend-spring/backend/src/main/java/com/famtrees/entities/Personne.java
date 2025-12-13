package com.famtrees.entities;

import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDate;
import java.util.*;



@Node("Personne")
public class Personne {
	@Id
    private String id = UUID.randomUUID().toString();

    private String prenom;
    private String nom;
    private String sexe; // M, F,
    private LocalDate dateNaissance;
    private LocalDate dateDeces;
    

    public Personne(String id, String prenom, String nom, String sexe, LocalDate dateNaissance, LocalDate dateDeces,
			List<Personne> enfants, List<Union> unions, Famille famille) {
		super();
		this.id = id;
		this.prenom = prenom;
		this.nom = nom;
		this.sexe = sexe;
		this.dateNaissance = dateNaissance;
		this.dateDeces = dateDeces;
		this.enfants = enfants;
		this.unions = unions;
		this.famille = famille;
	}

	public Personne() {
		super();
		// TODO Auto-generated constructor stub
	}

	// Parent -> Enfant
    @Relationship(type = "PARENT_DE", direction = Relationship.Direction.OUTGOING)
    private List<Personne> enfants = new ArrayList<>();

    // Participation au union
    @Relationship(type = "CONJOINT_DANS", direction = Relationship.Direction.OUTGOING)
    private List<Union> unions = new ArrayList<>();

    // Appartenance familiale
    @Relationship(type = "MEMBRE_DE", direction = Relationship.Direction.OUTGOING)
    private Famille famille;

    
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getPrenom() {
		return prenom;
	}

	public void setPrenom(String prenom) {
		this.prenom = prenom;
	}

	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	public String getSexe() {
		return sexe;
	}

	public void setSexe(String sexe) {
		this.sexe = sexe;
	}

	public LocalDate getDateNaissance() {
		return dateNaissance;
	}

	public void setDateNaissance(LocalDate dateNaissance) {
		this.dateNaissance = dateNaissance;
	}

	public LocalDate getDateDeces() {
		return dateDeces;
	}

	public void setDateDeces(LocalDate dateDeces) {
		this.dateDeces = dateDeces;
	}

	public List<Personne> getEnfants() {
		return enfants;
	}

	public void setEnfants(List<Personne> enfants) {
		this.enfants = enfants;
	}

	public List<Union> getUnions() {
		return unions;
	}

	public void setUnions(List<Union> unions) {
		this.unions = unions;
	}

	public Famille getFamille() {
		return famille;
	}

	public void setFamille(Famille famille) {
		this.famille = famille;
	}
    
    

}
