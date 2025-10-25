import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import userService from "../services/user";
import authService from "../services/auth";
import { validateUserAuthContext, clearAdminTokens, clearUserToken } from "../utils/authGuard.js";
import { setAuthState } from "../store/authSlice";

// Global flag to prevent duplicate auth checks across all hook instances
let isAuthCheckInProgress = false;
let lastAuthCheckTime = 0;
const AUTH_CHECK_COOLDOWN = 1000; // 1 second cooldown between auth checks

/**
 * Custom hook for managing authentication state and user data
 * Provides centralized user data management with automatic token handling
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use Redux state as the source of truth
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const hasInitialized = useRef(false);

  // Check if user is authenticated and get user details
  const checkAuthStatus = useCallback(async () => {
    // Prevent duplicate calls using global flag and cooldown
    const now = Date.now();
    if (isAuthCheckInProgress || (now - lastAuthCheckTime < AUTH_CHECK_COOLDOWN)) {
      console.log("🔍 checkAuthStatus: Skipping - check already in progress or in cooldown");
      return user;
    }

    console.log("🔍 checkAuthStatus: Starting auth check...");
    isAuthCheckInProgress = true;
    lastAuthCheckTime = now;
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 checkAuthStatus: Making API call to /auth/check");
      // Check authentication status (uses token from localStorage via Authorization header)
      const authResponse = await authService.checkAuth();
      console.log("🔍 checkAuthStatus: Auth response received:", authResponse);

      if (authResponse.data && authResponse.data.success) {
        const userData = authResponse.data.data.user;
        console.log(
          "🔍 checkAuthStatus: Auth successful, user data:",
          userData
        );
        
        // Validate that this user should be using the client app
        if (!validateUserAuthContext(userData)) {
          console.warn("🔍 checkAuthStatus: Admin user detected - clearing session");
          clearUserToken();
          
          // Update Redux store to sync with AuthModal
          dispatch(setAuthState({
            isAuthenticated: false,
            user: null,
            token: null
          }));
          
          return null;
        }
        
        // Update Redux store to sync with AuthModal
        dispatch(setAuthState({
          isAuthenticated: true,
          user: userData,
          token: null // Token is already in localStorage
        }));
        
        return userData;
      } else {
        console.log("🔍 checkAuthStatus: Auth failed - no success flag");
        
        // Update Redux store to sync with AuthModal
        dispatch(setAuthState({
          isAuthenticated: false,
          user: null,
          token: null
        }));
        
        return null;
      }
    } catch (error) {
      console.error("🔍 checkAuthStatus: Auth check failed:", error);
      setError(error.response?.data?.message || "Authentication check failed");
      
      // Update Redux store to sync with AuthModal
      dispatch(setAuthState({
        isAuthenticated: false,
        user: null,
        token: null
      }));

      // Redirect to home page if auth fails and we're not already there
      if (window.location.hash !== "#/" && window.location.hash !== "#/home") {
        console.log(
          "🔍 checkAuthStatus: Redirecting to home page due to auth failure"
        );
        window.location.hash = "#/";
      }

      return null;
    } finally {
      console.log("🔍 checkAuthStatus: Auth check completed");
      isAuthCheckInProgress = false;
      setIsLoading(false);
    }
  }, [dispatch, user]);

  // Get full user profile with detailed information
  const getUserProfile = useCallback(async () => {
    console.log("📋 getUserProfile: Starting profile fetch...");
    setIsLoading(true);
    setError(null);

    try {
      console.log("📋 getUserProfile: Making API call to /auth/profile");
      const profileResponse = await userService.getProfile();
      console.log(
        "📋 getUserProfile: Profile response received:",
        profileResponse
      );

      if (profileResponse.data && profileResponse.data.success) {
        const userData = profileResponse.data.data;
        console.log(
          "📋 getUserProfile: Profile fetch successful, user data:",
          userData
        );
        
        // Update Redux store to sync with AuthModal
        dispatch(setAuthState({
          isAuthenticated: true,
          user: userData,
          token: null // Token is already in localStorage
        }));
        
        return userData;
      } else {
        console.log(
          "📋 getUserProfile: Profile fetch failed - no success flag"
        );
        throw new Error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("📋 getUserProfile: Profile fetch failed:", error);
      setError(error.response?.data?.message || "Failed to fetch user profile");

      // If profile fetch fails due to auth, try to check auth status
      if (error.response?.status === 401) {
        console.log("📋 getUserProfile: 401 error - setting auth to false");
        
        // Update Redux store to sync with AuthModal
        dispatch(setAuthState({
          isAuthenticated: false,
          user: null,
          token: null
        }));
      }

      throw error;
    } finally {
      console.log("📋 getUserProfile: Profile fetch completed");
      setIsLoading(false);
    }
  }, [dispatch]);

  // Initialize auth check on mount - but only once per hook instance
  // This prevents duplicate API calls when multiple components use this hook
  useEffect(() => {
    // Only check auth if we haven't initialized yet and don't have user data
    if (!hasInitialized.current && !user && !isAuthenticated) {
      hasInitialized.current = true;
      checkAuthStatus();
    }
  }, []); // Empty dependency array to run only once on mount

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout(); // This will also clear localStorage
    } catch (error) {
      console.error("Logout error:", error);
      // Clear localStorage even if server logout fails
      clearUserToken();
    } finally {
      setError(null);
      
      // Update Redux store to sync with AuthModal
      dispatch(setAuthState({
        isAuthenticated: false,
        user: null,
        token: null
      }));
    }
  }, [dispatch]);

  // Handle successful login and update auth state
  const handleSuccessfulLogin = useCallback(async (loginResponse) => {
    console.log("🔐 handleSuccessfulLogin: Processing login response:", loginResponse);
    
    try {
      // Extract user data from the nested response structure
      const userData = loginResponse.data?.data?.user || loginResponse.data?.user;
      const token = loginResponse.data?.data?.token || loginResponse.data?.token;
      
      if (userData && token) {
        console.log("🔐 handleSuccessfulLogin: Setting authentication state");
        setIsAuthenticated(true);
        setUser(userData);
        setError(null);
        
        // Update Redux store to sync with AuthModal
        dispatch(setAuthState({
          isAuthenticated: true,
          user: userData,
          token: token
        }));
        
        // Verify the token is working by making an auth check
        await checkAuthStatus();
        return userData;
      } else {
        console.error("🔐 handleSuccessfulLogin: Missing user data or token");
        throw new Error("Invalid login response");
      }
    } catch (error) {
      console.error("🔐 handleSuccessfulLogin: Error processing login:", error);
      setError("Failed to complete login process");
      throw error;
    }
  }, [checkAuthStatus, dispatch]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (isAuthenticated) {
      return await getUserProfile();
    } else {
      return await checkAuthStatus();
    }
  }, [isAuthenticated, getUserProfile, checkAuthStatus, dispatch]);

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
    handleSuccessfulLogin,

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
        const isValid = !!(auth.user.name && auth.user.phone && auth.user._id);

        if (isValid) {
          setPaymentUserDetails({
            _id: auth.user._id || auth.user.id,
            name: auth.user.name,
            phone: auth.user.phone,
            email: auth.user.email || "",
            // Include additional fields that might be needed
            role: auth.user.role,
            isVerified: auth.user.isVerified,
            subscription: auth.user.subscription,
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
    console.log("🔒 ensureUserDataForPayment: Starting...");
    console.log(
      "🔒 ensureUserDataForPayment: auth.isAuthenticated:",
      auth.isAuthenticated
    );
    console.log(
      "🔒 ensureUserDataForPayment: paymentUserDetails:",
      paymentUserDetails
    );

    if (!auth.isAuthenticated) {
      console.log("🔒 ensureUserDataForPayment: User not authenticated");
      throw new Error("User must be logged in to proceed with payment");
    }

    if (!paymentUserDetails) {
      console.log(
        "🔒 ensureUserDataForPayment: No payment user details, refreshing..."
      );
      // Try to refresh user data
      await auth.refreshUser();

      // Wait for next tick to allow state update
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (!paymentUserDetails) {
        console.log(
          "🔒 ensureUserDataForPayment: Still no payment user details after refresh"
        );
        throw new Error("Unable to load user information required for payment");
      }
    }

    console.log(
      "🔒 ensureUserDataForPayment: Returning payment user details:",
      paymentUserDetails
    );
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
