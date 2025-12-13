package com.famtrees.mappers;

import com.famtrees.dto.PersonneDTO;
import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;

import java.util.ArrayList;
import java.util.List;

public class PersonneMapper {

    public static PersonneDTO toDTO(Personne entity) {
        if (entity == null) return null;

        List<String> enfantsIds = new ArrayList<>();
        if (entity.getEnfants() != null) {
            for (Personne enfant : entity.getEnfants()) {
                enfantsIds.add(enfant.getId());
            }
        }

        List<String> unionsIds = new ArrayList<>();
        if (entity.getUnions() != null) {
            for (Union union : entity.getUnions()) {
                unionsIds.add(union.getId());
            }
        }

        String familleId = entity.getFamille() != null
                ? entity.getFamille().getId()
                : null;

        return new PersonneDTO(
                entity.getId(),
                entity.getPrenom(),
                entity.getNom(),
                entity.getSexe(),
                entity.getDateNaissance(),
                entity.getDateDeces(),
                enfantsIds,
                unionsIds,
                familleId
        );
    }

    public static Personne toEntity(PersonneDTO dto) {
        if (dto == null) return null;

        return new Personne(
                dto.getId(),
                dto.getPrenom(),
                dto.getNom(),
                dto.getSexe(),
                dto.getDateNaissance(),
                dto.getDateDeces(),
                new ArrayList<>(), // enfants -> gérés dans le service
                new ArrayList<>(), // unions -> gérés dans le service
                null               // famille -> gérée dans le service
        );
    }
}
