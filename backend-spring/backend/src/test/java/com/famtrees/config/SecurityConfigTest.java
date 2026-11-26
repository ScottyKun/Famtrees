package com.famtrees.config;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.famtrees.controllers.ArbreController;
import com.famtrees.dto.ArbreDTO;
import com.famtrees.services.ArbreService;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

import jakarta.servlet.http.Cookie;

/**
 * Vérifie la configuration de sécurité sans Neo4j : service mocké, vrais filtres
 * Spring Security, jetons signés comme le fait Flask (HS256, même secret).
 */
@WebMvcTest
@Import({SecurityConfig.class, ArbreController.class})
class SecurityConfigTest {

    /** Configuration minimale : évite de charger BackendApplication (repositories Neo4j). */
    @SpringBootConfiguration
    static class TestApp {}

    @Autowired MockMvc mvc;
    @MockitoBean ArbreService arbreService;

    @Value("${famtrees.jwt.secret}") String secret;

    @BeforeEach
    void mockService() {
        when(arbreService.buildArbreComplet(anyString(), anyInt())).thenReturn(new ArbreDTO());
    }

    /** Jeton comme celui que Flask émet (auth.issue_token). */
    private String token(String key, String issuer, Instant iat, Duration ttl) {
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        var claims = JwtClaimsSet.builder().issuer(issuer).subject("user-uuid").issuedAt(iat).expiresAt(iat.plus(ttl))
                .claim("email", "andy@test.fr").build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
    private String valid() {
        return token(secret, "famtrees", Instant.now(), Duration.ofHours(8));
    }

    @Test
    void sansJeton_401() throws Exception {
        mvc.perform(get("/api/arbres/x")).andExpect(status().isUnauthorized());
    }

    @Test
    void jetonDansLeCookie_200() throws Exception {
        mvc.perform(get("/api/arbres/x").cookie(new Cookie("famtrees_token", valid())))
           .andExpect(status().isOk());
    }

    @Test
    void jetonEnBearer_200() throws Exception {
        mvc.perform(get("/api/arbres/x").header("Authorization", "Bearer " + valid()))
           .andExpect(status().isOk());
    }

    @Test
    void autreCookie_401() throws Exception {
        mvc.perform(get("/api/arbres/x").cookie(new Cookie("autre", valid())))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void jetonSigneAvecUnAutreSecret_401() throws Exception {
        String forged = token("un-autre-secret-de-plus-de-32-caracteres!!", "famtrees", Instant.now(), Duration.ofHours(1));
        mvc.perform(get("/api/arbres/x").cookie(new Cookie("famtrees_token", forged)))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void jetonExpire_401() throws Exception {
        String expired = token(secret, "famtrees", Instant.now().minus(Duration.ofHours(3)), Duration.ofHours(1));
        mvc.perform(get("/api/arbres/x").cookie(new Cookie("famtrees_token", expired)))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void jetonDUnAutreEmetteur_401() throws Exception {
        String other = token(secret, "pas-famtrees", Instant.now(), Duration.ofHours(1));
        mvc.perform(get("/api/arbres/x").cookie(new Cookie("famtrees_token", other)))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void preflightCorsDuFront_okAvecCredentials() throws Exception {
        mvc.perform(options("/api/arbres/x")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
           .andExpect(status().isOk())
           .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
           .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void preflightCorsDUneAutreOrigine_refuse() throws Exception {
        mvc.perform(options("/api/arbres/x")
                .header("Origin", "http://evil.example")
                .header("Access-Control-Request-Method", "GET"))
           .andExpect(status().isForbidden());
    }
}
