// Animation and motion utilities
export const animationAccessibility = {
  prefersReducedMotion: () => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  getAnimationDuration: (defaultDuration = 300) => {
    return animationAccessibility.prefersReducedMotion() ? 0 : defaultDuration;
  },

  createSafeTransition: (property, duration = 300, easing = "ease") => {
    const safeDuration = animationAccessibility.getAnimationDuration(duration);
    return `${property} ${safeDuration}ms ${easing}`;
  },

  // Enhanced animation utilities
  createResponsiveTransition: (
    property,
    mobileDuration = 200,
    desktopDuration = 300
  ) => {
    const isMobile = responsive.isMobile();
    const duration = isMobile ? mobileDuration : desktopDuration;
    return animationAccessibility.createSafeTransition(property, duration);
  },

  // Scroll behavior utilities
  smoothScrollTo: (element, options = {}) => {
    if (animationAccessibility.prefersReducedMotion()) {
      element.scrollIntoView({ block: "nearest", inline: "nearest" });
    } else {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
        ...options,
      });
    }
  },
};

// Responsive utilities
export const responsive = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  getCurrentBreakpoint: () => {
    const width = window.innerWidth;
    const { breakpoints } = responsive;

    if (width >= breakpoints["2xl"]) return "2xl";
    if (width >= breakpoints.xl) return "xl";
    if (width >= breakpoints.lg) return "lg";
    if (width >= breakpoints.md) return "md";
    return "sm";
  },

  isMobile: () => {
    return window.innerWidth < responsive.breakpoints.md;
  },

  isTouchDevice: () => {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  },

  isLandscape: () => {
    return window.innerWidth > window.innerHeight;
  },
};

// Focus management utilities
export const focusManagement = {
  getFocusableElements: (container = document) => {
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      "summary",
    ].join(", ");

    return Array.from(container.querySelectorAll(focusableSelectors)).filter(
      (element) => {
        // Filter out hidden elements
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.offsetWidth > 0 &&
          element.offsetHeight > 0
        );
      }
    );
  },

  trapFocus: (container) => {
    const focusableElements = focusManagement.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (focusableElements.length === 0) return;

      if (focusableElements.length === 1) {
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // Focus first element if nothing is focused
    if (!container.contains(document.activeElement) && firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  },

  // Enhanced focus utilities
  saveFocus: () => {
    return document.activeElement;
  },

  restoreFocus: (element) => {
    if (element && typeof element.focus === "function") {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        element.focus();
      }, 0);
    }
  },

  focusFirstError: (container = document) => {
    const errorElement = container.querySelector(
      '[aria-invalid="true"], .error input, .error select, .error textarea'
    );
    if (errorElement) {
      errorElement.focus();
      return true;
    }
    return false;
  },

  // Keyboard navigation helpers
  handleArrowNavigation: (elements, currentIndex, direction) => {
    let newIndex;

    switch (direction) {
      case "up":
      case "left":
        newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        break;
      case "down":
      case "right":
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        break;
      case "home":
        newIndex = 0;
        break;
      case "end":
        newIndex = elements.length - 1;
        break;
      default:
        return currentIndex;
    }

    if (elements[newIndex]) {
      elements[newIndex].focus();
    }

    return newIndex;
  },
};

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = "aria") => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Announce messages to screen readers
  announce: (message, priority = "polite") => {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";

    document.body.appendChild(announcer);

    // Small delay to ensure screen reader picks it up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Set ARIA attributes safely
  setAttributes: (element, attributes) => {
    if (!element) return;

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      } else {
        element.removeAttribute(key);
      }
    });
  },

  // Manage expanded state for collapsible elements
  toggleExpanded: (trigger, target) => {
    const isExpanded = trigger.getAttribute("aria-expanded") === "true";
    const newState = !isExpanded;

    trigger.setAttribute("aria-expanded", newState.toString());

    if (target) {
      target.setAttribute("aria-hidden", (!newState).toString());

      if (newState) {
        target.style.display = "";
      } else {
        target.style.display = "none";
      }
    }

    return newState;
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

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const l1 = colorContrast.getLuminance(...color1);
    const l2 = colorContrast.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = "AA", size = "normal") => {
    const ratio = colorContrast.getContrastRatio(color1, color2);

    if (level === "AAA") {
      return size === "large" ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === "large" ? ratio >= 3 : ratio >= 4.5;
    }
  },
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Common key codes
  keys: {
    ENTER: "Enter",
    SPACE: " ",
    TAB: "Tab",
    ESCAPE: "Escape",
    ARROW_UP: "ArrowUp",
    ARROW_DOWN: "ArrowDown",
    ARROW_LEFT: "ArrowLeft",
    ARROW_RIGHT: "ArrowRight",
    HOME: "Home",
    END: "End",
    PAGE_UP: "PageUp",
    PAGE_DOWN: "PageDown",
  },

  // Handle common keyboard interactions
  handleKeyDown: (event, handlers) => {
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  },

  // Create roving tabindex behavior
  createRovingTabindex: (container, items) => {
    let currentIndex = 0;

    const updateTabindex = (newIndex) => {
      items.forEach((item, index) => {
        item.setAttribute("tabindex", index === newIndex ? "0" : "-1");
      });
      currentIndex = newIndex;
    };

    const handleKeyDown = (event) => {
      switch (event.key) {
        case keyboardNavigation.keys.ARROW_RIGHT:
        case keyboardNavigation.keys.ARROW_DOWN:
          event.preventDefault();
          currentIndex = focusManagement.handleArrowNavigation(
            items,
            currentIndex,
            "right"
          );
          updateTabindex(currentIndex);
          break;

        case keyboardNavigation.keys.ARROW_LEFT:
        case keyboardNavigation.keys.ARROW_UP:
          event.preventDefault();
          currentIndex = focusManagement.handleArrowNavigation(
            items,
            currentIndex,
            "left"
          );
          updateTabindex(currentIndex);
          break;

        case keyboardNavigation.keys.HOME:
          event.preventDefault();
          currentIndex = 0;
          updateTabindex(currentIndex);
          items[currentIndex].focus();
          break;

        case keyboardNavigation.keys.END:
          event.preventDefault();
          currentIndex = items.length - 1;
          updateTabindex(currentIndex);
          items[currentIndex].focus();
          break;
      }
    };

    // Initialize
    updateTabindex(0);
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  },
};

