# Référence API — Secure Request Management

> Spécification technique des endpoints REST exposés par le Resource Server Spring Boot.

- **URL de base (Développement) :** `http://localhost:8081`
- **Format d'échange :** `application/json`
- **Protocole d'autorisation :** OAuth 2.0 Bearer Token (JWT émis par Keycloak)

---

## Authentification

Pour accéder aux routes protégées, les requêtes HTTP doivent contenir un jeton Access Token JWT valide dans l'en-tête :

```http
Authorization: Bearer <votre_access_token_jwt>
```

---

## Endpoints Principaux

### 1. Endpoint Public

Vérifie la disponibilité du serveur d'API sans exiger de jeton d'authentification.

- **URL :** `/api/public`
- **Méthode :** `GET`
- **Authentification requise :** Non
- **Rôles requis :** Aucun

#### Réponse de succès (`200 OK`)

```json
{
  "message": "API publique accessible"
}
```

---

### 2. Récupérer mes demandes

Retourne exclusivement la liste des demandes appartenant à l'utilisateur courant (filtrées sur le claim `sub` du JWT).

- **URL :** `/api/demandes`
- **Méthode :** `GET`
- **Authentification requise :** Oui
- **Rôles autorisés :** `USER`, `ADMIN`

#### En-tête requis

```http
Authorization: Bearer <access_token>
```

#### Réponse de succès (`200 OK`)

```json
[
  {
    "id": 1,
    "owner": "b8a9cf21-9988-4321-beef-123456789abc",
    "objet": "Demande de matériel informatique (Écran 27 pouces)",
    "statut": "EN_ATTENTE"
  }
]
```

---

### 3. Créer une nouvelle demande

Enregistre une nouvelle demande pour l'utilisateur authentifié. Le champ `owner` est automatiquement extrait du jeton JWT.

- **URL :** `/api/demandes`
- **Méthode :** `POST`
- **Authentification requise :** Oui
- **Rôles autorisés :** `USER`, `ADMIN`

#### Corps de la requête (Request Body)

```json
{
  "objet": "Demande d'accès aux serveurs de test"
}
```

#### Réponse de succès (`200 OK`)

```json
{
  "id": 2,
  "owner": "b8a9cf21-9988-4321-beef-123456789abc",
  "objet": "Demande d'accès aux serveurs de test",
  "statut": "EN_ATTENTE"
}
```

#### Réponses d'erreur

- `400 Bad Request` : Si l'objet est manquant ou vide (`{"message": "Objet obligatoire"}`).
- `401 Unauthorized` : Si le jeton est manquant ou invalide.

---

### 4. Consulter toutes les demandes (Administration)

Permet à un administrateur de visualiser l'ensemble des demandes soumises par tous les utilisateurs de la plateforme.

- **URL :** `/api/admin/demandes`
- **Méthode :** `GET`
- **Authentification requise :** Oui
- **Rôles autorisés :** `ADMIN` uniquement

#### Réponse de succès (`200 OK`)

```json
[
  {
    "id": 1,
    "owner": "b8a9cf21-9988-4321-beef-123456789abc",
    "objet": "Demande de matériel informatique (Écran 27 pouces)",
    "statut": "EN_ATTENTE"
  },
  {
    "id": 2,
    "owner": "c9b8df32-1122-3344-beef-987654321def",
    "objet": "Congés annuels été 2026",
    "statut": "VALIDEE"
  }
]
```

#### Réponses d'erreur

- `401 Unauthorized` : Si non authentifié.
- `403 Forbidden` : Si l'utilisateur connecté ne possède pas le rôle `ADMIN` (ex: `alice`).

---

### 5. Modifier le statut d'une demande (Valider / Refuser)

Permet à un administrateur de changer le statut d'une demande existante à `VALIDEE` ou `REFUSEE`.

- **URL :** `/api/admin/demandes/{id}`
- **Méthode :** `PATCH`
- **Authentification requise :** Oui
- **Rôles autorisés :** `ADMIN` uniquement

#### Corps de la requête (Request Body)

```json
{
  "statut": "VALIDEE"
}
```
*(ou `{"statut": "REFUSEE"}`)*

#### Réponse de succès (`200 OK`)

```json
{
  "id": 1,
  "owner": "b8a9cf21-9988-4321-beef-123456789abc",
  "objet": "Demande de matériel informatique (Écran 27 pouces)",
  "statut": "VALIDEE"
}
```

#### Réponses d'erreur

- `400 Bad Request` : Si le statut n'est pas parmi `["EN_ATTENTE", "VALIDEE", "REFUSEE"]`.
- `403 Forbidden` : Si l'utilisateur n'est pas `ADMIN`.
- `404 Not Found` : Si l'ID de demande spécifié n'existe pas.

---

### 6. Profil Utilisateur (Travail Supplémentaire 16.2)

Retourne les informations d'identité et de rôles extraites directement du jeton JWT de l'utilisateur authentifié.

- **URL :** `/api/profil`
- **Méthode :** `GET`
- **Authentification requise :** Oui
- **Rôles autorisés :** Tout utilisateur authentifié

#### Réponse de succès (`200 OK`)

```json
{
  "id": "b8a9cf21-9988-4321-beef-123456789abc",
  "username": "alice",
  "roles": [
    "USER",
    "default-roles-enset-realm"
  ],
  "email": "alice@formation.ma"
}
```

---

## Résumé des Codes d'État HTTP

| Code HTTP | Signification | Contexte d'émission |
| :--- | :--- | :--- |
| `200 OK` | Succès | Requête exécutée et ressource retournée avec succès. |
| `400 Bad Request` | Requête invalide | Paramètres obligatoires absents (ex: champ `objet` vide ou statut inconnu). |
| `401 Unauthorized` | Non authentifié | En-tête `Authorization: Bearer` absent, jeton mal formé, expiré ou signature invalide. |
| `403 Forbidden` | Droits insuffisants | L'utilisateur est authentifié mais n'a pas le rôle requis (ex: `alice` accédant à `/api/admin/**`). |
| `404 Not Found` | Ressource introuvable | L'identifiant de la demande n'existe pas en mémoire. |

---
[⬅ Retour au README principal](../README.md)

