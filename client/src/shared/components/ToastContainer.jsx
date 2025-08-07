import React from "react";
import { Toaster } from "react-hot-toast";
import { useAccessibility } from "../hooks";

const ToastContainer = () => {
  const { reducedMotion, highContrast } = useAccessibility();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: highContrast ? "#000" : "#fff",
          color: highContrast ? "#fff" : "#363636",
          border: highContrast ? "2px solid #fff" : "1px solid #e5e7eb",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: highContrast
            ? "0 4px 6px -1px rgba(255, 255, 255, 0.1)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          maxWidth: "400px",
          animation: reducedMotion ? "none" : undefined,
        },

        // Success toast styling
        success: {
          iconTheme: {
            primary: highContrast ? "#00ff00" : "#10b981",
            secondary: highContrast ? "#000" : "#fff",
          },
          style: {
            background: highContrast ? "#000" : "#f0fdf4",
            color: highContrast ? "#00ff00" : "#166534",
            border: highContrast ? "2px solid #00ff00" : "1px solid #bbf7d0",
          },
        },

        // Error toast styling
        error: {
          iconTheme: {
            primary: highContrast ? "#ff0000" : "#ef4444",
            secondary: highContrast ? "#000" : "#fff",
          },
          style: {
            background: highContrast ? "#000" : "#fef2f2",
            color: highContrast ? "#ff0000" : "#dc2626",
            border: highContrast ? "2px solid #ff0000" : "1px solid #fecaca",
          },
        },

        // Loading toast styling
        loading: {
          iconTheme: {
            primary: highContrast ? "#ffff00" : "#3b82f6",
            secondary: highContrast ? "#000" : "#fff",
          },
          style: {
            background: highContrast ? "#000" : "#eff6ff",
            color: highContrast ? "#ffff00" : "#1d4ed8",
            border: highContrast ? "2px solid #ffff00" : "1px solid #bfdbfe",
          },
        },
      }}
    />
  );
};

export default ToastContainer;
