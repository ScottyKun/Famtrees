package com.famtrees.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import com.famtrees.dto.PersonneDTO;
import com.famtrees.dto.UnionDTO;
import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;
import com.famtrees.mappers.PersonneMapper;
import com.famtrees.mappers.UnionMapper;
import com.famtrees.services.UnionService;

@RestController
@RequestMapping("/api/unions")
public class UnionController {
	
	private final UnionService unionService;

    public UnionController(UnionService unionService) {
        this.unionService = unionService;
    }
    
    @PostMapping
    public UnionDTO create(@RequestBody UnionDTO dto) {
        Union u = unionService.createUnion(UnionMapper.toEntity(dto));
        return UnionMapper.toDTO(u);
    }

    @GetMapping("/{id}")
    public UnionDTO getById(@PathVariable String id) {
        return unionService.getUnionById(id)
                .map(UnionMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    public UnionDTO update(@PathVariable String id, @RequestBody UnionDTO dto) {
        Union updated = UnionMapper.toEntity(dto);
        return UnionMapper.toDTO(unionService.updateUnion(id, updated));
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        unionService.deleteUnion(id);
    }

    @GetMapping
    public List<UnionDTO> getAll() {
        return unionService.getAllUnions().stream()
                .map(UnionMapper::toDTO)
                .toList();
    }

    @GetMapping("/{id}/enfants")
    public Map<String, List<PersonneDTO>> getEnfants(@PathVariable String id) {
        List<Personne> enfants = unionService.getEnfants(id);
        // Groupage par union (ici simple car on a 1 union)
        Map<String, List<PersonneDTO>> grouped = new HashMap<>();
        grouped.put(id, enfants.stream().map(PersonneMapper::toDTO).toList());
        return grouped;
    }

}
