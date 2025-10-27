/**
 * Enhanced loading spinner component with logo-centered circular wave animation
 * Provides consistent loading indicators across the client panel
 */

// Loading spinner variants
export const SPINNER_VARIANTS = {
  CIRCLE: "circle",
  LOGO_WAVE: "logo-wave",
};

const LoadingSpinner = ({
  variant = SPINNER_VARIANTS.CIRCLE,
  size = "medium",
  color = "primary",
  message,
  fullScreen = false,
  className = "",
  ariaLabel,
  ...rest
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
    xlarge: "h-16 w-16",
  };

  const colorClasses = {
    primary: "text-[#346870]",
    secondary: "text-[#BDCFD1]",
    white: "text-white",
    gray: "text-gray-500",
  };

  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
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

      case SPINNER_VARIANTS.CIRCLE:
      default:
        return (
          <svg
            className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
            xmlns="http://www.w3.org/2000/svg"
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
        );
    }
  };

  // Container classes
  const containerClasses = [
    "flex items-center justify-center",
    fullScreen ? "fixed inset-0 z-50 bg-white bg-opacity-75" : "",
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
        <span className="text-base text-[#346870] font-medium ml-3">
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
