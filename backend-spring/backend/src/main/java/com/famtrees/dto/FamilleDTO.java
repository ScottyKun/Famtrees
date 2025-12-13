package com.famtrees.dto;

import java.util.List;

public class FamilleDTO {

    private String id;
    private String nom;

    // Relations
    private List<String> membresIds;
    
    
    

    public FamilleDTO(String id, String nom, List<String> membresIds) {
		super();
		this.id = id;
		this.nom = nom;
		this.membresIds = membresIds;
	}

	public FamilleDTO() {
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

	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	public List<String> getMembresIds() {
		return membresIds;
	}

	public void setMembresIds(List<String> membresIds) {
		this.membresIds = membresIds;
	}
    
    
}

