package com.famtrees.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;


public class PersonneDTO {

    private String id;

    private String prenom;
    private String nom;
    private String sexe; // M, F

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateNaissance;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDeces;

    // Relations
    private List<String> enfantsIds;
    private List<String> unionsIds;
    private List<String> familleId;
    private String unionNaissId;
    
    
    public PersonneDTO(String id, String prenom, String nom, String sexe, LocalDate dateNaissance, LocalDate dateDeces,
			List<String> enfantsIds, List<String> unionsIds, List<String>  familleId, String unionNaissId ) {
		super();
		this.id = id;
		this.prenom = prenom;
		this.nom = nom;
		this.sexe = sexe;
		this.dateNaissance = dateNaissance;
		this.dateDeces = dateDeces;
		this.enfantsIds = enfantsIds;
		this.unionsIds = unionsIds;
		this.familleId = familleId;
		this.unionNaissId= unionNaissId;
	}
    
	public PersonneDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
	
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
	public List<String> getEnfantsIds() {
		return enfantsIds;
	}
	public void setEnfantsIds(List<String> enfantsIds) {
		this.enfantsIds = enfantsIds;
	}
	public List<String> getUnionsIds() {
		return unionsIds;
	}
	public void setUnionsIds(List<String> unionsIds) {
		this.unionsIds = unionsIds;
	}
	public List<String>  getFamilleId() {
		return familleId;
	}
	public void setFamilleId(List<String>  familleId) {
		this.familleId = familleId;
	}

	public String getUnionNaissId() {
		return unionNaissId;
	}

	public void setUnionNaissId(String unionNaissId) {
		this.unionNaissId = unionNaissId;
	}
	
	
}
