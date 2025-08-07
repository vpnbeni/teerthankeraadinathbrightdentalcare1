import React, { createContext, useContext, useReducer, useEffect } from "react";
import { animationAccessibility, responsive } from "../utils/accessibility";

// Accessibility settings context
const AccessibilityContext = createContext();

// Initial accessibility state
const initialState = {
  // Visual preferences
  highContrast: false,
  reducedMotion: false,
  fontSize: "normal", // small, normal, large, xlarge

  // Navigation preferences
  keyboardNavigation: false,
  screenReader: false,

  // Device/responsive info
  isMobile: false,
  isTouch: false,
  breakpoint: "lg",

  // Focus management
  focusVisible: false,
  skipLinks: true,

  // Announcements
  announcements: [],
};

// Accessibility actions
const accessibilityActions = {
  SET_HIGH_CONTRAST: "SET_HIGH_CONTRAST",
  SET_REDUCED_MOTION: "SET_REDUCED_MOTION",
  SET_FONT_SIZE: "SET_FONT_SIZE",
  SET_KEYBOARD_NAVIGATION: "SET_KEYBOARD_NAVIGATION",
  SET_SCREEN_READER: "SET_SCREEN_READER",
  SET_DEVICE_INFO: "SET_DEVICE_INFO",
  SET_FOCUS_VISIBLE: "SET_FOCUS_VISIBLE",
  ADD_ANNOUNCEMENT: "ADD_ANNOUNCEMENT",
  REMOVE_ANNOUNCEMENT: "REMOVE_ANNOUNCEMENT",
  RESET_SETTINGS: "RESET_SETTINGS",
};

// Accessibility reducer
const accessibilityReducer = (state, action) => {
  switch (action.type) {
    case accessibilityActions.SET_HIGH_CONTRAST:
      return { ...state, highContrast: action.payload };

    case accessibilityActions.SET_REDUCED_MOTION:
      return { ...state, reducedMotion: action.payload };

    case accessibilityActions.SET_FONT_SIZE:
      return { ...state, fontSize: action.payload };

    case accessibilityActions.SET_KEYBOARD_NAVIGATION:
      return { ...state, keyboardNavigation: action.payload };

    case accessibilityActions.SET_SCREEN_READER:
      return { ...state, screenReader: action.payload };

    case accessibilityActions.SET_DEVICE_INFO:
      return { ...state, ...action.payload };

    case accessibilityActions.SET_FOCUS_VISIBLE:
      return { ...state, focusVisible: action.payload };

    case accessibilityActions.ADD_ANNOUNCEMENT:
      return {
        ...state,
        announcements: [...state.announcements, action.payload],
      };

    case accessibilityActions.REMOVE_ANNOUNCEMENT:
      return {
        ...state,
        announcements: state.announcements.filter(
          (announcement) => announcement.id !== action.payload
        ),
      };

    case accessibilityActions.RESET_SETTINGS:
      return { ...initialState, ...action.payload };

    default:
      return state;
  }
};

