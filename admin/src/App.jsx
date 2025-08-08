import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthStatus } from "./store/authSlice";
import { LoadingSpinner, ErrorBoundary } from "./shared/components";
import { setupGlobalErrorHandler, AccessibilityProvider } from "./shared/hooks";
import AccessibilityTester from "./shared/components/AccessibilityTester";
import "./shared/styles/accessibility.css";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Dashboard Components
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import AppointmentManagement from "./pages/AppointmentManagement";
import AvailabilityManagement from "./pages/AvailabilityManagement";
import Analytics from "./pages/Analytics";
import SystemSettings from "./pages/SystemSettings";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
    setupGlobalErrorHandler();
  }, [dispatch]);

  if (loading) {
    return (
      <AccessibilityProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="large" ariaLabel="Loading application" />
        </div>
      </AccessibilityProvider>
    );
  }

  return (
    <AccessibilityProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Skip Links for keyboard navigation */}
          <div className="sr-only">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <a href="#navigation" className="skip-link">
              Skip to navigation
            </a>
            <a href="#sidebar" className="skip-link">
              Skip to sidebar
            </a>
          </div>

          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage />
                )
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppointmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AvailabilityManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SystemSettings />
                </ProtectedRoute>
              }
            />

            {/* Default Redirects */}
            <Route
              path="/"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />
            {/* Catch-all route to handle removed or unknown routes */}
            <Route
              path="*"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />
          </Routes>

          {/* Toast notifications are handled by react-hot-toast Toaster in main.jsx */}

         
        </div>
      </ErrorBoundary>
    </AccessibilityProvider>
  );
}

export default App;
