package com.famtrees.entities;

import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDate;
import java.util.*;

@Node("Union")

public class Union {
	@Id
	@GeneratedValue
    private String id;

    private String type; // MARIAGE, UNION_LIBRE, RELIGIEUX
    
    private String libelle;

    public String getLibelle() {
		return libelle;
	}

	public void setLibelle(String libelle) {
		this.libelle = libelle;
	}

	private LocalDate dateDebut;
    private LocalDate dateFin;

    // Participants
    @Relationship(type = "CONJOINT_DANS", direction = Relationship.Direction.INCOMING)
    private List<Personne> conjoints = new ArrayList<>();

    // Famille formée par cette union
    @Relationship(type = "FORME_FAMILLE", direction = Relationship.Direction.OUTGOING)
    private Famille famille;
    
    // Enfants de l'union
    @Relationship(type = "A_ENFANT", direction = Relationship.Direction.OUTGOING)
    private List<Personne> enfants = new ArrayList<>();

    
    public Union(String id, String type, LocalDate dateDebut, LocalDate dateFin, List<Personne> conjoints,
    			Famille famille, List<Personne> enfants, String libelle) {
		super();
		this.id = id;
		this.type = type;
		this.dateDebut = dateDebut;
		this.dateFin = dateFin;
		this.conjoints = conjoints;
		this.famille = famille;
		this.enfants = enfants;
		this.libelle = libelle;
	}

	public Union() {
		super();
		// TODO Auto-generated constructor stub
	}

	//
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public LocalDate getDateDebut() {
		return dateDebut;
	}

	public void setDateDebut(LocalDate dateDebut) {
		this.dateDebut = dateDebut;
	}

	public LocalDate getDateFin() {
		return dateFin;
	}

	public void setDateFin(LocalDate dateFin) {
		this.dateFin = dateFin;
	}

	public List<Personne> getConjoints() {
		return conjoints;
	}

	public void setConjoints(List<Personne> conjoints) {
		this.conjoints = conjoints;
	}

	public Famille getFamille() {
		return famille;
	}

	public void setFamille(Famille famille) {
		this.famille = famille;
	}

	public List<Personne> getEnfants() {
		return enfants;
	}

	public void setEnfants(List<Personne> enfants) {
		this.enfants = enfants;
	}
    
  
    

}
