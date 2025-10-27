/**
 * Simple loading spinner that doesn't depend on any context
 * Use this for loading states before providers are initialized
 */
const SimpleLoadingSpinner = ({
  variant = "logo-wave",
  size = "medium",
  color = "primary",
  className = "",
}) => {
  const sizeClasses = {
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

  // Logo wave variant for initial app loading
  if (variant === "logo-wave") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative flex items-center justify-center w-[200px] h-[200px] lg:w-[400px] lg:h-[400px]">
          {/* Three animated circular waves with gradient */}
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

          {/* Logo in center */}
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
      </div>
    );
  }

  // Default circle spinner
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
        role="status"
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
};

export default SimpleLoadingSpinner;
