import React from "react";
import { Loader2 } from "lucide-react";
import { useAccessibility } from "../hooks/useAccessibility";
import { animationAccessibility } from "../utils/accessibility";

const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "medium",
      disabled = false,
      loading = false,
      loadingText = "Loading...",
      icon,
      iconPosition = "left",
      fullWidth = false,
      type = "button",
      onClick,
      onKeyDown,
      className = "",
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaHaspopup,
      ...props
    },
    ref
  ) => {
    const { reducedMotion, announce } = useAccessibility();

    // Base styles
    const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
    ${reducedMotion ? "transition-none" : ""}
  `;

    // Variant styles
    const variants = {
      primary: `
      bg-primary text-white hover:bg-primary-dark
      focus:ring-primary/50 active:bg-primary-800
      disabled:bg-primary/50 disabled:hover:bg-primary/50
    `,
      secondary: `
      bg-secondary text-gray-800 hover:bg-secondary-dark
      focus:ring-secondary/50 active:bg-secondary-600
      disabled:bg-secondary/50 disabled:hover:bg-secondary/50
    `,
      outline: `
      border-2 border-primary text-primary bg-transparent
      hover:bg-primary hover:text-white
      focus:ring-primary/50 active:bg-primary-dark active:text-white
      disabled:border-primary/50 disabled:text-primary/50
      disabled:hover:bg-transparent disabled:hover:text-primary/50
    `,
      ghost: `
      text-gray-700 bg-transparent hover:bg-gray-100
      focus:ring-gray-300 active:bg-gray-200
      disabled:text-gray-400 disabled:hover:bg-transparent
    `,
      danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500/50 active:bg-red-800
      disabled:bg-red-400 disabled:hover:bg-red-400
    `,
      success: `
      bg-green-600 text-white hover:bg-green-700
      focus:ring-green-500/50 active:bg-green-800
      disabled:bg-green-400 disabled:hover:bg-green-400
    `,
    };

    // Size styles
    const sizes = {
      small: "px-3 py-1.5 text-sm min-h-[32px]",
      medium: "px-4 py-2 text-sm min-h-[40px]",
      large: "px-6 py-3 text-base min-h-[48px]",
      xlarge: "px-8 py-4 text-lg min-h-[56px]",
    };

    // Icon sizes
    const iconSizes = {
      small: "h-4 w-4",
      medium: "h-5 w-5",
      large: "h-5 w-5",
      xlarge: "h-6 w-6",
    };

    // Handle click with accessibility announcements
    const handleClick = (e) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }

      // Announce action for screen readers if needed
      if (ariaLabel && !children) {
        announce(`${ariaLabel} activated`);
      }

      onClick?.(e);
    };

    // Handle keyboard interactions
    const handleKeyDown = (e) => {
      // Space key should trigger click for buttons
      if (e.key === " " && type === "button") {
        e.preventDefault();
        handleClick(e);
      }

      onKeyDown?.(e);
    };

    // Determine if button should show loading state
    const isLoading = loading && !disabled;
    const isDisabled = disabled || loading;

    // Build className
    const buttonClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `
      .trim()
      .replace(/\s+/g, " ");

    // Icon component
    const IconComponent = icon;
    const LoadingIcon = () => (
      <Loader2 className={`animate-spin ${iconSizes[size]}`} />
    );

    // Render icon based on position and state
    const renderIcon = () => {
      if (isLoading) {
        return <LoadingIcon />;
      }

      if (IconComponent) {
        return <IconComponent className={iconSizes[size]} />;
      }

      return null;
    };

    // Button content
    const buttonContent = (
      <>
        {iconPosition === "left" && renderIcon() && (
          <span className={children ? "mr-2" : ""}>{renderIcon()}</span>
        )}

        {isLoading && loadingText ? loadingText : children}

        {iconPosition === "right" && renderIcon() && (
          <span className={children ? "ml-2" : ""}>{renderIcon()}</span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

// Button group component for related actions
export const ButtonGroup = ({
  children,
  orientation = "horizontal",
  spacing = "medium",
  className = "",
  ...props
}) => {
  const spacingClasses = {
    small: orientation === "horizontal" ? "space-x-2" : "space-y-2",
    medium: orientation === "horizontal" ? "space-x-3" : "space-y-3",
    large: orientation === "horizontal" ? "space-x-4" : "space-y-4",
  };

  const orientationClasses = {
    horizontal: "flex flex-row",
    vertical: "flex flex-col",
  };

  return (
    <div
      className={`
        ${orientationClasses[orientation]}
        ${spacingClasses[spacing]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
};

// Icon button component for icon-only buttons
export const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      ariaLabel,
      size = "medium",
      variant = "ghost",
      className = "",
      ...props
    },
    ref
  ) => {
    if (!ariaLabel) {
      console.warn("IconButton requires an ariaLabel prop for accessibility");
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={Icon}
        ariaLabel={ariaLabel}
        className={`!p-2 ${className}`}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";

export default Button;
