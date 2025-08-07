/**
 * Accessibility Testing Component
 * Provides in-app accessibility testing and reporting
 */

import React, { useState, useEffect } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { runAccessibilityTests } from "../utils/accessibility-testing";
import { AccessibleModal, AccessibleButton, IconButton } from "./";

const AccessibilityTester = ({
  enabled = process.env.NODE_ENV === "development",
  position = "bottom-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  // Run accessibility tests
  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runAccessibilityTests();
      setTestResults(results);
    } catch (error) {
      console.error("Accessibility test failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run tests when component mounts
  useEffect(() => {
    if (enabled) {
      runTests();
    }
  }, [enabled]);

  // Don't render in production unless explicitly enabled
  if (!enabled) return null;

  // Render issue details modal
  const renderIssueModal = () => (
    <AccessibleModal
      isOpen={!!selectedIssue}
      onClose={() => setSelectedIssue(null)}
      title="Accessibility Issue Details"
      size="lg"
    >
      {selectedIssue && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {selectedIssue.message}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Rule: {selectedIssue.rule}
            </p>
          </div>

          {selectedIssue.element && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Element</h4>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                {selectedIssue.element.outerHTML?.substring(0, 200)}
                {selectedIssue.element.outerHTML?.length > 200 && "..."}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900 mb-2">How to Fix</h4>
            <div className="text-sm text-gray-700">
              {getFixSuggestion(selectedIssue)}
            </div>
          </div>
        </div>
      )}
    </AccessibleModal>
  );

  // Get fix suggestion for issue
  const getFixSuggestion = (issue) => {
    const suggestions = {
      Image:
        'Add descriptive alt text to images. Use alt="" for decorative images.',
      Heading:
        "Ensure proper heading hierarchy (h1 → h2 → h3). Don't skip heading levels.",
      Link: 'Provide descriptive link text. Avoid generic text like "click here".',
      Button:
        "Ensure buttons have accessible names using text content or aria-label.",
      Form: "Associate labels with form controls using for/id or aria-labelledby.",
      Focus: "Ensure all interactive elements are keyboard accessible.",
      Color:
        "Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text).",
      Landmark:
        "Use semantic HTML elements (main, nav, aside) or ARIA landmarks.",
    };

    const category = Object.keys(suggestions).find((key) =>
      issue.message.toLowerCase().includes(key.toLowerCase())
    );

    return (
      suggestions[category] || "Review WCAG guidelines for this issue type."
    );
  };

  // Render test results
  const renderResults = () => {
    if (!testResults) return null;

    const { audit, summary } = testResults;
    const allIssues = [...audit.errors, ...audit.warnings, ...audit.info];

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Test Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Score:</span>
              <span
                className={`ml-2 font-medium ${
                  summary.score >= 90
                    ? "text-green-600"
                    : summary.score >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {summary.score}/100
              </span>
            </div>
            <div>
              <span className="text-gray-600">Issues:</span>
              <span className="ml-2 font-medium">
                {summary.totalErrors + summary.totalWarnings}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Focusable:</span>
              <span className="ml-2 font-medium">
                {summary.focusableElements}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Landmarks:</span>
              <span className="ml-2 font-medium">{summary.landmarks}</span>
            </div>
          </div>
        </div>

        {/* Issues */}
        {allIssues.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Issues Found</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {issue.type === "error" && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    )}
                    {issue.type === "warning" && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                    )}
                    {issue.type === "info" && (
                      <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {issue.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{issue.rule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allIssues.length === 0 && (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">No accessibility issues found!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating button */}
      <div className={`fixed ${positionClasses[position]} z-40`}>
        <div className="flex flex-col items-end space-y-2">
          {/* Test results indicator */}
          {testResults && (
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                testResults.summary.score >= 90
                  ? "bg-green-100 text-green-800"
                  : testResults.summary.score >= 70
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {testResults.summary.score}/100
            </div>
          )}

          {/* Main button */}
          <IconButton
            icon={<EyeIcon />}
            onClick={() => setIsOpen(true)}
            ariaLabel="Open accessibility tester"
            variant="primary"
            size="lg"
            className="shadow-lg"
          />
        </div>
      </div>

      {/* Test panel modal */}
      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility Tester"
        size="lg"
      >
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Test your page for accessibility issues
            </div>
            <AccessibleButton onClick={runTests} loading={isRunning} size="sm">
              {isRunning ? "Running Tests..." : "Run Tests"}
            </AccessibleButton>
          </div>

          {/* Results */}
          {renderResults()}
        </div>
      </AccessibleModal>

      {/* Issue details modal */}
      {renderIssueModal()}
    </>
  );
};

// Accessibility settings panel
export const AccessibilitySettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    reducedMotion: false,
    fontSize: "normal",
    focusVisible: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.warn("Failed to load accessibility settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("accessibility-settings", JSON.stringify(newSettings));

    // Apply settings to document
    applySettings(newSettings);
  };

  // Apply settings to document
  const applySettings = (settings) => {
    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduced motion
    if (settings.reducedMotion) {
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
    root.classList.add(`font-${settings.fontSize}`);

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Settings"
      size="md"
    >
      <div className="space-y-6">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              High Contrast Mode
            </label>
            <p className="text-xs text-gray-600">
              Increases contrast for better visibility
            </p>
          </div>
          <button
            onClick={() =>
              updateSetting("highContrast", !settings.highContrast)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.highContrast ? "bg-primary" : "bg-gray-200"
            }`}
            aria-pressed={settings.highContrast}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.highContrast ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Reduced Motion
            </label>
            <p className="text-xs text-gray-600">
              Minimizes animations and transitions
            </p>
          </div>
          <button
            onClick={() =>
              updateSetting("reducedMotion", !settings.reducedMotion)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.reducedMotion ? "bg-primary" : "bg-gray-200"
            }`}
            aria-pressed={settings.reducedMotion}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.reducedMotion ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            Font Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["small", "normal", "large", "xlarge"].map((size) => (
              <button
                key={size}
                onClick={() => updateSetting("fontSize", size)}
                className={`px-3 py-2 text-xs rounded-md border ${
                  settings.fontSize === size
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {size === "xlarge"
                  ? "XL"
                  : size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Visible */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Enhanced Focus Indicators
            </label>
            <p className="text-xs text-gray-600">
              Shows focus outlines for keyboard navigation
            </p>
          </div>
          <button
            onClick={() =>
              updateSetting("focusVisible", !settings.focusVisible)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.focusVisible ? "bg-primary" : "bg-gray-200"
            }`}
            aria-pressed={settings.focusVisible}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.focusVisible ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default AccessibilityTester;
