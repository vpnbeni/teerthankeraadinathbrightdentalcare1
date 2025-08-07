import React from "react";

const Toast = ({
  type = "info",
  title,
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose && onClose(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeConfig = {
    success: {
      icon: "✓",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-400",
      titleColor: "text-green-800",
      messageColor: "text-green-700",
    },
    error: {
      icon: "✕",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-400",
      titleColor: "text-red-800",
      messageColor: "text-red-700",
    },
    warning: {
      icon: "⚠",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-400",
      titleColor: "text-yellow-800",
      messageColor: "text-yellow-700",
    },
    info: {
      icon: "ℹ",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-400",
      titleColor: "text-blue-800",
      messageColor: "text-blue-700",
    },
  };

  const config = typeConfig[type];

  if (!isVisible) return null;

  // Safety check to prevent objects from being rendered as children
  const safeTitle =
    typeof title === "string" ? title : title ? String(title) : "";
  const safeMessage =
    typeof message === "string" ? message : message ? String(message) : "";

  // Additional safety check for nested objects
  if (typeof safeTitle === "object" || typeof safeMessage === "object") {
    console.error("Toast received object instead of string:", {
      title,
      message,
    });
    return null;
  }

  return (
    <div
      className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
    `}
    >
      <div
        className={`
        rounded-lg border p-4 shadow-lg
        ${config.bgColor} ${config.borderColor}
      `}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <div
              className={`w-5 h-5 flex items-center justify-center font-bold ${config.iconColor}`}
            >
              {config.icon}
            </div>
          </div>
          <div className="ml-3 flex-1">
            {safeTitle && (
              <h3 className={`text-sm font-medium ${config.titleColor}`}>
                {safeTitle}
              </h3>
            )}
            {safeMessage && (
              <p
                className={`text-sm ${safeTitle ? "mt-1" : ""} ${
                  config.messageColor
                }`}
              >
                {safeMessage}
              </p>
            )}
          </div>
          {onClose && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onClose(), 300);
                }}
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${config.iconColor} hover:${config.bgColor}
                `}
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
