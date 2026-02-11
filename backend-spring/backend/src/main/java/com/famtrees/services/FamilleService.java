package com.famtrees.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famtrees.entities.Famille;
import com.famtrees.entities.Personne;
import com.famtrees.repos.FamilleRepository;
import com.famtrees.repos.PersonneRepository;

@Service
@Transactional
public class FamilleService {

	private final FamilleRepository familleRepository;
	private final PersonneRepository personneRepository;

	public FamilleService(FamilleRepository familleRepository, PersonneRepository personneRepository) {
        this.familleRepository = familleRepository;
        this.personneRepository = personneRepository;
    }

    // CRUD
    public Famille createFamille(Famille famille) {
        return familleRepository.save(famille);
    }

    public Famille updateFamille(String id, Famille updated) {
        return familleRepository.findById(id).map(f -> {
            f.setNom(updated.getNom());
            return familleRepository.save(f);
        }).orElseThrow(() -> new RuntimeException("Famille non trouvée"));
    }

    public void deleteFamille(String id) {
        familleRepository.deleteById(id);
    }
    
    public List<Famille> getAllFamilles(){
    	return familleRepository.findAll();
    }

    public Optional<Famille> getFamilleById(String id) {
        return familleRepository.findById(id);
    }


    public Optional<Famille> findByNom(String nom) {
        return familleRepository.findByNom(nom);
    }
    
    //Membres
    public Famille addMember(String familleId, Personne personne) {
        Famille famille = familleRepository.findById(familleId)
                .orElseThrow(() -> new RuntimeException("Famille non trouvée"));
        
        Personne p;
        
        if (personne.getId() != null) {
            p = personneRepository.findById(personne.getId())
                    .orElseThrow(() -> new RuntimeException("Personne non trouvée"));
        }
        //nouvelle personne
        else {
            p = personne;
        }
        
        if (p.getFamille() != null &&
                p.getFamille().getId().equals(famille.getId())) {
                return famille; // déjà membre
            }

        famille.getMembres().add(p);
        p.setFamille(famille);

        personneRepository.save(p);
            
        return familleRepository.save(famille);
    }

    public Famille removeMember(String familleId, String personneId) {
        Famille famille = familleRepository.findById(familleId)
                .orElseThrow(() -> new RuntimeException("Famille non trouvée"));

        famille.getMembres().removeIf(p -> p.getId().equals(personneId));

        personneRepository.findById(personneId).ifPresent(p -> {
            p.setFamille(null);
            personneRepository.save(p);
        });

        return familleRepository.save(famille);
    }
}
