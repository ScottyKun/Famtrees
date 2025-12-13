package com.famtrees.mappers;

import com.famtrees.dto.UnionDTO;
import com.famtrees.entities.Union;
import com.famtrees.entities.Personne;

import java.util.ArrayList;
import java.util.List;

public class UnionMapper {

    public static UnionDTO toDTO(Union entity) {
        if (entity == null) return null;

        List<String> conjointsIds = new ArrayList<>();
        if (entity.getConjoints() != null) {
            for (Personne p : entity.getConjoints()) {
                conjointsIds.add(p.getId());
            }
        }

        
        String familleId = entity.getFamille() != null
                ? entity.getFamille().getId()
                : null;

        return new UnionDTO(
                entity.getId(),
                entity.getType(),
                entity.getDateDebut(),
                entity.getDateFin(),
                conjointsIds,
                familleId
        );
    }

    public static Union toEntity(UnionDTO dto) {
        if (dto == null) return null;

        return new Union(
                dto.getId(),
                dto.getType(),
                dto.getDateDebut(),
                dto.getDateFin(),
                new ArrayList<>(), // conjoints -> service
                null               // famille -> service
        );
    }
}
