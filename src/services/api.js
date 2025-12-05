// API Service pour communiquer avec le backend QoS
const API_BASE_URL = 'http://localhost:8080';

/**
 * Initialise la structure HTB (Hierarchical Token Bucket)
 * @param {string} lanInterface - Interface LAN (ex: 'wlp2s0')
 * @param {string} wanInterface - Interface WAN (ex: 'wlp2s0')
 * @param {string} totalBandwidth - Bande passante totale (ex: '100mbit')
 * @returns {Promise<Object>}
 */
export const setupHTB = async (lanInterface, wanInterface, totalBandwidth) => {
  const response = await fetch(`${API_BASE_URL}/qos/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lan_interface: lanInterface,
      wan_interface: wanInterface,
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
 * @param {string} lanInterface - Interface LAN
 * @param {string} wanInterface - Interface WAN
 * @param {string} newRate - Nouveau débit (ex: '50mbit')
 * @returns {Promise<Object>}
 */
export const updateHTBGlobalLimit = async (lanInterface, wanInterface, newRate) => {
  const response = await fetch(`${API_BASE_URL}/qos/htb/global/limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lan_interface: lanInterface,
      wan_interface: wanInterface,
      new_rate: newRate,
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
 * @param {string} lanInterface - Interface LAN
 * @param {string} wanInterface - Interface WAN
 * @param {string} rateLimit - Limite de débit (ex: '50mbit')
 * @returns {Promise<Object>}
 */
export const applySimpleLimit = async (lanInterface, wanInterface, rateLimit) => {
  const response = await fetch(`${API_BASE_URL}/qos/simple/limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lan_interface: lanInterface,
      wan_interface: wanInterface,
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
 * Réinitialise toutes les règles de mise en forme (QDiscs)
 * @param {string} lanInterface - Interface LAN
 * @param {string} wanInterface - Interface WAN
 * @returns {Promise<Object>}
 */
export const resetShaping = async (lanInterface, wanInterface) => {
  const response = await fetch(`${API_BASE_URL}/qos/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lan_interface: lanInterface,
      wan_interface: wanInterface,
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
  checkBackendHealth,
};
