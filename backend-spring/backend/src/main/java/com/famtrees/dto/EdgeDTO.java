package com.famtrees.dto;

public class EdgeDTO {

	private String from;
    private String to;
    private String type; // PARENT_DE / CONJOINT_DANS / A_ENFANT 
	
    public EdgeDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
	public EdgeDTO(String from, String to, String type) {
		super();
		this.from = from;
		this.to = to;
		this.type = type;
	}
    
    
}
