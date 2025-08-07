import React from "react";
import { Loader2 } from "lucide-react";
import { useAccessibility } from "../hooks/useAccessibility";

const LoadingSpinner = ({
  size = "medium",
  color = "primary",
  text = "",
  fullScreen = false,
  overlay = false,
  "aria-label": ariaLabel = "Loading",
}) => {
  const { reducedMotion } = useAccessibility();

  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
    xlarge: "h-12 w-12",
  };

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    white: "text-white",
    gray: "text-gray-500",
  };

  const spinnerElement = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label={ariaLabel}
    >
      <Loader2
        className={`${reducedMotion ? "" : "animate-spin"} ${
          sizeClasses[size]
        } ${colorClasses[color]}`}
        aria-hidden="true"
      />
      {text && (
        <p
          className={`text-sm ${colorClasses[color]} ${
            reducedMotion ? "" : "animate-pulse"
          }`}
        >
          {text}
        </p>
      )}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {spinnerElement}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// Higher-order component for wrapping components with loading state
export const withLoading = (WrappedComponent) => {
  return function WithLoadingComponent({ isLoading, loadingText, ...props }) {
    if (isLoading) {
      return (
        <div className="relative min-h-32">
          <LoadingSpinner overlay text={loadingText} />
        </div>
      );
    }
    return <WrappedComponent {...props} />;
  };
};

// Hook for managing loading states
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);

  const withLoadingWrapper = React.useCallback(
    async (asyncFunction) => {
      try {
        startLoading();
        const result = await asyncFunction();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading: withLoadingWrapper,
  };
};

export default LoadingSpinner;
