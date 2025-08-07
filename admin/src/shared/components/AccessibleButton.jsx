/**
 * Accessible Button Component
 * Provides WCAG-compliant buttons with proper touch targets and keyboard navigation
 */

import React, { forwardRef } from "react";
import { useAccessibility } from "../hooks";
import { animationAccessibility } from "../utils/accessibility";

const AccessibleButton = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      onClick,
      onKeyDown,
      type = "button",
      className = "",
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaPressed,
      role = "button",
      ...props
    },
    ref
  ) => {
    const { reducedMotion, isTouch } = useAccessibility();

    // Base button classes
    const baseClasses = [
      "inline-flex items-center justify-center font-medium rounded-md",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transition-colors duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      fullWidth ? "w-full" : "",
      reducedMotion ? "" : "transform hover:scale-105 active:scale-95",
    ]
      .filter(Boolean)
      .join(" ");

    // Variant classes
    const variantClasses = {
      primary: [
        "bg-[#346870] text-white",
        "hover:bg-[#2a5359] focus:ring-[#346870]/20",
        "disabled:bg-gray-300 disabled:text-gray-500",
      ].join(" "),

      secondary: [
        "bg-white text-gray-700 border border-gray-300",
        "hover:bg-gray-50 focus:ring-gray-500/20",
        "disabled:bg-gray-100 disabled:text-gray-400",
      ].join(" "),

      danger: [
        "bg-red-600 text-white",
        "hover:bg-red-700 focus:ring-red-500/20",
        "disabled:bg-gray-300 disabled:text-gray-500",
      ].join(" "),

      success: [
        "bg-green-600 text-white",
        "hover:bg-green-700 focus:ring-green-500/20",
        "disabled:bg-gray-300 disabled:text-gray-500",
      ].join(" "),

      warning: [
        "bg-yellow-600 text-white",
        "hover:bg-yellow-700 focus:ring-yellow-500/20",
        "disabled:bg-gray-300 disabled:text-gray-500",
      ].join(" "),

      ghost: [
        "bg-transparent text-gray-700",
        "hover:bg-gray-100 focus:ring-gray-500/20",
        "disabled:text-gray-400",
      ].join(" "),

      link: [
        "bg-transparent text-[#346870] underline",
        "hover:text-[#2a5359] focus:ring-[#346870]/20",
        "disabled:text-gray-400",
      ].join(" "),
    };

    // Size classes with proper touch targets
    const sizeClasses = {
      xs: isTouch ? "px-3 py-2 text-xs min-h-[44px]" : "px-2.5 py-1.5 text-xs",
      sm: isTouch ? "px-3 py-2 text-sm min-h-[44px]" : "px-3 py-2 text-sm",
      md: isTouch ? "px-4 py-2 text-sm min-h-[44px]" : "px-4 py-2 text-sm",
      lg: isTouch ? "px-4 py-2 text-base min-h-[48px]" : "px-4 py-2 text-base",
      xl: isTouch ? "px-6 py-3 text-base min-h-[52px]" : "px-6 py-3 text-base",
    };

    // Combine all classes
    const buttonClasses = [
      baseClasses,
      variantClasses[variant] || variantClasses.primary,
      sizeClasses[size] || sizeClasses.md,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Handle click with loading state
    const handleClick = (event) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }

      if (onClick) {
        onClick(event);
      }
    };

    // Handle keyboard events
    const handleKeyDown = (event) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }

      // Handle space and enter keys
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleClick(event);
      }

      if (onKeyDown) {
        onKeyDown(event);
      }
    };

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        role={role}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {leftIcon && !loading && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className={loading ? "opacity-75" : ""}>{children}</span>
        {rightIcon && !loading && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

// Specialized button components
export const PrimaryButton = (props) => (
  <AccessibleButton variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <AccessibleButton variant="secondary" {...props} />
);

export const DangerButton = (props) => (
  <AccessibleButton variant="danger" {...props} />
);

export const SuccessButton = (props) => (
  <AccessibleButton variant="success" {...props} />
);

export const WarningButton = (props) => (
  <AccessibleButton variant="warning" {...props} />
);

export const GhostButton = (props) => (
  <AccessibleButton variant="ghost" {...props} />
);

export const LinkButton = (props) => (
  <AccessibleButton variant="link" {...props} />
);

// Icon button component
export const IconButton = forwardRef(
  (
    {
      icon,
      ariaLabel,
      size = "md",
      variant = "ghost",
      className = "",
      ...props
    },
    ref
  ) => {
    const { isTouch } = useAccessibility();

    const iconSizes = {
      xs: "h-4 w-4",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-7 w-7",
    };

    const buttonSizes = {
      xs: isTouch ? "p-2 min-h-[44px] min-w-[44px]" : "p-1",
      sm: isTouch ? "p-2 min-h-[44px] min-w-[44px]" : "p-1.5",
      md: isTouch ? "p-2 min-h-[44px] min-w-[44px]" : "p-2",
      lg: isTouch ? "p-3 min-h-[48px] min-w-[48px]" : "p-2.5",
      xl: isTouch ? "p-3 min-h-[52px] min-w-[52px]" : "p-3",
    };

    return (
      <AccessibleButton
        ref={ref}
        variant={variant}
        className={`${buttonSizes[size]} ${className}`}
        ariaLabel={ariaLabel}
        {...props}
      >
        <span className={iconSizes[size]} aria-hidden="true">
          {icon}
        </span>
      </AccessibleButton>
    );
  }
);

IconButton.displayName = "IconButton";

// Button group component
export const ButtonGroup = ({
  children,
  orientation = "horizontal",
  className = "",
  ariaLabel,
  ...props
}) => {
  const orientationClasses = {
    horizontal: "flex flex-row",
    vertical: "flex flex-col",
  };

  return (
    <div
      className={`${orientationClasses[orientation]} ${className}`}
      role="group"
      aria-label={ariaLabel}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        // Add appropriate classes for grouped buttons
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        let groupClasses = "";
        if (orientation === "horizontal") {
          groupClasses = `
            ${!isFirst ? "-ml-px" : ""}
            ${!isFirst && !isLast ? "rounded-none" : ""}
            ${isFirst && !isLast ? "rounded-r-none" : ""}
            ${!isFirst && isLast ? "rounded-l-none" : ""}
          `;
        } else {
          groupClasses = `
            ${!isFirst ? "-mt-px" : ""}
            ${!isFirst && !isLast ? "rounded-none" : ""}
            ${isFirst && !isLast ? "rounded-b-none" : ""}
            ${!isFirst && isLast ? "rounded-t-none" : ""}
          `;
        }

        return React.cloneElement(child, {
          className: `${child.props.className || ""} ${groupClasses}`.trim(),
        });
      })}
    </div>
  );
};

// Toggle button component
export const ToggleButton = forwardRef(
  ({ pressed = false, onToggle, children, ariaLabel, ...props }, ref) => {
    const handleClick = (event) => {
      if (onToggle) {
        onToggle(!pressed, event);
      }
    };

    return (
      <AccessibleButton
        ref={ref}
        variant={pressed ? "primary" : "secondary"}
        onClick={handleClick}
        ariaPressed={pressed}
        ariaLabel={ariaLabel}
        {...props}
      >
        {children}
      </AccessibleButton>
    );
  }
);

ToggleButton.displayName = "ToggleButton";

export default AccessibleButton;
