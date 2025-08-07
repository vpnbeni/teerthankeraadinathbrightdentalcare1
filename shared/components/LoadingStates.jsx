import React from "react";
import { Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Skeleton loader for content placeholders
export const SkeletonLoader = ({
  lines = 3,
  height = "h-4",
  className = "",
  animate = true,
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} ${
            animate ? "animate-pulse" : ""
          } ${index === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
};

// Card skeleton for loading cards
export const CardSkeleton = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

// Table skeleton for loading tables
export const TableSkeleton = ({ rows = 5, columns = 4, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Table header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded flex-1"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading overlay for forms and containers
export const LoadingOverlay = ({
  isLoading,
  children,
  message = "Loading...",
  blur = true,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={`absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 ${
            blur ? "backdrop-blur-sm" : ""
          }`}
        >
          <div className="text-center">
            <LoadingSpinner size="large" />
            {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// Button loading state
export const LoadingButton = ({
  isLoading,
  children,
  loadingText = "Loading...",
  disabled,
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`relative ${className} ${
        isLoading ? "cursor-not-allowed opacity-75" : ""
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText}
        </div>
      )}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
    </button>
  );
};

// Network status indicator
export const NetworkStatus = ({ isOnline = true, className = "" }) => {
  if (isOnline) {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <Wifi className="h-4 w-4 mr-1" />
        <span className="text-sm">Online</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-red-600 ${className}`}>
      <WifiOff className="h-4 w-4 mr-1" />
      <span className="text-sm">Offline</span>
    </div>
  );
};

// Empty state component
export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = "No data found",
  description = "There's nothing to show here yet.",
  action = null,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// Progress bar component
export const ProgressBar = ({
  progress = 0,
  className = "",
  showPercentage = true,
  color = "bg-primary",
  size = "h-2",
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      <div
        className={`w-full ${size} bg-gray-200 rounded-full overflow-hidden`}
      >
        <div
          className={`${size} ${color} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

// Infinite scroll loading indicator
export const InfiniteScrollLoader = ({
  isLoading,
  hasMore,
  className = "",
}) => {
  if (!isLoading && !hasMore) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <p className="text-sm">No more items to load</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <LoadingSpinner size="medium" text="Loading more..." />
      </div>
    );
  }

  return null;
};

// Lazy loading wrapper
export const LazyLoadWrapper = ({
  children,
  fallback = <SkeletonLoader />,
  className = "",
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return <div className={className}>{isLoaded ? children : fallback}</div>;
};

export default {
  SkeletonLoader,
  CardSkeleton,
  TableSkeleton,
  LoadingOverlay,
  LoadingButton,
  NetworkStatus,
  EmptyState,
  ProgressBar,
  InfiniteScrollLoader,
  LazyLoadWrapper,
};
