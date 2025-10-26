import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LoadingSpinner } from "../../shared/components";
import { validateAdminAuthContext, clearUserTokens } from "../../utils/authGuard.js";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Debug logging
  // console.log("ProtectedRoute - Auth state:", {
  //   isAuthenticated,
  //   loading,
  //   user,
  //   requiredRole,
  // });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" ariaLabel="Checking authentication" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // console.log("ProtectedRoute - Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Validate that this user should be using the admin app
  if (user && !validateAdminAuthContext(user)) {
    console.warn("ProtectedRoute: Non-admin user detected - clearing session");
    clearUserTokens();
    localStorage.removeItem("adminToken");
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // console.log("ProtectedRoute - Role mismatch:", {
    //   userRole: user?.role,
    //   requiredRole,
    // });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            User role: {user?.role || "undefined"}, Required: {requiredRole}
          </p>
        </div>
      </div>
    );
  }

  // console.log("ProtectedRoute - Access granted");
  return children;
};

export default ProtectedRoute;
