/**
 * Enhanced loading spinner component with logo-centered circular wave animation
 * Provides consistent loading indicators across the admin panel
 */

import React from "react";

// Loading spinner variants
export const SPINNER_VARIANTS = {
  DOTS: "dots",
  CIRCLE: "circle",
  BARS: "bars",
  PULSE: "pulse",
  BOUNCE: "bounce",
  WAVE: "wave",
  LOGO_WAVE: "logo-wave", // New variant with logo and circular waves
};

// Loading spinner sizes
export const SPINNER_SIZES = {
  XS: "xs",
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
};

const LoadingSpinner = ({
  variant = SPINNER_VARIANTS.CIRCLE,
  size = SPINNER_SIZES.MD,
  color = "primary",
  message,
  overlay = false,
  fullScreen = false,
  className = "",
  ariaLabel,
  ...rest
}) => {
  // Allow variant to be passed as string or from SPINNER_VARIANTS
  const normalizedVariant = typeof variant === 'string'
    ? variant
    : variant;
  // Size configurations
  const sizeConfig = {
    [SPINNER_SIZES.XS]: {
      spinner: "w-4 h-4",
      text: "text-xs",
      gap: "gap-2",
    },
    [SPINNER_SIZES.SM]: {
      spinner: "w-5 h-5",
      text: "text-sm",
      gap: "gap-2",
    },
    [SPINNER_SIZES.MD]: {
      spinner: "w-6 h-6",
      text: "text-base",
      gap: "gap-3",
    },
    [SPINNER_SIZES.LG]: {
      spinner: "w-8 h-8",
      text: "text-lg",
      gap: "gap-4",
    },
    [SPINNER_SIZES.XL]: {
      spinner: "w-12 h-12",
      text: "text-xl",
      gap: "gap-4",
    },
  };

  // Color configurations
  const colorConfig = {
    primary: '#7DA4AA',
    blue: "text-blue-600",
    gray: "text-gray-600",
    red: "text-red-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
    pink: "text-pink-600",
    white: "text-white",
  };

  const config = sizeConfig[size] || sizeConfig[SPINNER_SIZES.MD];
  const colorClass = colorConfig[color] || colorConfig.primary;

  // Render different spinner variants
  const renderSpinner = () => {
    switch (normalizedVariant) {
      case SPINNER_VARIANTS.LOGO_WAVE:
      case 'logo-wave':
        return (
          <div className="relative flex items-center justify-center w-[200px] h-[200px] lg:w-[400px] lg:h-[400px]">
            {/* Three animated circular waves with gradient - responsive with staggered delays */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((wave) => (
                <div
                  key={wave}
                  className="absolute rounded-full animate-wave-pulse w-20 h-20 lg:w-40 lg:h-40"
                  style={{
                    background: `radial-gradient(circle, transparent 65%, rgba(52, 104, 112, 0.5) 70%, rgba(52, 104, 112, 0.3) 80%, transparent 90%)`,
                    animationDuration: '2s',
                    animationDelay: `${wave * 0.4}s`,
                  }}
                />
              ))}
            </div>

            {/* Logo in center - responsive */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <img
                src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                alt="Loading"
                className="w-24 h-24 lg:w-48 lg:h-48 object-contain animate-pulse"
                style={{
                  animationDuration: "2s",
                  filter: 'drop-shadow(0 0 20px rgba(52, 104, 112, 0.4))'
                }}
              />

              {/* Gradient glow under logo */}
              <div
                className="absolute -bottom-4 lg:-bottom-8 w-32 h-16 lg:w-64 lg:h-32 blur-2xl opacity-60 animate-pulse"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(125, 164, 170, 0.8) 0%, rgba(52, 104, 112, 0.6) 30%, transparent 70%)',
                  animationDuration: "2s",
                }}
              />
            </div>
          </div>
        );

      case SPINNER_VARIANTS.DOTS:
        return (
          <div className={`flex space-x-1 ${colorClass}`}>
            <div
              className={`${config.spinner
                .replace("w-", "w-")
                .replace("h-", "h-")
                .split(" ")[0]
                .replace(
                  "w-",
                  "w-2 h-2"
                )} bg-current rounded-full animate-bounce`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`${config.spinner
                .replace("w-", "w-")
                .replace("h-", "h-")
                .split(" ")[0]
                .replace(
                  "w-",
                  "w-2 h-2"
                )} bg-current rounded-full animate-bounce`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`${config.spinner
                .replace("w-", "w-")
                .replace("h-", "h-")
                .split(" ")[0]
                .replace(
                  "w-",
                  "w-2 h-2"
                )} bg-current rounded-full animate-bounce`}
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        );

      case SPINNER_VARIANTS.BARS:
        return (
          <div className={`flex space-x-1 ${colorClass}`}>
            <div
              className={`w-1 ${config.spinner.split(" ")[1]
                } bg-current animate-pulse`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`w-1 ${config.spinner.split(" ")[1]
                } bg-current animate-pulse`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`w-1 ${config.spinner.split(" ")[1]
                } bg-current animate-pulse`}
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className={`w-1 ${config.spinner.split(" ")[1]
                } bg-current animate-pulse`}
              style={{ animationDelay: "450ms" }}
            ></div>
          </div>
        );

      case SPINNER_VARIANTS.PULSE:
        return (
          <div className={`${config.spinner} ${colorClass}`}>
            <div className="w-full h-full bg-current rounded-full animate-ping opacity-75"></div>
          </div>
        );

      case SPINNER_VARIANTS.BOUNCE:
        return (
          <div className={`${config.spinner} ${colorClass}`}>
            <div className="w-full h-full bg-current rounded-full animate-bounce"></div>
          </div>
        );

      case SPINNER_VARIANTS.WAVE:
        return (
          <div className={`flex space-x-1 ${colorClass}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1 ${config.spinner.split(" ")[1]
                  } bg-current animate-pulse`}
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "1s",
                }}
              ></div>
            ))}
          </div>
        );

      case SPINNER_VARIANTS.CIRCLE:
      default:
        return (
          <div className={`${config.spinner} ${colorClass}`}>
            <svg
              className="animate-spin w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        );
    }
  };

  // Container classes
  const containerClasses = [
    "flex items-center justify-center",
    config.gap,
    fullScreen ? "fixed inset-0 z-50" : "",
    overlay ? "absolute inset-0 z-10" : "",
    overlay || fullScreen ? "bg-white bg-opacity-75" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={containerClasses}
      aria-label={ariaLabel || message || "Loading"}
      role="status"
      {...rest}
    >
      {renderSpinner()}
      {message && (
        <span className={`${config.text} ${colorClass} font-medium`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Specialized loading components
export const ButtonSpinner = ({
  size = SPINNER_SIZES.SM,
  color = "white",
  ...props
}) => (
  <LoadingSpinner
    variant={SPINNER_VARIANTS.CIRCLE}
    size={size}
    color={color}
    {...props}
  />
);

export const PageSpinner = ({ message = "Loading...", ...props }) => (
  <LoadingSpinner
    variant={SPINNER_VARIANTS.LOGO_WAVE}
    size={SPINNER_SIZES.LG}
    color="primary"
    message={message}
    fullScreen
    {...props}
  />
);

export const OverlaySpinner = ({ message, ...props }) => (
  <LoadingSpinner
    variant={SPINNER_VARIANTS.CIRCLE}
    size={SPINNER_SIZES.MD}
    color="primary"
    message={message}
    overlay
    {...props}
  />
);

export const InlineSpinner = ({ size = SPINNER_SIZES.SM, ...props }) => (
  <LoadingSpinner
    variant={SPINNER_VARIANTS.CIRCLE}
    size={size}
    color="primary"
    {...props}
  />
);

export const TableSpinner = ({ message = "Loading data...", ...props }) => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner
      variant={SPINNER_VARIANTS.CIRCLE}
      size={SPINNER_SIZES.MD}
      color="primary"
      message={message}
      {...props}
    />
  </div>
);

export const CardSpinner = ({ message, ...props }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner
      variant={SPINNER_VARIANTS.CIRCLE}
      size={SPINNER_SIZES.MD}
      color="primary"
      message={message}
      {...props}
    />
  </div>
);

// Loading skeleton components
export const SkeletonLoader = ({
  lines = 3,
  className = "",
  animate = true,
  ...props
}) => (
  <div className={`space-y-3 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 rounded ${animate ? "animate-pulse" : ""}`}
        style={{
          width: `${Math.random() * 40 + 60}%`,
        }}
      ></div>
    ))}
  </div>
);

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  className = "",
  ...props
}) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="h-4 bg-gray-200 rounded animate-pulse flex-1"
          ></div>
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ className = "", ...props }) => (
  <div className={`p-6 bg-white rounded-lg shadow ${className}`} {...props}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

// Loading state wrapper component
export const LoadingWrapper = ({
  loading = false,
  error = null,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  className = "",
  ...props
}) => {
  if (loading) {
    return loadingComponent || <CardSpinner />;
  }

  if (error) {
    return (
      errorComponent || (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Failed to load data</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      )
    );
  }

  if (isEmpty) {
    return (
      emptyComponent || (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      )
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default LoadingSpinner;
