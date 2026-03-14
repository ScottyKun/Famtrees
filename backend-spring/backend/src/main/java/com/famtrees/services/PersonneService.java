package com.famtrees.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.famtrees.entities.Famille;
import com.famtrees.entities.Personne;
import com.famtrees.entities.Union;
import com.famtrees.repos.FamilleRepository;
import com.famtrees.repos.PersonneRepository;
import com.famtrees.repos.UnionRepository;

@Service
@Transactional
public class PersonneService {
	
	private final PersonneRepository personneRepository;
	private final UnionRepository unionRepository;
	private final FamilleRepository familleRepository;

	public PersonneService(PersonneRepository personneRepository, UnionRepository unionRepository, FamilleRepository familleRepository) {
        this.personneRepository = personneRepository;
        this.unionRepository = unionRepository;
        this.familleRepository = familleRepository;
    }

    // CRUD
    public Personne createPersonne(Personne personne) {
        return personneRepository.save(personne);
    }

    public Personne updatePersonne(String id, Personne updated) {
        return personneRepository.findById(id).map(p -> {
            p.setPrenom(updated.getPrenom());
            p.setNom(updated.getNom());
            p.setSexe(updated.getSexe());
            p.setDateNaissance(updated.getDateNaissance());
            p.setDateDeces(updated.getDateDeces());
            return personneRepository.save(p);
        }).orElseThrow(() -> new RuntimeException("Personne non trouvée"));
    }

    public void deletePersonne(String id) {
        personneRepository.deleteById(id);
    }
    
    public List<Personne> getAllPersonnes() {
        return personneRepository.findAll();
    }

    public Optional<Personne> getPersonneById(String id) {
        return personneRepository.findById(id);
    }

    // Recherches
    public List<Personne> findByNom(String nom) {
        return personneRepository.findByNom(nom);
    }

    public Optional<Personne> findByPrenomAndNom(String prenom, String nom) {
        return personneRepository.findByPrenomAndNom(prenom, nom);
    }

    
    // Enfants
    public Personne addEnfant(String parentId, Personne enfant) {
        Personne parent = personneRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent non trouvé"));
        
        Personne e;
        
        if (enfant.getId() != null) {
            e = personneRepository.findById(enfant.getId())
                    .orElseThrow(() -> new RuntimeException("Enfant non trouvé"));
        } 
        else {
            e = personneRepository.save(enfant);
        }
        
        if(parent.getEnfants().stream().anyMatch(n -> n.getId().equals(e.getId()))) {
        	return parent;
        }
      
        parent.getEnfants().add(e);          // On crée la relation PARENT_DE
        return personneRepository.save(parent);
    }
   


    public Personne removeEnfant(String parentId, String enfantId) {
        Personne parent = personneRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent non trouvé"));
        parent.getEnfants().removeIf(e -> e.getId().equals(enfantId));
        return personneRepository.save(parent);
    }
    
    // Unions
    public Personne addUnion(String personneId, Union union) {
        Personne personne = personneRepository.findById(personneId)
                .orElseThrow(() -> new RuntimeException("Personne non trouvée"));

        Union u;
        
        if (union.getId() != null ) {
            u = unionRepository.findById(union.getId()).orElseThrow(() -> new RuntimeException("Union non trouvée"));
        }else {
        	u = unionRepository.save(union);
        }

        personne.getUnions().add(u);
        return personneRepository.save(personne);
    }

    public Personne removeUnion(String personneId, String unionId) {
        Personne personne = personneRepository.findById(personneId)
                .orElseThrow(() -> new RuntimeException("Personne non trouvée"));
        personne.getUnions().removeIf(u -> u.getId().equals(unionId));
        return personneRepository.save(personne);
    }
    
    // Famille
    public Personne joinFamily(String personneId, Famille famille) {
        Personne personne = personneRepository.findById(personneId)
                .orElseThrow(() -> new RuntimeException("Personne non trouvée"));

        Famille f;
        
        if (famille.getId() != null) {
            f = familleRepository.findById(famille.getId())
                    .orElseThrow(() -> new RuntimeException("Famille non trouvée"));
        } else {
            f = familleRepository.save(famille);
        }
        
        if (personne.getFamille() == null) {
            personne.setFamille(new ArrayList<>());
        }

        //Vérifier si déjà membre
        for (Famille fam : personne.getFamille()) {
            if (fam.getId().equals(f.getId())) {
                return personne; // déjà membre
            }
        }

        personne.getFamille().add(f);
       
        return personneRepository.save(personne);
    }
    

}
