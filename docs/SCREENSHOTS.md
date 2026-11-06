# Galerie Complète des Captures d'Écran — Secure Request Management

Ce document regroupe l'intégralité des **20 captures d'écran** attestant du bon fonctionnement, de la configuration et de la validation de la sécurité de l'application **Secure Request Management** (OAuth 2.0 PKCE, OpenID Connect, Keycloak 26.8.1, Spring Boot 3 et React 18).

---

## Sommaire

1. [Configuration et Administration de Keycloak (Séance 1)](#1-configuration-et-administration-de-keycloak-séance-1)
   - [01. Conteneur Docker Keycloak](#01-conteneur-docker-keycloak-2681)
   - [02. Realm enset-realm](#02-sélection-et-activation-du-realm-enset-realm)
   - [03. Configuration du Client Public react-client (Partie 1)](#03-paramétrage-du-client-public-react-client-partie-1)
   - [04. Configuration du Client Public react-client (Partie 2 — PKCE S256)](#04-paramétrage-du-client-public-react-client-partie-2--pkce-s256)
   - [05. Rôles du Realm (USER & ADMIN)](#05-définition-des-rôles-du-realm-admin-et-user)
   - [06. Utilisateur Alice (Rôle USER)](#06-compte-utilisateur-alice-rôle-user)
   - [07. Utilisateur Bob (Rôle ADMIN)](#07-compte-utilisateur-bob-rôle-admin)
2. [Backend Spring Boot 3 — Resource Server REST (Séance 2)](#2-backend-spring-boot-3--resource-server-rest-séance-2)
   - [08. Démarrage de l'API Spring Boot](#08-démarrage-du-backend-spring-boot-sur-le-port-8081)
   - [09. Accès Autorisé Endpoint Public (HTTP 200)](#09-accès-autorisé-à-lendpoint-public-api-public-health-http-200)
   - [10. Rejet Requête Non Authentifiée (HTTP 401)](#10-rejet-immédiat-dune-requête-sans-jeton-http-401-unauthorized)
3. [Frontend React 18 — Client Web Monopage OIDC (Séance 3)](#3-frontend-react-18--client-web-monopage-oidc-séance-3)
   - [11. Mire d'Authentification Keycloak avec PKCE](#11-page-de-connexion-keycloak-avec-défi-pkce)
   - [12. Dashboard Utilisateur Standard (Alice)](#12-tableau-de-bord-de-lutilisatrice-alice-rôle-user)
   - [13. Dashboard Administrateur (Bob)](#13-tableau-de-bord-de-ladministrateur-bob-rôle-admin)
   - [14. En-tête HTTP Authorization: Bearer dans le Réseau](#14-transmission-du-bearer-token-dans-les-devtools-réseau)
4. [Validation de la Sécurité, Inspecteur JWT & Postman](#4-validation-de-la-sécurité-inspecteur-jwt--postman)
   - [15. Inspecteur des Revendications JWT](#15-inspecteur-dynamique-des-claims-jwt-sub-iss-roles-exp)
   - [16. Test Postman Succès RBAC Administrateur (HTTP 200)](#16-validation-réussie-dune-demande-par-bob-sous-postman-http-200)
   - [17. Test Postman Rejet Jeton Invalide (HTTP 401)](#17-rejet-dune-requête-avec-jeton-falsifié-sous-postman-http-401)
5. [Travail Supplémentaire Réalisé (Section 16 du TP)](#5-travail-supplémentaire-réalisé-section-16-du-tp)
   - [18. Section 16.1 — Action de Refus d'une Demande](#18-section-161--action-dinvalidation--refus-dune-demande)
   - [19. Section 16.2 — Endpoint d'Introspection /api/profil](#19-section-162--endpoint-dintrospection-du-profil-connecté-apiprofil)
   - [20. Section 16.3 — Suite de 9 Tests Automatisés de Sécurité](#20-section-163--suite-de-tests-de-sécurité-automatisés-junit-5)

---

## 1. Configuration et Administration de Keycloak (Séance 1)

### 01. Conteneur Docker Keycloak 26.8.1
> **Description** : Conteneur Keycloak déployé avec Docker Compose en mode `start-dev` avec import automatique du Realm au démarrage sur le port `8080`.

<div align="center">
  <img src="assets/screenshots/01_keycloak_docker_container.png" alt="Conteneur Keycloak Docker" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Écoute active sur `0.0.0.0:8080->8080/tcp`, conteneur `keycloak-server` au statut *Up*.

[⬆ Retour au sommaire](#sommaire)

---

### 02. Sélection et Activation du Realm `enset-realm`
> **Description** : Vue d'ensemble du Realm dédié `enset-realm` créé pour isoler les utilisateurs, rôles et clients de l'application.

<div align="center">
  <img src="assets/screenshots/02_keycloak_realm_enset.png" alt="Realm enset-realm" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Realm actif (`Enabled: ON`), nom d'affichage `enset-realm`.

[⬆ Retour au sommaire](#sommaire)

---

### 03. Paramétrage du Client Public `react-client` (Partie 1)
> **Description** : Création du client OIDC `react-client` sans secret client (`Client authentication: OFF`).

<div align="center">
  <img src="assets/screenshots/03_keycloak_client_react_pkce_part1.png" alt="Client react-client Partie 1" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Client Type `OpenID Connect`, `Standard flow` activé (flux Authorization Code).

[⬆ Retour au sommaire](#sommaire)

---

### 04. Paramétrage du Client Public `react-client` (Partie 2 — PKCE S256)
> **Description** : Configuration des URLs de redirection autorisées (`Valid redirect URIs`), des origines CORS (`Web origins`) et du challenge de code PKCE `S256`.

<div align="center">
  <img src="assets/screenshots/03_keycloak_client_react_pkce_part2.png" alt="Client react-client Partie 2 PKCE" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Redirect URI fixée à `http://localhost:5173/*`, Proof Key for Code Exchange (PKCE) configuré sur `S256`.

[⬆ Retour au sommaire](#sommaire)

---

### 05. Définition des Rôles du Realm (`ADMIN` et `USER`)
> **Description** : Gestion des rôles RBAC globaux au niveau du Realm pour la ségrégation des privilèges.

<div align="center">
  <img src="assets/screenshots/04_keycloak_realm_roles.png" alt="Rôles Realm ADMIN et USER" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Présence des rôles `USER` (utilisateurs standards) et `ADMIN` (gestionnaires avec droits de validation et refus).

[⬆ Retour au sommaire](#sommaire)

---

### 06. Compte Utilisateur `alice` (Rôle `USER`)
> **Description** : Profil de l'utilisatrice standard `alice` associé exclusivement au rôle `USER`.

<div align="center">
  <img src="assets/screenshots/05_keycloak_user_alice.png" alt="Utilisatrice Alice" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : `username: alice`, `email: alice@enset.ma`, rôle assigné `USER`.

[⬆ Retour au sommaire](#sommaire)

---

### 07. Compte Utilisateur `bob` (Rôle `ADMIN`)
> **Description** : Profil de l'administrateur `bob` doté du rôle d'administration `ADMIN` (ainsi que `USER`).

<div align="center">
  <img src="assets/screenshots/06_keycloak_user_bob.png" alt="Utilisateur Bob Admin" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : `username: bob`, `email: bob@enset.ma`, rôles assignés `USER` et `ADMIN`.

[⬆ Retour au sommaire](#sommaire)

---

## 2. Backend Spring Boot 3 — Resource Server REST (Séance 2)

### 08. Démarrage du Backend Spring Boot sur le Port 8081
> **Description** : Lancement de l'application `demandes-api` avec auto-configuration OAuth2 Resource Server et découverte du JWKS Keycloak.

<div align="center">
  <img src="assets/screenshots/07_backend_spring_boot_startup.png" alt="Démarrage Spring Boot" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Initialisation sur le port HTTP `8081`, configuration de la chaîne de filtres Spring Security sans état.

[⬆ Retour au sommaire](#sommaire)

---

### 09. Accès Autorisé à l'Endpoint Public `/api/public/health` (HTTP 200)
> **Description** : Test d'un endpoint public non protégé ne nécessitant aucun jeton d'authentification.

<div align="center">
  <img src="assets/screenshots/08_backend_public_endpoint_200.png" alt="Endpoint public 200" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Réponse `200 OK` avec le payload JSON `{"status":"UP","service":"demandes-api"}`.

[⬆ Retour au sommaire](#sommaire)

---

### 10. Rejet Immédiat d'une Requête Sans Jeton (HTTP 401 Unauthorized)
> **Description** : Test d'appel direct sur l'endpoint sécurisé `/api/demandes` sans fournir d'en-tête `Authorization`.

<div align="center">
  <img src="assets/screenshots/09_backend_demandes_unauthorized_401.png" alt="Demandes non autorisé 401" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Rejet automatique par le filtre de sécurité Spring avec le code d'état HTTP `401 Unauthorized`.

[⬆ Retour au sommaire](#sommaire)

---

## 3. Frontend React 18 — Client Web Monopage OIDC (Séance 3)

### 11. Page de Connexion Keycloak avec Défi PKCE
> **Description** : Redirection automatique vers la mire d'authentification centralisée de Keycloak avec transmission du `code_challenge` SHA-256.

<div align="center">
  <img src="assets/screenshots/10_react_login_keycloak_redirect.png" alt="Mire Keycloak PKCE" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : URL contenant `client_id=react-client`, `response_type=code`, `code_challenge_method=S256`.

[⬆ Retour au sommaire](#sommaire)

---

### 12. Tableau de Bord de l'Utilisatrice `alice` (Rôle `USER`)
> **Description** : Vue après connexion d'Alice. L'interface offre la création de demandes et n'affiche que ses propres requêtes.

<div align="center">
  <img src="assets/screenshots/11_react_alice_user_dashboard.png" alt="Dashboard Alice User" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Badge utilisateur `alice`, panneau d'administration invisible (ségrégation RBAC côté interface).

[⬆ Retour au sommaire](#sommaire)

---

### 13. Tableau de Bord de l'Administrateur `bob` (Rôle `ADMIN`)
> **Description** : Vue après connexion de Bob. Affichage de toutes les demandes avec boutons d'actions d'approbation et de rejet.

<div align="center">
  <img src="assets/screenshots/12_react_bob_admin_dashboard.png" alt="Dashboard Bob Admin" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Badge `ADMIN` affiché, boutons `Valider` (vert) et `Refuser` (rouge) disponibles pour chaque demande en attente.

[⬆ Retour au sommaire](#sommaire)

---

### 14. Transmission du Bearer Token dans les DevTools Réseau
> **Description** : Inspection réseau dans le navigateur démontrant l'injection dynamique du jeton Bearer par l'intercepteur Axios.

<div align="center">
  <img src="assets/screenshots/13_react_network_bearer_token.png" alt="Réseau Bearer Token" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : En-tête de requête `Authorization: Bearer eyJhbGciOiJSUzI1Ni...` transmis au backend.

[⬆ Retour au sommaire](#sommaire)

---

## 4. Validation de la Sécurité, Inspecteur JWT & Postman

### 15. Inspecteur Dynamique des Claims JWT (`sub`, `iss`, `roles`, `exp`)
> **Description** : Tiroir inspecteur intégré à l'application React permettant de décoder et visualiser en clair les revendications du jeton.

<div align="center">
  <img src="assets/screenshots/14_jwt_claims_inspector.png" alt="Inspecteur Claims JWT" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Présence des claims standards OIDC (`preferred_username`, `email`, `sub`, `exp`) et de l'arbre `realm_access.roles`.

[⬆ Retour au sommaire](#sommaire)

---

### 16. Validation Réussie d'une Demande par Bob sous Postman (HTTP 200)
> **Description** : Requête `PUT /api/demandes/1/valider` envoyée avec le jeton d'accès de Bob (rôle `ADMIN`).

<div align="center">
  <img src="assets/screenshots/16_postman_bob_admin_success_200.png" alt="Postman Admin 200 OK" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Code HTTP `200 OK`, état de la demande mis à jour à `"statut": "VALIDEE"`.

[⬆ Retour au sommaire](#sommaire)

---

### 17. Rejet d'une Requête avec Jeton Falsifié sous Postman (HTTP 401)
> **Description** : Requête transmise avec un jeton JWT dont la signature a été altérée ou corrompue.

<div align="center">
  <img src="assets/screenshots/17_postman_invalid_token_401.png" alt="Postman Jeton Invalide 401" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Code HTTP `401 Unauthorized` avec message `Invalid JWT signature` retourné par NimbusJwtDecoder.

[⬆ Retour au sommaire](#sommaire)

---

## 5. Travail Supplémentaire Réalisé (Section 16 du TP)

### 18. Section 16.1 — Action d'Invalidation / Refus d'une Demande
> **Description** : Implémentation du refus administratif avec passage à l'état `DemandeStatus.REFUSEE` et affichage d'un badge rouge.

<div align="center">
  <img src="assets/screenshots/18_travail_supp_refuser_demande.png" alt="Travail supplémentaire Refuser demande" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Statut `REFUSÉE` enregistré en base de données et reflété instantanément sur l'interface.

[⬆ Retour au sommaire](#sommaire)

---

### 19. Section 16.2 — Endpoint d'Introspection du Profil Connecté (`/api/profil`)
> **Description** : Endpoint REST sécurisé extrayant et restituant les informations de l'utilisateur connecté depuis le SecurityContext de Spring Security.

<div align="center">
  <img src="assets/screenshots/19_travail_supp_profil_endpoint.png" alt="Travail supplémentaire Profil endpoint" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : Rendu des attributs `username`, `email`, `roles` et `authorities` (`ROLE_USER`, `ROLE_ADMIN`).

[⬆ Retour au sommaire](#sommaire)

---

### 20. Section 16.3 — Suite de Tests de Sécurité Automatisés JUnit 5
> **Description** : Batterie de 9 tests automatisés avec MockMvc et JWT mocks simulant l'ensemble des cas d'accès légitimes et frauduleux.

<div align="center">
  <img src="assets/screenshots/20_tests_securite_automatises.png" alt="Tests de sécurité automatisés JUnit 5" width="95%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
</div>

* **Vérification** : `Tests run: 9, Failures: 0, Errors: 0, Skipped: 0` — Résultat `BUILD SUCCESS`.

[⬆ Retour au sommaire](#sommaire)
