package com.famtrees.dto;


import java.util.List;


public class ArbreDTO {

    private String racineId; // Id de la personne racine

    private Integer profondeur; // Nombre de générations à remonter / descendre

    private List<PersonneDTO> personnes;
    private List<UnionDTO> unions;
    private List<FamilleDTO> familles;
    
    
    
	public ArbreDTO(String racineId, Integer profondeur, List<PersonneDTO> personnes, List<UnionDTO> unions,
			List<FamilleDTO> familles) {
		super();
		this.racineId = racineId;
		this.profondeur = profondeur;
		this.personnes = personnes;
		this.unions = unions;
		this.familles = familles;
	}
	
	public ArbreDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
	
	public String getRacineId() {
		return racineId;
	}
	public void setRacineId(String racineId) {
		this.racineId = racineId;
	}
	public Integer getProfondeur() {
		return profondeur;
	}
	public void setProfondeur(Integer profondeur) {
		this.profondeur = profondeur;
	}
	public List<PersonneDTO> getPersonnes() {
		return personnes;
	}
	public void setPersonnes(List<PersonneDTO> personnes) {
		this.personnes = personnes;
	}
	public List<UnionDTO> getUnions() {
		return unions;
	}
	public void setUnions(List<UnionDTO> unions) {
		this.unions = unions;
	}
	public List<FamilleDTO> getFamilles() {
		return familles;
	}
	public void setFamilles(List<FamilleDTO> familles) {
		this.familles = familles;
	}
    
    
}
