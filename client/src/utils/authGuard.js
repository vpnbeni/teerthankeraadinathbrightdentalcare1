/**
 * Authentication Guard Utilities
 * Prevents admin tokens from being used in the client application
 */

/**
 * Check if there's a conflicting admin token in localStorage
 * @returns {boolean} True if admin token exists and should be cleared
 */
export const checkForAdminToken = () => {
  if (typeof localStorage === 'undefined') return false;
  
  const adminToken = localStorage.getItem('adminToken');
  return !!adminToken;
};

/**
 * Clear any admin tokens to prevent role confusion
 */
export const clearAdminTokens = () => {
  if (typeof localStorage === 'undefined') return;
  
  // Remove admin-specific tokens
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  
  console.log('Admin tokens cleared to prevent role confusion');
};

/**
 * Clear user token from localStorage
 */
export const clearUserToken = () => {
  if (typeof localStorage === 'undefined') return;
  
  localStorage.removeItem('token');
  console.log('User token cleared from localStorage');
};

/**
 * Validate that the current authentication context is appropriate for user role
 * @param {Object} user - User object from authentication
 * @returns {boolean} True if authentication context is valid
 */
export const validateUserAuthContext = (user) => {
  if (!user) return false;
  
  // If user has admin role, they shouldn't be using the client app
  if (user.role === 'admin') {
    console.warn('Admin user detected in client application - clearing session');
    clearAdminTokens();
    clearUserToken();
    return false;
  }
  
  return true;
};

/**
 * Initialize authentication guard on app startup
 */
export const initializeAuthGuard = () => {
  // Clear any admin tokens that might exist from admin panel usage
  clearAdminTokens();
  
  // Set up periodic check for admin tokens (every 5 minutes)
  setInterval(() => {
    if (checkForAdminToken()) {
      console.warn('Admin token detected in client app - clearing');
      clearAdminTokens();
    }
  }, 5 * 60 * 1000);
};
