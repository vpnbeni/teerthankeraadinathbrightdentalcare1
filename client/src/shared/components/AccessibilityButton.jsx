import React, { useState } from "react";
import { useAccessibility } from "../hooks";

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    announce,
  } = useAccessibility();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    announce(
      isOpen ? "Accessibility menu closed" : "Accessibility menu opened"
    );
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announce(
      highContrast
        ? "High contrast mode disabled"
        : "High contrast mode enabled"
    );
  };

  const handleReducedMotionToggle = () => {
    toggleReducedMotion();
    announce(
      reducedMotion ? "Reduced motion disabled" : "Reduced motion enabled"
    );
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    announce(`Font size changed to ${size}`);
  };

  const fontSizeOptions = [
    { value: "small", label: "Small" },
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" },
    { value: "xlarge", label: "Extra Large" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Accessibility Panel */}
      {isOpen && (
        <div
          className={`
            mb-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80
            ${highContrast ? "bg-black border-white text-white" : ""}
          `}
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-describedby="accessibility-description"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              id="accessibility-title"
              className={`text-lg font-semibold ${
                highContrast ? "text-white" : "text-gray-900"
              }`}
            >
              Accessibility Settings
            </h3>
            <button
              onClick={handleToggle}
              className={`
                p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  highContrast
                    ? "text-white hover:bg-gray-800"
                    : "text-gray-500 hover:bg-gray-100"
                }
              `}
              aria-label="Close accessibility settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p
            id="accessibility-description"
            className={`text-sm mb-4 ${
              highContrast ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Customize your viewing experience
          </p>

          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="high-contrast"
                className={`text-sm font-medium ${
                  highContrast ? "text-white" : "text-gray-700"
                }`}
              >
                High Contrast
              </label>
              <button
                id="high-contrast"
                onClick={handleHighContrastToggle}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    highContrast
                      ? "bg-blue-600"
                      : highContrast
                      ? "bg-gray-600"
                      : "bg-gray-200"
                  }
                `}
                role="switch"
                aria-checked={highContrast}
                aria-labelledby="high-contrast"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${highContrast ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="reduced-motion"
                className={`text-sm font-medium ${
                  highContrast ? "text-white" : "text-gray-700"
                }`}
              >
                Reduced Motion
              </label>
              <button
                id="reduced-motion"
                onClick={handleReducedMotionToggle}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    reducedMotion
                      ? "bg-blue-600"
                      : highContrast
                      ? "bg-gray-600"
                      : "bg-gray-200"
                  }
                `}
                role="switch"
                aria-checked={reducedMotion}
                aria-labelledby="reduced-motion"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${reducedMotion ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>

            {/* Font Size Selector */}
            <div>
              <label
                htmlFor="font-size"
                className={`block text-sm font-medium mb-2 ${
                  highContrast ? "text-white" : "text-gray-700"
                }`}
              >
                Font Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFontSizeChange(option.value)}
                    className={`
                      px-3 py-2 text-sm rounded-md border transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        fontSize === option.value
                          ? highContrast
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                          : highContrast
                          ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }
                    `}
                    aria-pressed={fontSize === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Button */}
      <button
        onClick={handleToggle}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            highContrast
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
        aria-label={
          isOpen
            ? "Close accessibility settings"
            : "Open accessibility settings"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
      </button>
    </div>
  );
};

export default AccessibilityButton;
