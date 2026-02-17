package com.famtrees.dto;

import java.util.Map;
import java.util.Objects;

public class NodeDTO {

	private String id;
    private String label;
    private String type; // PERSONNE / UNION / FAMILLE
    private Map<String, Object> data;
    
    
    
	public NodeDTO() {
		super();
		// TODO Auto-generated constructor stub
	}



	public NodeDTO(String id, String label, String type, Map<String, Object> data) {
		super();
		this.id = id;
		this.label = label;
		this.type = type;
		this.data = data;
	}



	public String getId() {
		return id;
	}



	public void setId(String id) {
		this.id = id;
	}



	public String getLabel() {
		return label;
	}



	public void setLabel(String label) {
		this.label = label;
	}



	public String getType() {
		return type;
	}



	public void setType(String type) {
		this.type = type;
	}



	public Map<String, Object> getData() {
		return data;
	}



	public void setData(Map<String, Object> data) {
		this.data = data;
	}
    
	@Override
	public boolean equals(Object o) {
	    if (this == o) return true;
	    if (!(o instanceof NodeDTO)) return false;
	    NodeDTO nodeDTO = (NodeDTO) o;
	    return Objects.equals(id, nodeDTO.id);
	}

	@Override
	public int hashCode() {
	    return Objects.hash(id);
	}

    
}
