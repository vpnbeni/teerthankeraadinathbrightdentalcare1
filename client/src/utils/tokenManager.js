/**
 * Token Management Utilities
 * Handles JWT token storage, retrieval, and validation
 */

const TOKEN_KEY = 'token';

/**
 * Store JWT token in localStorage
 * @param {string} token - The JWT token to store
 */
export const storeToken = (token) => {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('🔐 Token stored in localStorage');
  } catch (error) {
    console.error('Failed to store token:', error);
  }
};

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} The stored token or null if not found
 */
export const getToken = () => {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('🔐 Token removed from localStorage');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

/**
 * Check if a token exists and is not expired
 * @returns {boolean} True if token exists and is valid
 */
export const hasValidToken = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Decode JWT payload (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔐 Token expired, removing...');
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate token:', error);
    removeToken();
    return false;
  }
};

/**
 * Get token expiration time
 * @returns {Date|null} Expiration date or null if invalid
 */
export const getTokenExpiration = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch (error) {
    console.error('Failed to get token expiration:', error);
    return null;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 * @returns {boolean} True if token expires soon
 */
export const isTokenExpiringSoon = () => {
  const expiration = getTokenExpiration();
  if (!expiration) return false;
  
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return expiration.getTime() - Date.now() < fiveMinutes;
};

/**
 * Extract user ID from token
 * @returns {string|null} User ID or null if invalid
 */
export const getUserIdFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.userId || null;
  } catch (error) {
    console.error('Failed to extract user ID from token:', error);
    return null;
  }
};
