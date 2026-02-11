package com.famtrees.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;
import com.famtrees.mappers.PersonneMapper;
import com.famtrees.dto.PersonneDTO;
import com.famtrees.entities.Famille;
import com.famtrees.repos.UnionRepository;
import com.famtrees.repos.PersonneRepository;
import com.famtrees.repos.FamilleRepository;


@Service
@Transactional
public class UnionService {

	private final UnionRepository unionRepository;
	private final FamilleRepository familleRepository;
	private final PersonneRepository personneRepository;

    public UnionService(UnionRepository unionRepository,FamilleRepository familleRepository,PersonneRepository personneRepository) {
        this.unionRepository = unionRepository;
        this.familleRepository= familleRepository;
        this.personneRepository= personneRepository;
    }

    // CRUD
    public Union createUnion(Union union) {
        return unionRepository.save(union);
    }

    public Union updateUnion(String id, Union updated) {
        return unionRepository.findById(id).map(u -> {
            u.setType(updated.getType());
            u.setDateDebut(updated.getDateDebut());
            u.setDateFin(updated.getDateFin());
            return unionRepository.save(u);
        }).orElseThrow(() -> new RuntimeException("Union non trouvée"));
    }

    public void deleteUnion(String id) {
        unionRepository.deleteById(id);
    }

    public Optional<Union> getUnionById(String id) {
        return unionRepository.findById(id);
    }


    public List<Union> findByType(String type) {
        return unionRepository.findByType(type);
    }
    
    public List<Union> getAllUnions(){
    	return unionRepository.findAll();
    }

    // enfants
    public List<PersonneDTO> getEnfants(String unionId) {
    	Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));
    	
        List<Personne> enfants = union.getEnfants();

        // mappe vers DTO
        return enfants.stream()
                .map(PersonneMapper::toDTO)
                .toList();
    }
    
    //ajouter un conjoint
    public Union addConjoint(String unionId, String personneId) {
        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        Personne personne = personneRepository.findById(personneId)
                .orElseThrow(() -> new RuntimeException("Personne non trouvée"));

        if (!union.getConjoints().contains(personne)) {
            union.getConjoints().add(personne);
        }

        return unionRepository.save(union);
    }

    //supprimer un conjoint
    public Union removeConjoint(String unionId, String personneId) {
        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        union.getConjoints().removeIf(p -> p.getId().equals(personneId));

        return unionRepository.save(union);
    }

    //lier à une famille
    public Union linkFamily(String unionId, String familleId) {
        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        Famille famille = familleRepository.findById(familleId)
                .orElseThrow(() -> new RuntimeException("Famille non trouvée"));

        union.setFamille(famille);

        return unionRepository.save(union);
    }
    
    //unlink famille
    public Union unlinkFamily(String unionId) {
        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        union.setFamille(null);

        return unionRepository.save(union);
    }
    
    //ajouter un enfant
    public Union addEnfant(String unionId, String enfantId) {

        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        Personne enfant = personneRepository.findById(enfantId)
                .orElseThrow(() -> new RuntimeException("Enfant non trouvé"));

        //
        if (union.getEnfants().stream()
                .anyMatch(e -> e.getId().equals(enfantId))) {
            return union;
        }

        union.getEnfants().add(enfant);

        return unionRepository.save(union);
    }

    //supprimer un enfant
    public Union removeEnfant(String unionId, String enfantId) {

        Union union = unionRepository.findById(unionId)
                .orElseThrow(() -> new RuntimeException("Union non trouvée"));

        union.getEnfants()
                .removeIf(e -> e.getId().equals(enfantId));

        return unionRepository.save(union);
    }

    
}
