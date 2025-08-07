// Brand Color Palette
export const COLORS = {
  // Primary Colors
  PRIMARY: "#346870",
  PRIMARY_LIGHT: "#4a7c85",
  PRIMARY_DARK: "#2a5459",
  PRIMARY_50: "#f0f4f5",
  PRIMARY_100: "#d4e2e4",
  PRIMARY_200: "#b8d0d3",
  PRIMARY_300: "#9cbec2",
  PRIMARY_400: "#80acb1",
  PRIMARY_500: "#346870",
  PRIMARY_600: "#2f5e66",
  PRIMARY_700: "#2a545c",
  PRIMARY_800: "#254a52",
  PRIMARY_900: "#204048",

  // Secondary Colors
  SECONDARY: "#BDCFD1",
  SECONDARY_LIGHT: "#d1e0e2",
  SECONDARY_DARK: "#a9bec0",
  SECONDARY_50: "#f8fafa",
  SECONDARY_100: "#e8f0f1",
  SECONDARY_200: "#d8e6e8",
  SECONDARY_300: "#c8dcdf",
  SECONDARY_400: "#b8d2d6",
  SECONDARY_500: "#BDCFD1",
  SECONDARY_600: "#aabcbe",
  SECONDARY_700: "#97a9ab",
  SECONDARY_800: "#849698",
  SECONDARY_900: "#718385",

  // Neutral Colors
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  GRAY_50: "#F9FAFB",
  GRAY_100: "#F3F4F6",
  GRAY_200: "#E5E7EB",
  GRAY_300: "#D1D5DB",
  GRAY_400: "#9CA3AF",
  GRAY_500: "#6B7280",
  GRAY_600: "#4B5563",
  GRAY_700: "#374151",
  GRAY_800: "#1F2937",
  GRAY_900: "#111827",

  // Status Colors
  SUCCESS: "#10B981",
  SUCCESS_LIGHT: "#34D399",
  SUCCESS_DARK: "#059669",
  WARNING: "#F59E0B",
  WARNING_LIGHT: "#FBBF24",
  WARNING_DARK: "#D97706",
  ERROR: "#EF4444",
  ERROR_LIGHT: "#F87171",
  ERROR_DARK: "#DC2626",
  INFO: "#3B82F6",
  INFO_LIGHT: "#60A5FA",
  INFO_DARK: "#2563EB",

  // Background Colors
  BACKGROUND: "#FFFFFF",
  BACKGROUND_SECONDARY: "#F9FAFB",
  BACKGROUND_TERTIARY: "#F3F4F6",

  // Text Colors
  TEXT_PRIMARY: "#111827",
  TEXT_SECONDARY: "#6B7280",
  TEXT_TERTIARY: "#9CA3AF",
  TEXT_INVERSE: "#FFFFFF",

  // Border Colors
  BORDER_PRIMARY: "#E5E7EB",
  BORDER_SECONDARY: "#D1D5DB",
  BORDER_FOCUS: "#346870",
};

// Tailwind CSS Color Classes
export const TAILWIND_COLORS = {
  PRIMARY: "bg-[#346870] text-white",
  PRIMARY_HOVER: "hover:bg-[#2a5459]",
  PRIMARY_LIGHT: "bg-[#4a7c85]",
  SECONDARY: "bg-[#BDCFD1] text-gray-800",
  SECONDARY_HOVER: "hover:bg-[#a9bec0]",
  SUCCESS: "bg-green-500 text-white",
  WARNING: "bg-yellow-500 text-white",
  ERROR: "bg-red-500 text-white",
  INFO: "bg-blue-500 text-white",
};

// CSS Custom Properties
export const CSS_VARIABLES = `
  :root {
    --color-primary: ${COLORS.PRIMARY};
    --color-primary-light: ${COLORS.PRIMARY_LIGHT};
    --color-primary-dark: ${COLORS.PRIMARY_DARK};
    --color-secondary: ${COLORS.SECONDARY};
    --color-secondary-light: ${COLORS.SECONDARY_LIGHT};
    --color-secondary-dark: ${COLORS.SECONDARY_DARK};
    --color-success: ${COLORS.SUCCESS};
    --color-warning: ${COLORS.WARNING};
    --color-error: ${COLORS.ERROR};
    --color-info: ${COLORS.INFO};
    --color-background: ${COLORS.BACKGROUND};
    --color-text-primary: ${COLORS.TEXT_PRIMARY};
    --color-text-secondary: ${COLORS.TEXT_SECONDARY};
    --color-border: ${COLORS.BORDER_PRIMARY};
  }
`;
