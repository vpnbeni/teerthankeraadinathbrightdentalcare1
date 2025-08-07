import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Retry wrapper component for handling failed operations
export const RetryWrapper = ({
  children,
  onRetry,
  error,
  loading = false,
  maxRetries = 3,
  retryCount = 0,
  retryDelay = 1000,
  showRetryButton = true,
  fallback = null,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);

    // Add delay before retry
    if (retryDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading || isRetrying) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner
          size="large"
          text={isRetrying ? "Retrying..." : "Loading..."}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">
          {typeof error === "string" ? error : "An unexpected error occurred"}
        </p>

        {showRetryButton && retryCount < maxRetries && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
            />
            Try Again ({maxRetries - retryCount} attempts left)
          </button>
        )}

        {retryCount >= maxRetries && (
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Maximum retry attempts reached. Please refresh the page or contact
              support.
            </p>
            {fallback && <div className="mt-4">{fallback}</div>}
          </div>
        )}
      </div>
    );
  }

  return children;
};

// Hook for retry logic
export const useRetry = (asyncFunction, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = false,
    onError = null,
    onSuccess = null,
  } = options;

  const [state, setState] = React.useState({
    data: null,
    error: null,
    loading: false,
    retryCount: 0,
  });

  const execute = React.useCallback(
    async (resetRetryCount = false) => {
      const currentRetryCount = resetRetryCount ? 0 : state.retryCount;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        retryCount: currentRetryCount,
      }));

      try {
        const result = await asyncFunction();
        setState((prev) => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
        }));

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        const newRetryCount = currentRetryCount + 1;

        setState((prev) => ({
          ...prev,
          loading: false,
          error,
          retryCount: newRetryCount,
        }));

        if (onError) {
          onError(error, newRetryCount);
        }

        // Auto-retry if under max retries
        if (newRetryCount < maxRetries) {
          const delay = exponentialBackoff
            ? retryDelay * Math.pow(2, newRetryCount - 1)
            : retryDelay;

          setTimeout(() => {
            execute();
          }, delay);
        }

        throw error;
      }
    },
    [
      asyncFunction,
      state.retryCount,
      maxRetries,
      retryDelay,
      exponentialBackoff,
      onError,
      onSuccess,
    ]
  );

  const retry = React.useCallback(() => {
    if (state.retryCount < maxRetries) {
      execute();
    }
  }, [execute, state.retryCount, maxRetries]);

  const reset = React.useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: state.retryCount < maxRetries,
  };
};

// Higher-order component for adding retry functionality
export const withRetry = (WrappedComponent, retryOptions = {}) => {
  return function WithRetryComponent(props) {
    const [error, setError] = React.useState(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setError(null);
      setRetryCount((prev) => prev + 1);
    }, []);

    const handleError = React.useCallback((error) => {
      setError(error);
    }, []);

    return (
      <RetryWrapper
        error={error}
        onRetry={handleRetry}
        retryCount={retryCount}
        {...retryOptions}
      >
        <WrappedComponent
          {...props}
          onError={handleError}
          retryCount={retryCount}
        />
      </RetryWrapper>
    );
  };
};

export default RetryWrapper;
