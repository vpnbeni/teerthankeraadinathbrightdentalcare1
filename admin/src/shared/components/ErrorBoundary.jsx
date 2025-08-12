import React from "react";
import { adminErrorHandler } from "../utils/error-handlers";
import { showToast } from "../utils/toast";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with context
    const errorContext = {
      component: this.props.componentName || "Unknown Component",
      props: this.props.errorContext || {},
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorBoundary: true,
    };

    // Log error with admin error handler
    adminErrorHandler.handleError(
      error,
      "COMPONENT_ERROR",
      "A component error occurred"
    );

    // Store error info in state
    this.setState({ errorInfo });

    // Show error toast if not in fallback mode
    if (!this.props.silent) {
      showToast.error(
        "A component error occurred. The page will be refreshed.",
        {
          title: "Component Error",
          duration: 5000,
        }
      );
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo, errorContext);
    }
  }

  reportError = (error, errorInfo, context) => {
    // Implement error reporting service integration
    // Example: Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
      errorId: this.state.errorId,
    };

    console.error("Error report:", errorReport);

    // In a real implementation, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorReport });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleReportIssue = () => {
    const errorDetails = {
      message: this.state.error?.message || "Unknown error",
      stack: this.state.error?.stack || "No stack trace",
      url: window.location.href,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
    };

    // Copy error details to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        showToast.success("Error details copied to clipboard");
      })
      .catch(() => {
        showToast.error("Failed to copy error details");
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Use minimal fallback for small components
      if (this.props.minimal) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">Component failed to load</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={this.handleRetry}
                  className="text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Full error page fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Error message */}
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.props.message ||
                  "An unexpected error occurred while loading this component. Please try again or refresh the page."}
              </p>

              {/* Error ID for support */}
              {this.state.errorId && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show error details
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="font-semibold text-red-600 mb-2">
                      {this.state.error.message}
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="mt-8 space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleRefresh}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>

                {/* Report issue button */}
                <button
                  onClick={this.handleReportIssue}
                  className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Error Details
                </button>
              </div>

              {/* Back to dashboard link */}
              <div className="mt-6">
                <a
                  href="#/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  ← Back to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary
      componentName={Component.displayName || Component.name}
      {...options}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

// Hook for error boundary functionality in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error, errorInfo = {}) => {
    setError({ error, errorInfo, timestamp: new Date() });
    adminErrorHandler.handleError(
      error,
      "HOOK_ERROR",
      "An error occurred in component hook"
    );
  }, []);

  // Throw error to trigger nearest error boundary
  React.useEffect(() => {
    if (error) {
      throw error.error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
    hasError: error !== null,
  };
};

export default ErrorBoundary;
