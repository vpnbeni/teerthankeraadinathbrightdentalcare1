/**
 * Admin Authentication Guard Utilities
 * Prevents user tokens from being used in the admin application
 */

/**
 * Check if there's a conflicting user token in localStorage
 * @returns {boolean} True if user token exists and should be cleared
 */
export const checkForUserToken = () => {
  if (typeof localStorage === 'undefined') return false;
  
  // Check for common user token keys (including the new 'token' key used by client)
  const userToken = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
  return !!userToken;
};

/**
 * Clear any user tokens to prevent role confusion
 */
export const clearUserTokens = () => {
  if (typeof localStorage === 'undefined') return;
  
  // Remove user-specific tokens (including the new 'token' key used by client)
  localStorage.removeItem('token');
  localStorage.removeItem('userToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  console.log('User tokens cleared to prevent role confusion');
};

/**
 * Validate that the current authentication context is appropriate for admin role
 * @param {Object} user - User object from authentication
 * @returns {boolean} True if authentication context is valid
 */
export const validateAdminAuthContext = (user) => {
  if (!user) return false;
  
  // If user doesn't have admin role, they shouldn't be using the admin app
  if (user.role !== 'admin') {
    console.warn('Non-admin user detected in admin application - clearing session');
    clearUserTokens();
    return false;
  }
  
  return true;
};

/**
 * Initialize authentication guard on admin app startup
 */
export const initializeAdminAuthGuard = () => {
  // Clear any user tokens that might exist from client app usage
  clearUserTokens();
  
  // Set up periodic check for user tokens (every 5 minutes)
  setInterval(() => {
    if (checkForUserToken()) {
      console.warn('User token detected in admin app - clearing');
      clearUserTokens();
    }
  }, 5 * 60 * 1000);
};
