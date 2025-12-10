// Authentication service - connects to backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AUTH_TOKEN_KEY = 'qos_auth_token';
const AUTH_USER_KEY = 'qos_auth_user';

/**
 * Login with username and password
 * Calls backend /auth/login endpoint
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user info in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout and clear stored tokens
 * Calls backend /auth/logout endpoint
 */
export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
};

/**
 * Get stored auth token
 */
export const getToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Get stored user info
 */
export const getUser = () => {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode mock token to check expiration
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch (error) {
    return false;
  }
};

/**
 * Add auth token to API requests
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
