package com.famtrees.dto;

import java.util.Objects;

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
	public String getFrom() {
		return from;
	}
	public void setFrom(String from) {
		this.from = from;
	}
	public String getTo() {
		return to;
	}
	public void setTo(String to) {
		this.to = to;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
    
	@Override
	public boolean equals(Object o) {
	    if (this == o) return true;
	    if (!(o instanceof EdgeDTO)) return false;
	    EdgeDTO edge = (EdgeDTO) o;
	    return Objects.equals(from, edge.from) &&
	           Objects.equals(to, edge.to) &&
	           Objects.equals(type, edge.type);
	}

	@Override
	public int hashCode() {
	    return Objects.hash(from, to, type);
	}

}
