// Authentication service - simulates JWT authentication
// Backend team will implement the real endpoints later

const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:8080' 
  : '';

const AUTH_TOKEN_KEY = 'qos_auth_token';
const AUTH_USER_KEY = 'qos_auth_user';

/**
 * Simulate login with username and password
 * Returns a mock JWT token
 */
export const login = async (username, password) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation - accept any non-empty credentials for now
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Simulate different users
    const users = {
      'admin': { role: 'admin', name: 'Administrator' },
      'user': { role: 'user', name: 'Standard User' }
    };

    const userInfo = users[username.toLowerCase()] || { 
      role: 'user', 
      name: username 
    };

    // Generate mock JWT token
    const mockToken = btoa(JSON.stringify({
      sub: username,
      role: userInfo.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }));

    const authData = {
      token: mockToken,
      user: {
        username: username,
        ...userInfo
      }
    };

    // Store in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user));

    return authData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout and clear stored tokens
 */
export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
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
