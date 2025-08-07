import React from "react";
import { useResponsive } from "../hooks";

const ResponsiveGrid = ({
  children,
  cols = 1,
  gap = 4,
  className = "",
  as: Component = "div",
  ...props
}) => { 
  const { isMobile, isBreakpoint } = useResponsive();

  // Handle responsive cols object or number
  const getResponsiveCols = () => {
    if (typeof cols === "number") return cols;

    if (typeof cols === "object") {
      if (isMobile && cols.mobile) return cols.mobile;
      if (isBreakpoint("md") && cols.tablet) return cols.tablet;
      if (isBreakpoint("lg") && cols.desktop) return cols.desktop;
      return cols.mobile || cols.tablet || cols.desktop || 1;
    }

    return 1;
  };

  // Handle responsive gap object or number
  const getResponsiveGap = () => {
    if (typeof gap === "number") return gap;

    if (typeof gap === "object") {
      if (isMobile && gap.mobile) return gap.mobile;
      if (isBreakpoint("md") && gap.tablet) return gap.tablet;
      if (isBreakpoint("lg") && gap.desktop) return gap.desktop;
      return gap.mobile || gap.tablet || gap.desktop || 4;
    }

    return 4;
  };

  const responsiveCols = getResponsiveCols();
  const responsiveGap = getResponsiveGap();

  // Grid columns classes mapping
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  };

  // Gap classes mapping
  const gapClasses = {
    0: "gap-0",
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    7: "gap-7",
    8: "gap-8",
    9: "gap-9",
    10: "gap-10",
    11: "gap-11",
    12: "gap-12",
  };

  // Build responsive grid classes
  const getResponsiveGridClasses = () => {
    const classes = ["grid"];

    if (typeof cols === "object") {
      // Add responsive column classes
      if (cols.mobile) {
        classes.push(colsClasses[cols.mobile] || "grid-cols-1");
      }
      if (cols.tablet) {
        classes.push(`md:${colsClasses[cols.tablet] || "grid-cols-2"}`);
      }
      if (cols.desktop) {
        classes.push(`lg:${colsClasses[cols.desktop] || "grid-cols-3"}`);
      }
    } else {
      classes.push(colsClasses[responsiveCols] || "grid-cols-1");
    }

    if (typeof gap === "object") {
      // Add responsive gap classes
      if (gap.mobile) {
        classes.push(gapClasses[gap.mobile] || "gap-4");
      }
      if (gap.tablet) {
        classes.push(`md:${gapClasses[gap.tablet] || "gap-4"}`);
      }
      if (gap.desktop) {
        classes.push(`lg:${gapClasses[gap.desktop] || "gap-6"}`);
      }
    } else {
      classes.push(gapClasses[responsiveGap] || "gap-4");
    }

    return classes;
  };

  // Build the final className
  const finalClassName = [...getResponsiveGridClasses(), className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={finalClassName} {...props}>
      {children}
    </Component>
  );
};

export default ResponsiveGrid;
