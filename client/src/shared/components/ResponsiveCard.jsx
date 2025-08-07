import React from "react";
import { useResponsive } from "../hooks";

const ResponsiveCard = ({
  children,
  padding = 4,
  margin = 0,
  background = "bg-white",
  border = "border border-gray-200",
  rounded = "rounded-lg",
  shadow = "shadow-sm",
  className = "",
  as: Component = "div",
  ...props
}) => {
  const { isMobile, isBreakpoint } = useResponsive();

  // Handle responsive padding object or number
  const getResponsivePadding = () => {
    if (typeof padding === "number") return padding;

    if (typeof padding === "object") {
      if (isMobile && padding.mobile !== undefined) return padding.mobile;
      if (isBreakpoint("md") && padding.tablet !== undefined)
        return padding.tablet;
      if (isBreakpoint("lg") && padding.desktop !== undefined)
        return padding.desktop;
      return padding.mobile || padding.tablet || padding.desktop || 4;
    }

    return 4;
  };

  // Handle responsive margin object or number
  const getResponsiveMargin = () => {
    if (typeof margin === "number") return margin;

    if (typeof margin === "object") {
      if (isMobile && margin.mobile !== undefined) return margin.mobile;
      if (isBreakpoint("md") && margin.tablet !== undefined)
        return margin.tablet;
      if (isBreakpoint("lg") && margin.desktop !== undefined)
        return margin.desktop;
      return margin.mobile || margin.tablet || margin.desktop || 0;
    }

    return 0;
  };

  // Handle responsive background object or string
  const getResponsiveBackground = () => {
    if (typeof background === "string") return background;

    if (typeof background === "object") {
      if (isMobile && background.mobile) return background.mobile;
      if (isBreakpoint("md") && background.tablet) return background.tablet;
      if (isBreakpoint("lg") && background.desktop) return background.desktop;
      return (
        background.mobile ||
        background.tablet ||
        background.desktop ||
        "bg-white"
      );
    }

    return "bg-white";
  };

  const responsivePadding = getResponsivePadding();
  const responsiveMargin = getResponsiveMargin();
  const responsiveBackground = getResponsiveBackground();

  // Padding classes mapping
  const paddingClasses = {
    0: "p-0",
    1: "p-1",
    2: "p-2",
    3: "p-3",
    4: "p-4",
    5: "p-5",
    6: "p-6",
    7: "p-7",
    8: "p-8",
    9: "p-9",
    10: "p-10",
    11: "p-11",
    12: "p-12",
  };

  // Margin classes mapping
  const marginClasses = {
    0: "m-0",
    1: "m-1",
    2: "m-2",
    3: "m-3",
    4: "m-4",
    5: "m-5",
    6: "m-6",
    7: "p-7",
    8: "m-8",
    9: "m-9",
    10: "m-10",
    11: "m-11",
    12: "m-12",
  };

  // Build responsive classes
  const getResponsiveClasses = () => {
    const classes = [];

    // Add responsive padding classes
    if (typeof padding === "object") {
      if (padding.mobile !== undefined) {
        classes.push(paddingClasses[padding.mobile] || "p-4");
      }
      if (padding.tablet !== undefined) {
        classes.push(`md:${paddingClasses[padding.tablet] || "p-4"}`);
      }
      if (padding.desktop !== undefined) {
        classes.push(`lg:${paddingClasses[padding.desktop] || "p-6"}`);
      }
    } else {
      classes.push(paddingClasses[responsivePadding] || "p-4");
    }

    // Add responsive margin classes
    if (typeof margin === "object") {
      if (margin.mobile !== undefined) {
        classes.push(marginClasses[margin.mobile] || "m-0");
      }
      if (margin.tablet !== undefined) {
        classes.push(`md:${marginClasses[margin.tablet] || "m-0"}`);
      }
      if (margin.desktop !== undefined) {
        classes.push(`lg:${marginClasses[margin.desktop] || "m-0"}`);
      }
    } else if (responsiveMargin > 0) {
      classes.push(marginClasses[responsiveMargin] || "m-0");
    }

    return classes;
  };

  // Build the final className
  const finalClassName = [
    responsiveBackground,
    border,
    rounded,
    shadow,
    ...getResponsiveClasses(),
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

export default ResponsiveCard;
