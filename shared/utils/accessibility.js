/**
 * Accessibility utilities for WCAG compliance
 */

// Focus management utilities
export const focusManagement = {
  // Trap focus within a container (for modals, dropdowns)
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  },

  // Restore focus to previously focused element
  restoreFocus: (previousElement) => {
    if (previousElement && typeof previousElement.focus === "function") {
      previousElement.focus();
    }
  },

  // Get next focusable element
  getNextFocusableElement: (currentElement, direction = "forward") => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1) return null;

    const nextIndex =
      direction === "forward"
        ? (currentIndex + 1) % focusableElements.length
        : (currentIndex - 1 + focusableElements.length) %
          focusableElements.length;

    return focusableElements[nextIndex];
  },
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation for lists/grids
  handleArrowKeys: (e, items, currentIndex, onSelect) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(items[currentIndex]);
        return currentIndex;
    }

    if (newIndex !== currentIndex) {
      onSelect(items[newIndex]);
    }
    return newIndex;
  },

  // Escape key handler
  handleEscape: (callback) => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  },
};

// Screen reader utilities
export const screenReader = {
  // Announce message to screen readers
  announce: (message, priority = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create accessible description
  createDescription: (id, text) => {
    let description = document.getElementById(id);
    if (!description) {
      description = document.createElement("div");
      description.id = id;
      description.className = "sr-only";
      document.body.appendChild(description);
    }
    description.textContent = text;
    return id;
  },
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1, color2) => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = "AA", size = "normal") => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    const requirements = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 },
    };
    return ratio >= requirements[level][size];
  },
};

// Responsive utilities
export const responsive = {
  // Get current breakpoint
  getCurrentBreakpoint: () => {
    const width = window.innerWidth;
    if (width < 640) return "sm";
    if (width < 768) return "md";
    if (width < 1024) return "lg";
    if (width < 1280) return "xl";
    return "2xl";
  },

  // Check if mobile device
  isMobile: () => {
    return window.innerWidth < 768;
  },

  // Check if touch device
  isTouchDevice: () => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  },

  // Get safe area insets for mobile devices
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.getPropertyValue("--safe-area-inset-top") || "0px",
      right: style.getPropertyValue("--safe-area-inset-right") || "0px",
      bottom: style.getPropertyValue("--safe-area-inset-bottom") || "0px",
      left: style.getPropertyValue("--safe-area-inset-left") || "0px",
    };
  },
};

// Form accessibility utilities
export const formAccessibility = {
  // Generate unique ID for form elements
  generateId: (prefix = "field") => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Associate label with input
  associateLabel: (inputId, labelText, required = false) => {
    return {
      id: inputId,
      "aria-required": required,
      "aria-describedby": `${inputId}-description`,
      "aria-invalid": false,
    };
  },

  // Create error message attributes
  createErrorAttributes: (inputId, errorMessage) => {
    return {
      "aria-invalid": true,
      "aria-describedby": `${inputId}-error`,
      errorId: `${inputId}-error`,
      errorMessage,
    };
  },
};

// Animation utilities for accessibility
export const animationAccessibility = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  // Get animation duration based on user preference
  getAnimationDuration: (normalDuration = 300) => {
    return animationAccessibility.prefersReducedMotion() ? 0 : normalDuration;
  },

  // Create accessible transition
  createTransition: (
    property = "all",
    duration = 300,
    easing = "ease-in-out"
  ) => {
    const actualDuration =
      animationAccessibility.getAnimationDuration(duration);
    return actualDuration > 0
      ? `${property} ${actualDuration}ms ${easing}`
      : "none";
  },
};

export default {
  focusManagement,
  keyboardNavigation,
  screenReader,
  colorContrast,
  responsive,
  formAccessibility,
  animationAccessibility,
};