// Accessibility Provider Component
export const AccessibilityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(accessibilityReducer, initialState);

  // Load saved preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("accessibility-preferences");
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({
          type: accessibilityActions.RESET_SETTINGS,
          payload: preferences,
        });
      } catch (error) {
        console.warn("Failed to load accessibility preferences:", error);
      }
    }

    // Detect system preferences
    const detectSystemPreferences = () => {
      const reducedMotion = animationAccessibility.prefersReducedMotion();
      const highContrast = window.matchMedia(
        "(prefers-contrast: high)"
      ).matches;
      const isMobile = responsive.isMobile();
      const isTouch = responsive.isTouchDevice();
      const breakpoint = responsive.getCurrentBreakpoint();

      dispatch({
        type: accessibilityActions.SET_DEVICE_INFO,
        payload: { isMobile, isTouch, breakpoint },
      });

      if (reducedMotion) {
        dispatch({
          type: accessibilityActions.SET_REDUCED_MOTION,
          payload: true,
        });
      }

      if (highContrast) {
        dispatch({
          type: accessibilityActions.SET_HIGH_CONTRAST,
          payload: true,
        });
      }
    };

    detectSystemPreferences();

    // Listen for system preference changes
    const mediaQueries = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(prefers-contrast: high)"),
    ];

    const handleMediaChange = () => detectSystemPreferences();
    mediaQueries.forEach((mq) =>
      mq.addEventListener("change", handleMediaChange)
    );

    // Listen for resize events
    const handleResize = () => {
      const isMobile = responsive.isMobile();
      const isTouch = responsive.isTouchDevice();
      const breakpoint = responsive.getCurrentBreakpoint();

      dispatch({
        type: accessibilityActions.SET_DEVICE_INFO,
        payload: { isMobile, isTouch, breakpoint },
      });
    };

    window.addEventListener("resize", handleResize);

    // Detect keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        dispatch({
          type: accessibilityActions.SET_KEYBOARD_NAVIGATION,
          payload: true,
        });
        dispatch({
          type: accessibilityActions.SET_FOCUS_VISIBLE,
          payload: true,
        });
      }
    };

    const handleMouseDown = () => {
      dispatch({
        type: accessibilityActions.SET_FOCUS_VISIBLE,
        payload: false,
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    // Cleanup
    return () => {
      mediaQueries.forEach((mq) =>
        mq.removeEventListener("change", handleMediaChange)
      );
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const preferences = {
      highContrast: state.highContrast,
      reducedMotion: state.reducedMotion,
      fontSize: state.fontSize,
      skipLinks: state.skipLinks,
    };

    localStorage.setItem(
      "accessibility-preferences",
      JSON.stringify(preferences)
    );
  }, [
    state.highContrast,
    state.reducedMotion,
    state.fontSize,
    state.skipLinks,
  ]);

  // Apply CSS classes based on preferences
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (state.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduced motion
    if (state.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Font size
    root.classList.remove(
      "font-small",
      "font-normal",
      "font-large",
      "font-xlarge"
    );
    root.classList.add(`font-${state.fontSize}`);

    // Focus visible
    if (state.focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }
  }, [
    state.highContrast,
    state.reducedMotion,
    state.fontSize,
    state.focusVisible,
  ]);

  const value = {
    ...state,
    dispatch,
    actions: accessibilityActions,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    console.warn(
      "useAccessibility used outside of AccessibilityProvider, returning defaults"
    );
    return {
      ...initialState,
      toggleHighContrast: () => {},
      toggleReducedMotion: () => {},
      setFontSize: () => {},
      announce: () => {},
      removeAnnouncement: () => {},
      announcements: [],
    };
  }

  const { dispatch, actions, announcements, ...settings } = context;

  // Helper functions
  const toggleHighContrast = () => {
    dispatch({
      type: actions.SET_HIGH_CONTRAST,
      payload: !settings.highContrast,
    });
  };

  const toggleReducedMotion = () => {
    dispatch({
      type: actions.SET_REDUCED_MOTION,
      payload: !settings.reducedMotion,
    });
  };

  const setFontSize = (size) => {
    dispatch({
      type: actions.SET_FONT_SIZE,
      payload: size,
    });
  };

  const announce = (message, priority = "polite") => {
    const id = Date.now().toString();
    const announcement = { id, message, priority, timestamp: Date.now() };

    dispatch({
      type: actions.ADD_ANNOUNCEMENT,
      payload: announcement,
    });

    // Auto-remove announcement after delay
    setTimeout(() => {
      dispatch({
        type: actions.REMOVE_ANNOUNCEMENT,
        payload: id,
      });
    }, 5000);

    return id;
  };

  const removeAnnouncement = (id) => {
    dispatch({
      type: actions.REMOVE_ANNOUNCEMENT,
      payload: id,
    });
  };

  return {
    // Settings
    ...settings,

    // Actions
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    announce,
    removeAnnouncement,

    // Announcements
    announcements,
  };
};

// Hook for focus management
export const useFocusManagement = () => {
  const { keyboardNavigation, focusVisible } = useAccessibility();

  const focusRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement;
  };

  const restoreFocus = () => {
    if (
      previousFocusRef.current &&
      typeof previousFocusRef.current.focus === "function"
    ) {
      previousFocusRef.current.focus();
    }
  };

  const focusElement = (element) => {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  };

  return {
    focusRef,
    keyboardNavigation,
    focusVisible,
    saveFocus,
    restoreFocus,
    focusElement,
  };
};

// Hook for responsive behavior
export const useResponsive = () => {
  const { isMobile, isTouch, breakpoint } = useAccessibility();

  const isBreakpoint = (bp) => {
    const breakpoints = ["sm", "md", "lg", "xl", "2xl"];
    const currentIndex = breakpoints.indexOf(breakpoint);
    const targetIndex = breakpoints.indexOf(bp);
    return currentIndex >= targetIndex;
  };

  return {
    isMobile,
    isTouch,
    breakpoint,
    isBreakpoint,
    isSmall: breakpoint === "sm",
    isMedium: breakpoint === "md",
    isLarge: breakpoint === "lg",
    isXLarge: breakpoint === "xl",
    is2XLarge: breakpoint === "2xl",
  };
};

export default useAccessibility;
