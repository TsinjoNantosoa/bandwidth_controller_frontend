// API Service pour communiquer avec le backend QoS
// In development, use Vite proxy (relative URLs)
// In production, set this to your backend URL
const API_BASE_URL = import.meta.env.PROD ? 'http://10.0.0.1:8080' : '';

/**
 * Initialise la structure HTB (Hierarchical Token Bucket)
 * Backend already knows LAN/WAN interfaces (passed at startup)
 * @param {string} totalBandwidth - Bande passante totale (ex: '100mbit')
 * @returns {Promise<Object>}
 */
export const setupHTB = async (totalBandwidth) => {
  const response = await fetch(`${API_BASE_URL}/qos/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      total_bandwidth: totalBandwidth,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Met à jour la limite globale de bande passante HTB
 * Backend already knows LAN/WAN interfaces (passed at startup)
 * @param {string} rateLimit - Nouveau débit (ex: '50mbit')
 * @param {string} latency - Latence optionnelle (ex: '50ms')
 * @returns {Promise<Object>}
 */
export const updateHTBGlobalLimit = async (rateLimit, latency = '50ms') => {
  const response = await fetch(`${API_BASE_URL}/qos/htb/global/limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rate_limit: rateLimit,
      latency: latency,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Applique une limitation simple (TBF - Token Bucket Filter)
 * Backend already knows LAN/WAN interfaces (passed at startup)
 * @param {string} rateLimit - Limite de débit (ex: '50mbit')
 * @param {string} latency - Latence optionnelle (ex: '50ms')
 * @returns {Promise<Object>}
 */
export const applySimpleLimit = async (rateLimit, latency = '50ms') => {
  const response = await fetch(`${API_BASE_URL}/qos/simple/limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rate_limit: rateLimit,
      latency: latency,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Réinitialise toutes les règles de mise en forme (QDiscs)
 * Backend already knows LAN/WAN interfaces (passed at startup)
 * @returns {Promise<Object>}
 */
export const resetShaping = async () => {
  const response = await fetch(`${API_BASE_URL}/qos/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Applique une limite de débit spécifique à une IP (HTB per-IP)
 * @param {string} ip - Adresse IP du client (ex: '10.0.0.8')
 * @param {string} rateLimit - Limite de débit (ex: '10mbit')
 * @returns {Promise<Object>}
 */
export const setIPLimit = async (ip, rateLimit) => {
  const response = await fetch(`${API_BASE_URL}/qos/ip/limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ip: ip,
      rate_limit: rateLimit,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Supprime la limite de débit appliquée à une IP spécifique
 * @param {string} ip - Adresse IP du client
 * @returns {Promise<Object>}
 */
export const removeIPLimit = async (ip) => {
  const response = await fetch(`${API_BASE_URL}/qos/ip/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ip: ip,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Vérifie la santé du serveur backend
 * @returns {Promise<boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/swagger/index.html`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default {
  setupHTB,
  updateHTBGlobalLimit,
  applySimpleLimit,
  resetShaping,
  setIPLimit,
  removeIPLimit,
  checkBackendHealth,
};
