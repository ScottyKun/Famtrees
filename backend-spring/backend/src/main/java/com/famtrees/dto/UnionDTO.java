package com.famtrees.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

public class UnionDTO {

    private String id;

    private String type; // MARIAGE, UNION_LIBRE, RELIGIEUX

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;

    // Relations
    private List<String> conjointsIds;
    private String familleId;
    private List<String> enfantsIds;
    
	public UnionDTO(String id, String type, LocalDate dateDebut, LocalDate dateFin, List<String> conjointsIds,
			String familleId, List<String> enfantsIds) {
		super();
		this.id = id;
		this.type = type;
		this.dateDebut = dateDebut;
		this.dateFin = dateFin;
		this.conjointsIds = conjointsIds;
		this.familleId = familleId;
		this.enfantsIds = enfantsIds;
	}
	public UnionDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
	
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
	public List<String> getConjointsIds() {
		return conjointsIds;
	}
	public void setConjointsIds(List<String> conjointsIds) {
		this.conjointsIds = conjointsIds;
	}
	public String getFamilleId() {
		return familleId;
	}
	public void setFamilleId(String familleId) {
		this.familleId = familleId;
	}
	public List<String> getEnfantsIds() {
		return enfantsIds;
	}
	public void setEnfantsIds(List<String> enfantsIds) {
		this.enfantsIds = enfantsIds;
	}
    
    
}
