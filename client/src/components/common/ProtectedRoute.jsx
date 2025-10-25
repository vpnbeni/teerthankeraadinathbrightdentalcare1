import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { checkAuthStatus, updateUser } from "../../store/authSlice";
import { fetchUserProfile } from "../../store/userSlice";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { validateUserAuthContext, clearAdminTokens, clearUserToken } from "../../utils/authGuard.js";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          await dispatch(checkAuthStatus()).unwrap();
        } catch (error) {
          // Auth check failed, user will be redirected
          console.log("Auth check failed:", error);
          setIsChecking(false);
          return;
        }
      }

      // Only fetch user profile if authenticated and we don't have profile data yet
      // This prevents redundant API calls on every route change
      if (isAuthenticated && user && !profile) {
        try {
          // Validate that this user should be using the client app
          if (!validateUserAuthContext(user)) {
            console.warn("ProtectedRoute: Admin user detected - clearing session");
            clearAdminTokens();
            clearUserToken();
            setIsChecking(false);
            return;
          }
          
          const profileData = await dispatch(fetchUserProfile()).unwrap();
          console.log("ProtectedRoute - Profile data fetched:", profileData);
          
          // Also update the auth store with the full profile data to keep both stores in sync
          if (profileData && profileData.data) {
            const userData = profileData.data.user || profileData.data;
            console.log("ProtectedRoute - Updating auth store with user data:", userData);
            console.log("ProtectedRoute - Profile photo in user data:", userData.profilePhoto);
            dispatch(updateUser(userData));
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, user, profile, dispatch]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Additional check: if user is admin, redirect them away
  if (user && user.role === 'admin') {
    console.warn("ProtectedRoute: Admin user attempting to access client dashboard");
    clearAdminTokens();
    clearUserToken();
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
