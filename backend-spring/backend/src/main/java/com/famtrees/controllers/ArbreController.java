package com.famtrees.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.famtrees.dto.ArbreDTO;
import com.famtrees.services.ArbreService;

@RestController
@RequestMapping("/api/arbres")
public class ArbreController {

	private final ArbreService arbreService;

    public ArbreController(ArbreService arbreService) {
        this.arbreService = arbreService;
    }

    /**
     * depth = nombre de SAUTS Neo4j (et non plus de générations, cf. ArbreService).
     * Normalement calculé et transmis par Flask (tree-flask/lineage.py:required_hops)
     * à partir des axes up/down/collateral demandés par le client final.
     * Valeur par défaut généreuse pour un appel direct hors Flask (~10 générations).
     */
    @GetMapping("/{racineId}")
    public ArbreDTO getArbre(
            @PathVariable String racineId,
            @RequestParam(defaultValue = "20") int depth) {
        return arbreService.buildArbreComplet(racineId, depth);
    }
}