package ma.formation.demandesapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DemandeControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    private Jwt createMockJwt(String subject, String username, List<String> roles) {
        return Jwt.withTokenValue("mock-token")
                .header("alg", "RS256")
                .subject(subject)
                .claim("preferred_username", username)
                .claim("email", username + "@formation.ma")
                .claim("realm_access", Map.of("roles", roles))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    @Test
    @DisplayName("1. Endpoint public accessible sans authentification")
    void testPublicEndpointAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/api/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("API publique accessible"));
    }

    @Test
    @DisplayName("2. Requête vers API protégée sans token -> 401 Unauthorized")
    void testProtectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/demandes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("3. Endpoint profil sans token -> 401 Unauthorized")
    void testProfilWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/profil"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4. Utilisateur USER peut créer une demande et consulter ses demandes")
    void testUserCanCreateAndConsultDemandes() throws Exception {
        Jwt aliceJwt = createMockJwt("user-alice-uuid", "alice", List.of("USER"));

        // POST /api/demandes
        mockMvc.perform(post("/api/demandes")
                .with(jwt().jwt(aliceJwt).authorities(new SimpleGrantedAuthority("ROLE_USER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"objet\":\"Demande de conges Alice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.owner").value("user-alice-uuid"))
                .andExpect(jsonPath("$.objet").value("Demande de conges Alice"))
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE"));

        // GET /api/demandes (doit retourner la demande d'Alice)
        mockMvc.perform(get("/api/demandes")
                .with(jwt().jwt(aliceJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].owner").value("user-alice-uuid"));
    }

    @Test
    @DisplayName("5. Utilisateur USER ne peut pas accéder aux endpoints ADMIN -> 403 Forbidden")
    void testUserCannotAccessAdminEndpoints() throws Exception {
        Jwt aliceJwt = createMockJwt("user-alice-uuid", "alice", List.of("USER"));

        mockMvc.perform(get("/api/admin/demandes")
                .with(jwt().jwt(aliceJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/demandes/1")
                .with(jwt().jwt(aliceJwt).authorities(new SimpleGrantedAuthority("ROLE_USER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"VALIDEE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. Utilisateur ADMIN peut consulter toutes les demandes et modifier le statut")
    void testAdminCanConsultAndModifyDemandes() throws Exception {
        Jwt adminJwt = createMockJwt("admin-bob-uuid", "bob", List.of("USER", "ADMIN"));

        // Créer d'abord une demande
        mockMvc.perform(post("/api/demandes")
                .with(jwt().jwt(adminJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"objet\":\"Demande d'equipement\"}"))
                .andExpect(status().isOk());

        // GET /api/admin/demandes en tant qu'ADMIN -> 200 OK
        mockMvc.perform(get("/api/admin/demandes")
                .with(jwt().jwt(adminJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());

        // Validation (VALIDEE)
        mockMvc.perform(patch("/api/admin/demandes/1")
                .with(jwt().jwt(adminJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"VALIDEE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("VALIDEE"));

        // Refus (REFUSEE - Fonctionnalité 16.1)
        mockMvc.perform(patch("/api/admin/demandes/1")
                .with(jwt().jwt(adminJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"REFUSEE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("REFUSEE"));
    }

    @Test
    @DisplayName("7. Endpoint /api/profil retourne les données du JWT (Fonctionnalité 16.2)")
    void testProfilEndpointReturnsTokenData() throws Exception {
        Jwt userJwt = createMockJwt("user-test-123", "alice", List.of("USER"));

        mockMvc.perform(get("/api/profil")
                .with(jwt().jwt(userJwt).authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-test-123"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@formation.ma"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    @DisplayName("8. Rejet si le corps de création est invalide -> 400 Bad Request")
    void testBadRequestValidation() throws Exception {
        Jwt userJwt = createMockJwt("user-test-123", "alice", List.of("USER"));

        mockMvc.perform(post("/api/demandes")
                .with(jwt().jwt(userJwt).authorities(new SimpleGrantedAuthority("ROLE_USER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"objet\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}

