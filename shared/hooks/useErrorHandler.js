import { useState, useCallback } from "react";
import { showToast } from "../components/Toast";

// Enhanced error handling hook
export const useErrorHandler = (options = {}) => {
  const {
    defaultErrorMessage = "Something went wrong. Please try again.",
    logErrors = true,
    showToastOnError = true,
    retryAttempts = 0,
    retryDelay = 1000,
  } = options;

  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Handle error with optional retry logic
  const handleError = useCallback(
    async (error, customMessage = null, retryFunction = null) => {
      const errorMessage =
        customMessage ||
        error?.response?.data?.message ||
        error?.message ||
        defaultErrorMessage;

      setError({
        message: errorMessage,
        originalError: error,
        timestamp: new Date(),
      });

      // Log error if enabled
      if (logErrors) {
        console.error("Error handled:", {
          message: errorMessage,
          error,
          timestamp: new Date(),
          retryCount,
        });
      }

      // Show toast notification if enabled
      if (showToastOnError) {
        showToast.error(errorMessage);
      }

      // Retry logic
      if (retryFunction && retryCount < retryAttempts) {
        setIsRetrying(true);

        try {
          // Wait for retry delay
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }

          setRetryCount((prev) => prev + 1);
          await retryFunction();

          // Clear error on successful retry
          clearError();
        } catch (retryError) {
          // Handle retry failure
          await handleError(retryError, customMessage, retryFunction);
        } finally {
          setIsRetrying(false);
        }
      }
    },
    [
      defaultErrorMessage,
      logErrors,
      showToastOnError,
      retryAttempts,
      retryDelay,
      retryCount,
      clearError,
    ]
  );

  // Wrapper for async operations with error handling
  const withErrorHandling = useCallback(
    (asyncFunction, errorMessage = null) => {
      return async (...args) => {
        try {
          clearError();
          return await asyncFunction(...args);
        } catch (error) {
          await handleError(error, errorMessage);
          throw error;
        }
      };
    },
    [handleError, clearError]
  );

  // Wrapper for async operations with retry
  const withRetry = useCallback(
    (asyncFunction, errorMessage = null) => {
      return async (...args) => {
        const retryFunction = () => asyncFunction(...args);

        try {
          clearError();
          return await asyncFunction(...args);
        } catch (error) {
          await handleError(error, errorMessage, retryFunction);
          throw error;
        }
      };
    },
    [handleError, clearError]
  );

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    withErrorHandling,
    withRetry,
    canRetry: retryCount < retryAttempts,
  };
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);

    // Prevent the default browser behavior
    event.preventDefault();

    // Show user-friendly error message
    showToast.error("An unexpected error occurred. Please try again.");

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(event.reason);
    }
  });

  // Handle general JavaScript errors
  window.addEventListener("error", (event) => {
    console.error("JavaScript error:", event.error);

    // Show user-friendly error message for critical errors
    if (event.error && !event.error.handled) {
      showToast.error("A technical error occurred. Please refresh the page.");

      // Mark error as handled to prevent duplicate notifications
      event.error.handled = true;
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(event.error);
    }
  });
};

// Error boundary hook for functional components
export const useErrorBoundary = () => {
  const [error, setError] = useState(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error, errorInfo = {}) => {
    setError({ error, errorInfo, timestamp: new Date() });

    // Log error
    console.error("Error boundary caught:", error, errorInfo);

    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }, []);

  // Throw error to trigger error boundary
  const throwError = useCallback((error) => {
    throw error;
  }, []);

  return {
    error,
    resetError,
    captureError,
    throwError,
    hasError: error !== null,
  };
};

// Network error handler
export const useNetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
      showToast.success("Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError("No internet connection");
      showToast.error(
        "Connection lost. Please check your internet connection."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    networkError,
    isOffline: !isOnline,
  };
};

export default useErrorHandler;
