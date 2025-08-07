import React from "react";
import { useResponsive } from "../hooks/useAccessibility";

const ResponsiveContainer = ({
  children,
  mobile,
  tablet,
  desktop,
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  // Render different content based on screen size
  const renderContent = () => {
    if (isMobile && mobile) {
      return typeof mobile === "function" ? mobile() : mobile;
    }

    if (isBreakpoint("md") && !isBreakpoint("lg") && tablet) {
      return typeof tablet === "function" ? tablet() : tablet;
    }

    if (isBreakpoint("lg") && desktop) {
      return typeof desktop === "function" ? desktop() : desktop;
    }

    return typeof children === "function" ? children() : children;
  };

  return (
    <div className={className} {...props}>
      {renderContent()}
    </div>
  );
};

// Grid component that adapts to screen size
export const ResponsiveGrid = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  const getGridCols = () => {
    if (isMobile) return cols.mobile || 1;
    if (isBreakpoint("md") && !isBreakpoint("lg")) return cols.tablet || 2;
    return cols.desktop || 3;
  };

  const gridCols = getGridCols();
  const gapClass = `gap-${gap}`;
  const colsClass = `grid-cols-${gridCols}`;

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Stack component for vertical layouts
export const ResponsiveStack = ({
  children,
  spacing = { mobile: 4, tablet: 6, desktop: 8 },
  direction = { mobile: "vertical", tablet: "vertical", desktop: "horizontal" },
  align = "start",
  justify = "start",
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  const getSpacing = () => {
    if (isMobile) return spacing.mobile || 4;
    if (isBreakpoint("md") && !isBreakpoint("lg")) return spacing.tablet || 6;
    return spacing.desktop || 8;
  };

  const getDirection = () => {
    if (isMobile) return direction.mobile || "vertical";
    if (isBreakpoint("md") && !isBreakpoint("lg"))
      return direction.tablet || "vertical";
    return direction.desktop || "horizontal";
  };

  const currentSpacing = getSpacing();
  const currentDirection = getDirection();

  const directionClass =
    currentDirection === "horizontal" ? "flex-row" : "flex-col";
  const spacingClass =
    currentDirection === "horizontal"
      ? `space-x-${currentSpacing}`
      : `space-y-${currentSpacing}`;

  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  }[align];

  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }[justify];

  return (
    <div
      className={`flex ${directionClass} ${spacingClass} ${alignClass} ${justifyClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive text component
export const ResponsiveText = ({
  children,
  size = { mobile: "sm", tablet: "base", desktop: "lg" },
  weight = "normal",
  color = "gray-900",
  align = "left",
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  const getSize = () => {
    if (isMobile) return size.mobile || "sm";
    if (isBreakpoint("md") && !isBreakpoint("lg")) return size.tablet || "base";
    return size.desktop || "lg";
  };

  const currentSize = getSize();
  const sizeClass = `text-${currentSize}`;
  const weightClass = `font-${weight}`;
  const colorClass = `text-${color}`;
  const alignClass = `text-${align}`;

  return (
    <span
      className={`${sizeClass} ${weightClass} ${colorClass} ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Responsive image component
export const ResponsiveImage = ({
  src,
  alt,
  sizes = { mobile: "w-full", tablet: "w-1/2", desktop: "w-1/3" },
  aspectRatio = "aspect-video",
  objectFit = "object-cover",
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  const getSize = () => {
    if (isMobile) return sizes.mobile || "w-full";
    if (isBreakpoint("md") && !isBreakpoint("lg"))
      return sizes.tablet || "w-1/2";
    return sizes.desktop || "w-1/3";
  };

  const currentSize = getSize();

  return (
    <div className={`${currentSize} ${aspectRatio} ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full ${objectFit} rounded-lg`}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({
  children,
  padding = { mobile: 4, tablet: 6, desktop: 8 },
  shadow = "shadow-md",
  rounded = "rounded-lg",
  background = "bg-white",
  border = "border border-gray-200",
  className = "",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  const getPadding = () => {
    if (isMobile) return padding.mobile || 4;
    if (isBreakpoint("md") && !isBreakpoint("lg")) return padding.tablet || 6;
    return padding.desktop || 8;
  };

  const currentPadding = getPadding();
  const paddingClass = `p-${currentPadding}`;

  return (
    <div
      className={`${background} ${border} ${rounded} ${shadow} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Hook for responsive values
export const useResponsiveValue = (values) => {
  const { isMobile, isBreakpoint } = useResponsive();

  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }

  if (
    isBreakpoint("md") &&
    !isBreakpoint("lg") &&
    values.tablet !== undefined
  ) {
    return values.tablet;
  }

  if (isBreakpoint("lg") && values.desktop !== undefined) {
    return values.desktop;
  }

  return values.default || values.desktop || values.tablet || values.mobile;
};

export default ResponsiveContainer;
