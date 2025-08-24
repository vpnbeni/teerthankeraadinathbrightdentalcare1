import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Appointments from "./pages/Appointments";
import Payments from "./pages/Payments";
import ProtectedRoute from "./components/common/ProtectedRoute";
// Debug component (development only)
import ApiTest from "./components/debug/ApiTest";
import {
  ErrorBoundary,
  ToastContainer,
  SkipLinks,
  LoadingSpinner,
} from "./shared/components";
import SimpleLoadingSpinner from "./shared/components/SimpleLoadingSpinner";
import { setupGlobalErrorHandler, AccessibilityProvider } from "./shared/hooks";
import { checkAuthStatus } from "./store/authSlice";
import "./shared/styles/accessibility.css";

// Safety wrapper to prevent object rendering
const SafeRender = ({ children }) => {
  try {
    return children;
  } catch (error) {
    if (
      error.message &&
      error.message.includes("Objects are not valid as a React child")
    ) {
      console.error("SafeRender caught object rendering error:", error);
      return <div>Error: Invalid content detected</div>;
    }
    throw error;
  }
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Setup global error handlers and check auth status
  React.useEffect(() => {
    const initialize = async () => {
      setupGlobalErrorHandler();

      try {
        // Check if user is already authenticated (via HTTP-only cookie)
        await dispatch(checkAuthStatus());
      } catch (error) {
        // Auth check failed, user is not authenticated
        // This is expected for new users, so we don't treat it as an error
        console.log("Initial auth check failed (expected for new users):", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [dispatch]);

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SimpleLoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <AccessibilityProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Skip Links for keyboard navigation */}
          <SkipLinks />

          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage />
                )
              }
            />
            <Route
              path="/login"
              element={<LoginPage />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* Debug route (development only) */}
            {process.env.NODE_ENV === "development" && (
              <Route path="/debug/api" element={<ApiTest />} />
            )}

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Toast Container */}
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </AccessibilityProvider>
  );
}

export default App;
