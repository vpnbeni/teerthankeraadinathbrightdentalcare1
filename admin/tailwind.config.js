/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#346870",
          600: "#346870",
          700: "#2a5359",
          800: "#1e3a40",
          900: "#164e56",
          DEFAULT: "#346870",
          dark: "#2a5359",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#BDCFD1",
          600: "#a8bfc2",
          700: "#8fa8ab",
          800: "#6b8285",
          900: "#475569",
          DEFAULT: "#BDCFD1",
          dark: "#a8bfc2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      minHeight: {
        touch: "44px",
        "touch-large": "48px",
      },
      minWidth: {
        touch: "44px",
        "touch-large": "48px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-in-out",
        "bounce-in": "bounceIn 0.5s ease-in-out",
        "wave-pulse": "wavePulse 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        wavePulse: {
          "0%": { 
            transform: "scale(0.8)", 
            opacity: "0.8" 
          },
          "50%": { 
            transform: "scale(1.2)", 
            opacity: "0.3" 
          },
          "100%": { 
            transform: "scale(1.6)", 
            opacity: "0" 
          },
        },
      },
      screens: {
        xs: "475px",
        touch: { raw: "(pointer: coarse)" },
        "no-touch": { raw: "(pointer: fine)" },
        "reduce-motion": { raw: "(prefers-reduced-motion: reduce)" },
        "high-contrast": { raw: "(prefers-contrast: high)" },
      },
    },
  },
  plugins: [
    // Custom plugin for accessibility utilities
    function ({ addUtilities, theme }) {
      const newUtilities = {
        ".sr-only": {
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: "0",
        },
        ".not-sr-only": {
          position: "static",
          width: "auto",
          height: "auto",
          padding: "0",
          margin: "0",
          overflow: "visible",
          clip: "auto",
          whiteSpace: "normal",
        },
        ".focus-visible": {
          "&:focus": {
            outline: `2px solid ${theme("colors.primary.DEFAULT")}`,
            outlineOffset: "2px",
          },
        },
        ".skip-link": {
          position: "absolute",
          left: "-9999px",
          zIndex: "9999",
          padding: "8px 16px",
          backgroundColor: theme("colors.primary.DEFAULT"),
          color: "white",
          textDecoration: "none",
          borderRadius: "4px",
          "&:focus": {
            left: "6px",
            top: "6px",
          },
        },
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(209 213 219) transparent",
        },
        ".scrollbar-thin::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        ".scrollbar-thin::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb": {
          backgroundColor: "rgb(209 213 219)",
          borderRadius: "3px",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgb(156 163 175)",
        },
        ".scrollbar-thumb-gray-300::-webkit-scrollbar-thumb": {
          backgroundColor: "rgb(209 213 219)",
        },
        ".scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgb(156 163 175)",
        },
        ".scrollbar-track-transparent::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
