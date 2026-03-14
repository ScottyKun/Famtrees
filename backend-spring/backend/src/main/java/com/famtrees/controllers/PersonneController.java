package com.famtrees.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.famtrees.mappers.*;
import com.famtrees.services.PersonneService;
import com.famtrees.dto.*;  
import com.famtrees.entities.*;

@RestController
@RequestMapping("/api/personnes")
public class PersonneController {
	
	private final PersonneService personneService;

    public PersonneController(PersonneService personneService) {
        this.personneService = personneService;
    }
    
	//all
    @GetMapping
    public List<PersonneDTO> getAll() {
        return personneService.getAllPersonnes().stream()
                .map(PersonneMapper::toDTO)
                .toList();
    }
    
	//create
    @PostMapping
    public PersonneDTO create(@RequestBody PersonneDTO dto) {
        Personne p = personneService.createPersonne(PersonneMapper.toEntity(dto));
        return PersonneMapper.toDTO(p);
    }

    @GetMapping("/{id}")
    public PersonneDTO getById(@PathVariable String id) {
        return personneService.getPersonneById(id)
                .map(PersonneMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    public PersonneDTO update(@PathVariable String id, @RequestBody PersonneDTO dto) {
        Personne updated = PersonneMapper.toEntity(dto);
        return PersonneMapper.toDTO(personneService.updatePersonne(id, updated));
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        personneService.deletePersonne(id);
    }
	
 // Relations
    @PostMapping("/{id}/enfants")
    public PersonneDTO addEnfant(@PathVariable String id, @RequestBody PersonneDTO enfantDto) {
        Personne enfant = PersonneMapper.toEntity(enfantDto);
        return PersonneMapper.toDTO(personneService.addEnfant(id, enfant));
    }

    @DeleteMapping("/{id}/enfants/{enfantId}")
    public PersonneDTO removeEnfant(@PathVariable String id, @PathVariable String enfantId) {
        return PersonneMapper.toDTO(personneService.removeEnfant(id, enfantId));
    }

    @PostMapping("/{id}/unions")
    public PersonneDTO addUnion(@PathVariable String id, @RequestBody UnionDTO unionDto) {
        Union u = UnionMapper.toEntity(unionDto);
        return PersonneMapper.toDTO(personneService.addUnion(id, u));
    }

    @DeleteMapping("/{id}/unions/{unionId}")
    public PersonneDTO removeUnion(@PathVariable String id, @PathVariable String unionId) {
        return PersonneMapper.toDTO(personneService.removeUnion(id, unionId));
    }
    
    @PostMapping("/{id}/familles")
    public PersonneDTO joinFamily(@PathVariable String id, @RequestBody FamilleDTO familleDto) {
        Famille f = FamilleMapper.toEntity(familleDto);
        return PersonneMapper.toDTO(personneService.joinFamily(id, f));
    }

}
