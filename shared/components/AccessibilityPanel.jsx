import React, { useState } from "react";
import { Settings, Eye, Type, Zap, Keyboard, Volume2, X } from "lucide-react";
import { useAccessibility } from "../hooks/useAccessibility";
import Button from "./Button";
import Modal from "./Modal";

const AccessibilityPanel = ({ isOpen, onClose, position = "bottom-right" }) => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    keyboardNavigation,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    announce,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState("visual");

  const tabs = [
    { id: "visual", label: "Visual", icon: Eye },
    { id: "navigation", label: "Navigation", icon: Keyboard },
    { id: "audio", label: "Audio", icon: Volume2 },
  ];

  const fontSizes = [
    { value: "small", label: "Small", description: "14px" },
    { value: "normal", label: "Normal", description: "16px" },
    { value: "large", label: "Large", description: "18px" },
    { value: "xlarge", label: "Extra Large", description: "20px" },
  ];

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    announce(`Font size changed to ${size}`);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announce(`High contrast mode ${!highContrast ? "enabled" : "disabled"}`);
  };

  const handleReducedMotionToggle = () => {
    toggleReducedMotion();
    announce(`Reduced motion ${!reducedMotion ? "enabled" : "disabled"}`);
  };

  const resetSettings = () => {
    // Reset to defaults
    if (highContrast) toggleHighContrast();
    if (reducedMotion) toggleReducedMotion();
    if (fontSize !== "normal") setFontSize("normal");

    announce("Accessibility settings reset to defaults");
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? "bg-primary" : "bg-gray-200"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );

  const FontSizeSelector = () => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Font Size</h4>
      <div className="grid grid-cols-2 gap-2">
        {fontSizes.map((size) => (
          <button
            key={size.value}
            onClick={() => handleFontSizeChange(size.value)}
            className={`
              p-3 text-left rounded-lg border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/20
              ${
                fontSize === size.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }
            `}
            aria-pressed={fontSize === size.value}
          >
            <div className="font-medium text-sm">{size.label}</div>
            <div className="text-xs text-gray-500">{size.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const VisualTab = () => (
    <div className="space-y-6">
      <ToggleSwitch
        checked={highContrast}
        onChange={handleHighContrastToggle}
        label="High Contrast"
        description="Increase color contrast for better visibility"
      />

      <ToggleSwitch
        checked={reducedMotion}
        onChange={handleReducedMotionToggle}
        label="Reduce Motion"
        description="Minimize animations and transitions"
      />

      <FontSizeSelector />
    </div>
  );

  const NavigationTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Keyboard Navigation
          </span>
        </div>
        <p className="text-xs text-blue-700">
          {keyboardNavigation
            ? "Keyboard navigation is active. Use Tab to navigate and Enter/Space to activate."
            : "Press Tab to activate keyboard navigation mode."}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Navigate forward:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span>Navigate backward:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">Shift + Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span>Activate element:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span>Close modal/menu:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">Escape</kbd>
          </div>
        </div>
      </div>
    </div>
  );

  const AudioTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            Screen Reader Support
          </span>
        </div>
        <p className="text-xs text-green-700">
          This application is optimized for screen readers with proper ARIA
          labels and announcements.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Audio Feedback</h4>
        <p className="text-xs text-gray-600">
          Important actions and state changes are announced to screen readers
          automatically.
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "visual":
        return <VisualTab />;
      case "navigation":
        return <NavigationTab />;
      case "audio":
        return <AudioTab />;
      default:
        return <VisualTab />;
    }
  };

  const footer = (
    <div className="flex justify-between">
      <Button variant="ghost" size="small" onClick={resetSettings}>
        Reset to Defaults
      </Button>
      <Button variant="primary" size="small" onClick={onClose}>
        Done
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Settings"
      size="medium"
      footer={footer}
      className="accessibility-panel"
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium
                  border-b-2 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }
                `}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className="flex-1"
        >
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
};

// Floating accessibility button
export const AccessibilityButton = ({ className = "" }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className={`
          fixed bottom-4 right-4 z-40
          p-3 bg-primary text-white rounded-full shadow-lg
          hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
          transition-all duration-200 ease-in-out
          ${className}
        `}
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
};

export default AccessibilityPanel;
