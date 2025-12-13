package com.famtrees.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

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

    private final PersonneService personneService;

    public ArbreService(PersonneService personneService) {
        this.personneService = personneService;
    }

    public ArbreDTO buildArbre(String racineId, int profondeur) {
        Personne racine = personneService.getPersonneWithRelations(racineId)
                .orElseThrow(() -> new RuntimeException("Personne racine non trouvée"));

        // Descendants et ascendants avec profondeur
        List<Personne> descendants = personneService.getDescendants(racineId, profondeur);
        List<Personne> ascendants = personneService.getAncestors(racineId, profondeur);

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
