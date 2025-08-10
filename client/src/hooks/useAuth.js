import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import userService from '../services/user';
import authService from '../services/auth';

/**
 * Custom hook for managing authentication state and user data
 * Provides centralized user data management with automatic token handling
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated and get user details
  const checkAuthStatus = useCallback(async () => {
    console.log('🔍 checkAuthStatus: Starting auth check...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 checkAuthStatus: Making API call to /auth/check');
      // Check authentication status (uses HTTP-only cookie automatically)
      const authResponse = await authService.checkAuth();
      console.log('🔍 checkAuthStatus: Auth response received:', authResponse);
      
      if (authResponse.data && authResponse.data.success) {
        console.log('🔍 checkAuthStatus: Auth successful, user data:', authResponse.data.data.user);
        setIsAuthenticated(true);
        setUser(authResponse.data.data.user);
        return authResponse.data.data.user;
      } else {
        console.log('🔍 checkAuthStatus: Auth failed - no success flag');
        setIsAuthenticated(false);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('🔍 checkAuthStatus: Auth check failed:', error);
      setError(error.response?.data?.message || 'Authentication check failed');
      setIsAuthenticated(false);
      setUser(null);
      
      // Redirect to home page if auth fails and we're not already there
      if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
        console.log('🔍 checkAuthStatus: Redirecting to home page due to auth failure');
        window.location.href = '/';
      }
      
      return null;
    } finally {
      console.log('🔍 checkAuthStatus: Auth check completed');
      setIsLoading(false);
    }
  }, []);

  // Get full user profile with detailed information
  const getUserProfile = useCallback(async () => {
    console.log('📋 getUserProfile: Starting profile fetch...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📋 getUserProfile: Making API call to /auth/profile');
      const profileResponse = await userService.getProfile();
      console.log('📋 getUserProfile: Profile response received:', profileResponse);
      
      if (profileResponse.data && profileResponse.data.success) {
        const userData = profileResponse.data.data;
        console.log('📋 getUserProfile: Profile fetch successful, user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        console.log('📋 getUserProfile: Profile fetch failed - no success flag');
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('📋 getUserProfile: Profile fetch failed:', error);
      setError(error.response?.data?.message || 'Failed to fetch user profile');
      
      // If profile fetch fails due to auth, try to check auth status
      if (error.response?.status === 401) {
        console.log('📋 getUserProfile: 401 error - setting auth to false');
        setIsAuthenticated(false);
        setUser(null);
      }
      
      throw error;
    } finally {
      console.log('📋 getUserProfile: Profile fetch completed');
      setIsLoading(false);
    }
  }, []);

  // Initialize auth check on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (isAuthenticated) {
      return await getUserProfile();
    } else {
      return await checkAuthStatus();
    }
  }, [isAuthenticated, getUserProfile, checkAuthStatus]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    checkAuthStatus,
    getUserProfile,
    refreshUser,
    logout,
    
    // Computed values
    userDetails: user, // Alias for backward compatibility
    hasValidUser: user && user.name && user.phone,
  };
};

/**
 * Hook specifically for payment flows that ensures user data is available
 */
export const usePaymentAuth = () => {
  const auth = useAuth();
  const [paymentUserDetails, setPaymentUserDetails] = useState(null);
  const [isValidForPayment, setIsValidForPayment] = useState(false);

  useEffect(() => {
    const validateUserForPayment = () => {
      if (auth.user) {
        // Validate required fields for payment
        const isValid = !!(
          auth.user.name &&
          auth.user.phone &&
          auth.user._id
        );

        if (isValid) {
          setPaymentUserDetails({
            _id: auth.user._id || auth.user.id,
            name: auth.user.name,
            phone: auth.user.phone,
            email: auth.user.email || '',
            // Include additional fields that might be needed
            role: auth.user.role,
            isVerified: auth.user.isVerified,
            subscription: auth.user.subscription
          });
          setIsValidForPayment(true);
        } else {
          setPaymentUserDetails(null);
          setIsValidForPayment(false);
        }
      } else {
        setPaymentUserDetails(null);
        setIsValidForPayment(false);
      }
    };

    validateUserForPayment();
  }, [auth.user]);

  // Ensure user data is loaded for payment
  const ensureUserDataForPayment = useCallback(async () => {
    console.log('🔒 ensureUserDataForPayment: Starting...');
    console.log('🔒 ensureUserDataForPayment: auth.isAuthenticated:', auth.isAuthenticated);
    console.log('🔒 ensureUserDataForPayment: paymentUserDetails:', paymentUserDetails);
    
    if (!auth.isAuthenticated) {
      console.log('🔒 ensureUserDataForPayment: User not authenticated');
      throw new Error('User must be logged in to proceed with payment');
    }

    if (!paymentUserDetails) {
      console.log('🔒 ensureUserDataForPayment: No payment user details, refreshing...');
      // Try to refresh user data
      await auth.refreshUser();
      
      // Wait for next tick to allow state update
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (!paymentUserDetails) {
        console.log('🔒 ensureUserDataForPayment: Still no payment user details after refresh');
        throw new Error('Unable to load user information required for payment');
      }
    }

    console.log('🔒 ensureUserDataForPayment: Returning payment user details:', paymentUserDetails);
    return paymentUserDetails;
  }, [auth.isAuthenticated, auth.refreshUser, paymentUserDetails]);

  return {
    ...auth,
    paymentUserDetails,
    isValidForPayment,
    ensureUserDataForPayment,
  };
};

export default useAuth;
