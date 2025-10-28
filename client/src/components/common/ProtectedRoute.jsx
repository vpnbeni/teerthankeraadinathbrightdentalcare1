import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { updateUser } from "../../store/authSlice";
import { fetchUserProfile } from "../../store/userSlice";
import { validateUserAuthContext, clearAdminTokens, clearUserToken } from "../../utils/authGuard.js";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);

  useEffect(() => {
    // Only fetch user profile if authenticated and we don't have profile data yet
    // This prevents redundant API calls on every route change
    // No loading state needed - App.jsx already handled initial auth check
    if (isAuthenticated && user && !profile) {
      // Validate that this user should be using the client app
      if (!validateUserAuthContext(user)) {
        console.warn("ProtectedRoute: Admin user detected - clearing session");
        clearAdminTokens();
        clearUserToken();
        return;
      }
      
      dispatch(fetchUserProfile())
        .unwrap()
        .then((profileData) => {
          // Also update the auth store with the full profile data to keep both stores in sync
          if (profileData && profileData.data) {
            const userData = profileData.data.user || profileData.data;
            dispatch(updateUser(userData));
          }
        })
        .catch((error) => {
          console.error("Failed to fetch user profile:", error);
        });
    }
  }, [isAuthenticated, user, profile, dispatch]);

  // No loading spinner needed - App.jsx already shows logo loader during initialization
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
