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

import com.famtrees.dto.*;
import com.famtrees.entities.Personne;
import com.famtrees.mappers.*;
import com.famtrees.services.*;

@RestController
@RequestMapping("/api/familles")
public class FamilleController {
	
	private final FamilleService familleService;

    public FamilleController(FamilleService familleService) {
        this.familleService = familleService;
    }
    
    //CRUD
    @PostMapping
    public FamilleDTO create(@RequestBody FamilleDTO dto) {
        return FamilleMapper.toDTO(familleService.createFamille(FamilleMapper.toEntity(dto)));
    }

    @GetMapping("/{id}")
    public FamilleDTO getById(@PathVariable String id) {
        return familleService.getFamilleById(id)
                .map(FamilleMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    public FamilleDTO update(@PathVariable String id, @RequestBody FamilleDTO dto) {
        return FamilleMapper.toDTO(familleService.updateFamille(id, FamilleMapper.toEntity(dto)));
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        familleService.deleteFamille(id);
    }

    @GetMapping
    public List<FamilleDTO> getAll() {
        return familleService.getAllFamilles().stream()
                .map(FamilleMapper::toDTO)
                .toList();
    }
    
    
    //Membres
    @PostMapping("/{id}/membres")
    public FamilleDTO addMember(@PathVariable String id, @RequestBody PersonneDTO pDto) {
        Personne p = PersonneMapper.toEntity(pDto);
        return FamilleMapper.toDTO(familleService.addMember(id, p));
    }

    @DeleteMapping("/{id}/membres/{personneId}")
    public FamilleDTO removeMember(@PathVariable String id, @PathVariable String personneId) {
        return FamilleMapper.toDTO(familleService.removeMember(id, personneId));
    }

}
