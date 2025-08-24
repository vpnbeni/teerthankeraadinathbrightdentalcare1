import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setAuthState } from "../store/authSlice";
import { validateUserAuthContext, clearUserToken } from "../utils/authGuard.js";

/**
 * Simplified auth hook for login functionality only
 * Does NOT automatically check auth status on mount
 */
export const useLoginAuth = () => {
  const dispatch = useDispatch();

  // Handle successful login and update auth state
  const handleSuccessfulLogin = useCallback(async (loginResponse) => {
    console.log("🔐 handleSuccessfulLogin: Processing login response:", loginResponse);
    
    try {
      // Extract user data from the nested response structure
      const userData = loginResponse.data?.data?.user || loginResponse.data?.user;
      const token = loginResponse.data?.data?.token || loginResponse.data?.token;
      
      if (userData && token) {
        console.log("🔐 handleSuccessfulLogin: Setting authentication state");
        
        // Validate that this user should be using the client app
        if (!validateUserAuthContext(userData)) {
          console.warn("🔐 handleSuccessfulLogin: Admin user detected - clearing session");
          clearUserToken();
          throw new Error("Admin users cannot access client application");
        }
        
        // Update Redux store to sync with other components
        dispatch(setAuthState({
          isAuthenticated: true,
          user: userData,
          token: token
        }));
        
        console.log("🔐 handleSuccessfulLogin: Authentication state updated successfully");
        return userData;
      } else {
        console.error("🔐 handleSuccessfulLogin: Invalid response structure", loginResponse);
        throw new Error("Invalid login response");
      }
    } catch (error) {
      console.error("🔐 handleSuccessfulLogin: Error processing login:", error);
      throw error;
    }
  }, [dispatch]);

  return {
    handleSuccessfulLogin
  };
};
