import keycloak from './keycloak.js';

export const API_BASE_URL = 'http://localhost:8081';

/**
 * Appelle l'API sécurisée avec renouvellement automatique du jeton
 * et injection de l'en-tête Authorization: Bearer <token>
 */
export async function appelerApi(path, options = {}) {
  // Renouvelle le token si expiration dans moins de 30 secondes
  await keycloak.updateToken(30);

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keycloak.token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data && (data.message || data.error)) {
        message += ` - ${data.message || data.error}`;
      }
    } catch (_) {}
    throw new Error(message);
  }

  return response.json();
}

/**
 * Appelle une URL de l'API sans injecter le jeton
 * Utile pour tester les routes publiques ou vérifier les rejets 401
 */
export async function appelerApiSansToken(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

