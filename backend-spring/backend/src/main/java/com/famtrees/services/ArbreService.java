package com.famtrees.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.neo4j.core.Neo4jTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famtrees.dto.ArbreDTO;
import com.famtrees.dto.FamilleDTO;
import com.famtrees.dto.PersonneDTO;
import com.famtrees.dto.UnionDTO;
import com.famtrees.entities.Famille;
import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;
import com.famtrees.mappers.FamilleMapper;
import com.famtrees.mappers.PersonneMapper;
import com.famtrees.mappers.UnionMapper;

@Service
@Transactional
public class ArbreService {

    private final Neo4jTemplate template;
    private final PersonneService personneService;

    public ArbreService(Neo4jTemplate template, PersonneService personneService) {
        this.template = template;
        this.personneService = personneService;
    }
    
    public List<Personne> findDescendants(String elementId, int depth) {
        String query = String.format("""
            MATCH (p:Personne)
            WHERE elementId(p) = '%s'
            MATCH (p)-[:PARENT_DE*1..%d]->(descendant)
            RETURN collect(DISTINCT descendant) AS descendants
            """, elementId, depth);

        return template.findAll(query, Personne.class)
                       .stream()
                       .collect(Collectors.toList());
    }

    public List<Personne> findAncestors(String elementId, int depth) {
        String query = String.format("""
            MATCH (p:Personne)
            WHERE elementId(p) = '%s'
            MATCH (p)<-[:PARENT_DE*1..%d]-(ancestor)
            RETURN collect(DISTINCT ancestor) AS ancestors
            """, elementId, depth);

        return template.findAll(query, Personne.class)
                       .stream()
                       .collect(Collectors.toList());
    }

    public ArbreDTO buildArbre(String racineId, int profondeur) {
        Personne racine = personneService.getPersonneById(racineId)
                .orElseThrow(() -> new RuntimeException("Personne racine non trouvée"));

        // Descendants et ascendants avec profondeur
        List<Personne> descendants = this.findDescendants(racineId, profondeur);
        List<Personne> ascendants =this.findAncestors(racineId, profondeur);

        List<Personne> toutesPersonnes = new ArrayList<>();
        toutesPersonnes.add(racine);
        toutesPersonnes.addAll(descendants);
        toutesPersonnes.addAll(ascendants);

        // --- DTOs ---
        List<PersonneDTO> personnesDTO = toutesPersonnes.stream()
                .map(PersonneMapper::toDTO)
                .collect(Collectors.toList());

        Set<Union> toutesUnions = toutesPersonnes.stream()
                .flatMap(p -> p.getUnions().stream())
                .collect(Collectors.toSet());

        List<UnionDTO> unionsDTO = toutesUnions.stream()
                .map(UnionMapper::toDTO)
                .collect(Collectors.toList());

        Set<Famille> toutesFamilles = toutesPersonnes.stream()
                .map(Personne::getFamille)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        toutesFamilles.addAll(
                toutesUnions.stream()
                        .map(Union::getFamille)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
        );

        List<FamilleDTO> famillesDTO = toutesFamilles.stream()
                .map(FamilleMapper::toDTO)
                .collect(Collectors.toList());

        return new ArbreDTO(racineId, profondeur, personnesDTO, unionsDTO, famillesDTO);
    }
}
