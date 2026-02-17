package com.famtrees.dto;


import java.util.List;


public class ArbreDTO {

    private String racineId; // Id de la personne racine

    private Integer profondeur; // Nombre de générations à remonter / descendre

    private List<NodeDTO> nodes;
    private List<EdgeDTO> edges;
	public ArbreDTO(String racineId, Integer profondeur, List<NodeDTO> nodes, List<EdgeDTO> edges) {
		super();
		this.racineId = racineId;
		this.profondeur = profondeur;
		this.nodes = nodes;
		this.edges = edges;
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
	public List<NodeDTO> getNodes() {
		return nodes;
	}
	public void setNodes(List<NodeDTO> nodes) {
		this.nodes = nodes;
	}
	public List<EdgeDTO> getEdges() {
		return edges;
	}
	public void setEdges(List<EdgeDTO> edges) {
		this.edges = edges;
	}
        
}
