package com.famtrees.dto;

import java.util.Map;

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
    
    
}
