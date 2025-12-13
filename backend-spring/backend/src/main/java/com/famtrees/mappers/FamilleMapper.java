package com.famtrees.mappers;

import com.famtrees.dto.FamilleDTO;
import com.famtrees.entities.Famille;
import com.famtrees.entities.Personne;

import java.util.ArrayList;
import java.util.List;

public class FamilleMapper {

    public static FamilleDTO toDTO(Famille entity) {
        if (entity == null) return null;

        List<String> membresIds = new ArrayList<>();
        if (entity.getMembres() != null) {
            for (Personne p : entity.getMembres()) {
                membresIds.add(p.getId());
            }
        }

        return new FamilleDTO(
                entity.getId(),
                entity.getNom(),
                membresIds
        );
    }

    public static Famille toEntity(FamilleDTO dto) {
        if (dto == null) return null;

        return new Famille(
                dto.getId(),
                dto.getNom(),
                new ArrayList<>() // membres -> service
        );
    }
}