// Screen reader utilities
export const screenReader = {
  // Detect if screen reader is likely being used
  isScreenReaderActive: () => {
    // Check for common screen reader indicators
    return (
      navigator.userAgent.includes("NVDA") ||
      navigator.userAgent.includes("JAWS") ||
      navigator.userAgent.includes("VoiceOver") ||
      window.speechSynthesis?.speaking ||
      document.querySelector("[aria-live]") !== null
    );
  },

  // Create live region for announcements
  createLiveRegion: (priority = "polite") => {
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    liveRegion.id = ariaUtils.generateId("live-region");

    document.body.appendChild(liveRegion);

    return {
      announce: (message) => {
        liveRegion.textContent = message;
      },
      destroy: () => {
        document.body.removeChild(liveRegion);
      },
    };
  },
};

// Form accessibility utilities
export const formAccessibility = {
  // Associate labels with form controls
  associateLabel: (input, label) => {
    const inputId = input.id || ariaUtils.generateId("input");
    input.id = inputId;
    label.setAttribute("for", inputId);
  },

  // Add error messaging
  addErrorMessage: (input, message) => {
    const errorId = ariaUtils.generateId("error");
    const errorElement = document.createElement("div");

    errorElement.id = errorId;
    errorElement.className = "error-message";
    errorElement.textContent = message;
    errorElement.setAttribute("role", "alert");

    input.parentNode.appendChild(errorElement);
    input.setAttribute("aria-describedby", errorId);
    input.setAttribute("aria-invalid", "true");

    return errorElement;
  },

  // Remove error messaging
  removeErrorMessage: (input) => {
    const errorId = input.getAttribute("aria-describedby");
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      input.removeAttribute("aria-describedby");
      input.removeAttribute("aria-invalid");
    }
  },

  // Validate form accessibility
  validateFormAccessibility: (form) => {
    const issues = [];

    // Check for labels
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      const label = form.querySelector(`label[for="${input.id}"]`);
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");

      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Input ${input.name || input.type} is missing a label`);
      }
    });

    // Check for required field indicators
    const requiredInputs = form.querySelectorAll("[required]");
    requiredInputs.forEach((input) => {
      const ariaRequired = input.getAttribute("aria-required");
      if (ariaRequired !== "true") {
        issues.push(
          `Required input ${
            input.name || input.type
          } should have aria-required="true"`
        );
      }
    });

    return issues;
  },
};

export default {
  animationAccessibility,
  responsive,
  focusManagement,
  ariaUtils,
  colorContrast,
  keyboardNavigation,
  screenReader,
  formAccessibility,
};
