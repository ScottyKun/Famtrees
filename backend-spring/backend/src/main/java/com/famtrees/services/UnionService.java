package com.famtrees.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;
import com.famtrees.repos.UnionRepository;

@Service
@Transactional
public class UnionService {

	private final UnionRepository unionRepository;

    public UnionService(UnionRepository unionRepository) {
        this.unionRepository = unionRepository;
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
            u.setConjoints(updated.getConjoints());
            u.setFamille(updated.getFamille());
            return unionRepository.save(u);
        }).orElseThrow(() -> new RuntimeException("Union non trouvée"));
    }

    public void deleteUnion(String id) {
        unionRepository.deleteById(id);
    }

    public Optional<Union> getUnionById(String id) {
        return unionRepository.findById(id);
    }

    public Optional<Union> getUnionWithConjoints(String id) {
        return unionRepository.findWithConjointsById(id);
    }

    public List<Union> findByType(String type) {
        return unionRepository.findByType(type);
    }
    
    public List<Union> getAllUnions(){
    	return unionRepository.findAll();
    }

    // Récupérer enfants via parents (ParentDe)
    public List<Personne> getEnfants(String unionId) {
        return unionRepository.findChildsByUnionId(unionId);
    }
}
