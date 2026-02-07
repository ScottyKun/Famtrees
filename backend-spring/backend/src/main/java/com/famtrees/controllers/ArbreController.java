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

    @GetMapping("/{racineId}")
    public ArbreDTO getArbre(
            @PathVariable String racineId,
            @RequestParam(defaultValue = "3") int profondeur) {
        return arbreService.buildArbre(racineId, profondeur);
    }
}
