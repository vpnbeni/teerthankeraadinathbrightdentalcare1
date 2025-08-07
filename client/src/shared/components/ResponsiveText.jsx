import React from "react";
import { useResponsive } from "../hooks";

const ResponsiveText = ({
  children,
  size = "base",
  weight = "normal",
  color = "gray-900",
  className = "",
  as: Component = "p",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  // Handle responsive size object or string
  const getResponsiveSize = () => {
    if (typeof size === "string") return size;

    if (typeof size === "object") {
      if (isMobile && size.mobile) return size.mobile;
      if (isBreakpoint("md") && size.tablet) return size.tablet;
      if (isBreakpoint("lg") && size.desktop) return size.desktop;
      return size.mobile || size.tablet || size.desktop || "base";
    }

    return "base";
  };

  // Handle responsive weight object or string
  const getResponsiveWeight = () => {
    if (typeof weight === "string") return weight;

    if (typeof weight === "object") {
      if (isMobile && weight.mobile) return weight.mobile;
      if (isBreakpoint("md") && weight.tablet) return weight.tablet;
      if (isBreakpoint("lg") && weight.desktop) return weight.desktop;
      return weight.mobile || weight.tablet || weight.desktop || "normal";
    }

    return "normal";
  };

  // Handle responsive color object or string
  const getResponsiveColor = () => {
    if (typeof color === "string") return color;

    if (typeof color === "object") {
      if (isMobile && color.mobile) return color.mobile;
      if (isBreakpoint("md") && color.tablet) return color.tablet;
      if (isBreakpoint("lg") && color.desktop) return color.desktop;
      return color.mobile || color.tablet || color.desktop || "gray-900";
    }

    return "gray-900";
  };

  const responsiveSize = getResponsiveSize();
  const responsiveWeight = getResponsiveWeight();
  const responsiveColor = getResponsiveColor();

  // Size classes mapping
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
  };

  // Weight classes mapping
  const weightClasses = {
    thin: "font-thin",
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
    black: "font-black",
  };

  // Build the final className
  const finalClassName = [
    sizeClasses[responsiveSize] || sizeClasses.base,
    weightClasses[responsiveWeight] || weightClasses.normal,
    `text-${responsiveColor}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={finalClassName} {...props}>
      {children}
    </Component>
  );
};

export default ResponsiveText;
