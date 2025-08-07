/**
 * Keyboard Shortcuts Component
 * Provides keyboard shortcuts for common admin actions
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccessibility } from "../hooks";
import { AccessibleModal } from "./";
import { keyboardNavigation } from "../utils/accessibility";

const KeyboardShortcuts = ({ enabled = true }) => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { announce } = useAccessibility();

  // Define keyboard shortcuts
  const shortcuts = {
    // Navigation shortcuts
    "ctrl+1": {
      action: () => navigate("/dashboard"),
      description: "Go to Dashboard",
    },
    "ctrl+2": { action: () => navigate("/users"), description: "Go to Users" },
    "ctrl+3": {
      action: () => navigate("/appointments"),
      description: "Go to Appointments",
    },
    "ctrl+5": {
      action: () => navigate("/analytics"),
      description: "Go to Analytics",
    },
    "ctrl+6": {
      action: () => navigate("/settings"),
      description: "Go to Settings",
    },

    // Search shortcuts
    "ctrl+k": {
      action: () => {
        const searchInput = document.querySelector(
          'input[type="text"], input[aria-label="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          announce("Search focused");
        }
      },
      description: "Focus search",
    },

    // Modal shortcuts
    escape: {
      action: () => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector(
            '[aria-label*="Close"], [aria-label*="close"]'
          );
          if (closeButton) {
            closeButton.click();
          }
        }
      },
      description: "Close modal/dialog",
    },

    // Help shortcut
    "ctrl+/": {
      action: () => setShowHelp(true),
      description: "Show keyboard shortcuts help",
    },

    // Accessibility shortcuts
    "alt+1": {
      action: () => {
        const mainContent = document.querySelector("#main-content, main");
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth" });
          announce("Jumped to main content");
        }
      },
      description: "Jump to main content",
    },

    "alt+2": {
      action: () => {
        const sidebar = document.querySelector(
          '#sidebar, nav[aria-label*="navigation"]'
        );
        if (sidebar) {
          const firstLink = sidebar.querySelector("a, button");
          if (firstLink) {
            firstLink.focus();
            announce("Jumped to navigation");
          }
        }
      },
      description: "Jump to navigation",
    },

    // Quick actions (context-dependent)
    "ctrl+n": {
      action: () => {
        if (location.pathname.includes("/users")) {
          // Trigger new user action
          const newUserButton = document.querySelector(
            '[aria-label*="Add"], [aria-label*="New"], [aria-label*="Create"]'
          );
          if (newUserButton) {
            newUserButton.click();
            announce("New user dialog opened");
          }
        } else if (location.pathname.includes("/appointments")) {
          // Trigger new appointment action
          const newAppointmentButton = document.querySelector(
            '[aria-label*="Add"], [aria-label*="New"], [aria-label*="Create"]'
          );
          if (newAppointmentButton) {
            newAppointmentButton.click();
            announce("New appointment dialog opened");
          }
        }
      },
      description: "Create new item (context-dependent)",
    },

    // Table navigation
    "ctrl+up": {
      action: () => {
        const table = document.querySelector("table");
        if (table) {
          const firstRow = table.querySelector("tbody tr");
          if (firstRow) {
            firstRow.focus();
            announce("Jumped to first table row");
          }
        }
      },
      description: "Jump to first table row",
    },

    "ctrl+down": {
      action: () => {
        const table = document.querySelector("table");
        if (table) {
          const rows = table.querySelectorAll("tbody tr");
          const lastRow = rows[rows.length - 1];
          if (lastRow) {
            lastRow.focus();
            announce("Jumped to last table row");
          }
        }
      },
      description: "Jump to last table row",
    },
  };

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Build shortcut key combination
      const keys = [];
      if (event.ctrlKey) keys.push("ctrl");
      if (event.altKey) keys.push("alt");
      if (event.shiftKey) keys.push("shift");
      if (event.metaKey) keys.push("meta");

      // Add the main key
      const key = event.key.toLowerCase();
      if (
        key !== "control" &&
        key !== "alt" &&
        key !== "shift" &&
        key !== "meta"
      ) {
        keys.push(key);
      }

      const shortcut = keys.join("+");

      // Execute shortcut if it exists
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut].action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, navigate, location.pathname, announce]);

  // Group shortcuts by category
  const groupedShortcuts = {
    Navigation: [
      { key: "Ctrl + 1", description: "Go to Dashboard" },
      { key: "Ctrl + 2", description: "Go to Users" },
      { key: "Ctrl + 3", description: "Go to Appointments" },
      { key: "Ctrl + 5", description: "Go to Analytics" },
      { key: "Ctrl + 6", description: "Go to Settings" },
    ],
    "Search & Actions": [
      { key: "Ctrl + K", description: "Focus search" },
      { key: "Ctrl + N", description: "Create new item" },
      { key: "Escape", description: "Close modal/dialog" },
    ],
    Accessibility: [
      { key: "Alt + 1", description: "Jump to main content" },
      { key: "Alt + 2", description: "Jump to navigation" },
      { key: "Tab", description: "Navigate between elements" },
      { key: "Shift + Tab", description: "Navigate backwards" },
    ],
    "Table Navigation": [
      { key: "Ctrl + ↑", description: "Jump to first row" },
      { key: "Ctrl + ↓", description: "Jump to last row" },
      { key: "Arrow Keys", description: "Navigate table cells" },
    ],
    Help: [{ key: "Ctrl + /", description: "Show this help" }],
  };

  const renderShortcutsHelp = () => (
    <AccessibleModal
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          Use these keyboard shortcuts to navigate and interact with the admin
          panel more efficiently.
        </p>

        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Note: Some shortcuts may be context-dependent and only work on
            specific pages.
          </p>
        </div>
      </div>
    </AccessibleModal>
  );

  return (
    <>
      {/* Help Modal */}
      {renderShortcutsHelp()}

      {/* Keyboard shortcut indicator (optional) */}
      {enabled && (
        <div
          className="sr-only"
          aria-live="polite"
          id="keyboard-shortcuts-status"
        >
          Keyboard shortcuts are enabled. Press Ctrl+/ for help.
        </div>
      )}
    </>
  );
};

// Hook for using keyboard shortcuts in components
export const useKeyboardShortcuts = (shortcuts = {}) => {
  const { announce } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keys = [];
      if (event.ctrlKey) keys.push("ctrl");
      if (event.altKey) keys.push("alt");
      if (event.shiftKey) keys.push("shift");
      if (event.metaKey) keys.push("meta");

      const key = event.key.toLowerCase();
      if (
        key !== "control" &&
        key !== "alt" &&
        key !== "shift" &&
        key !== "meta"
      ) {
        keys.push(key);
      }

      const shortcut = keys.join("+");

      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

export default KeyboardShortcuts;
