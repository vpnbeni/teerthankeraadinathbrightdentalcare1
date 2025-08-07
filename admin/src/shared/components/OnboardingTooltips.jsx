/**
 * Onboarding Tooltips Component
 * Provides guided tour and feature introductions
 */

import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAccessibility } from "../hooks";
import { AccessibleButton } from "./";

const OnboardingTooltips = ({
  steps = [],
  isActive = false,
  onComplete,
  onSkip,
  storageKey = "admin-onboarding-completed",
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);

  const { announce } = useAccessibility();

  // Check if onboarding was already completed
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed && isActive && steps.length > 0) {
      setIsVisible(true);
      announce("Onboarding tour started");
    }
  }, [isActive, steps.length, storageKey, announce]);

  // Position tooltip relative to target element
  useEffect(() => {
    if (!isVisible || !steps[currentStep]) return;

    const targetSelector = steps[currentStep].target;
    const targetElement = document.querySelector(targetSelector);

    if (targetElement && tooltipRef.current) {
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = targetRect.bottom + 10;
      let left = targetRect.left;

      // Adjust position if tooltip would go off-screen
      if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width - 20;
      }

      if (top + tooltipRect.height > viewportHeight) {
        top = targetRect.top - tooltipRect.height - 10;
      }

      // Ensure tooltip stays within viewport
      top = Math.max(
        10,
        Math.min(top, viewportHeight - tooltipRect.height - 10)
      );
      left = Math.max(
        10,
        Math.min(left, viewportWidth - tooltipRect.width - 10)
      );

      setTooltipPosition({ top, left });

      // Highlight target element
      targetElement.classList.add("onboarding-highlight");
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

      return () => {
        targetElement.classList.remove("onboarding-highlight");
      };
    }
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      announce(
        `Step ${currentStep + 2} of ${steps.length}: ${
          steps[currentStep + 1].title
        }`
      );
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      announce(
        `Step ${currentStep} of ${steps.length}: ${
          steps[currentStep - 1].title
        }`
      );
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    announce("Onboarding tour completed");
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    announce("Onboarding tour skipped");
    if (onSkip) {
      onSkip();
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    announce(`Jumped to step ${stepIndex + 1}: ${steps[stepIndex].title}`);
  };

  if (!isVisible || !steps[currentStep]) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        style={{ pointerEvents: "none" }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          pointerEvents: "auto",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-[#346870] bg-[#346870]/10 px-2 py-1 rounded">
              {currentStep + 1} of {steps.length}
            </span>
            <h3 id="onboarding-title" className="font-semibold text-gray-900">
              {step.title}
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 admin-focus mobile-tap-target"
            aria-label="Skip onboarding tour"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p id="onboarding-content" className="text-gray-700 text-sm mb-4">
            {step.content}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-2 h-2 rounded-full transition-colors admin-focus ${
                  index === currentStep
                    ? "bg-[#346870]"
                    : index < currentStep
                    ? "bg-[#346870]/50"
                    : "bg-gray-300"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <AccessibleButton variant="ghost" onClick={handleSkip} size="sm">
              Skip Tour
            </AccessibleButton>

            <div className="flex space-x-2">
              {currentStep > 0 && (
                <AccessibleButton
                  variant="secondary"
                  onClick={handlePrevious}
                  leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                  size="sm"
                >
                  Previous
                </AccessibleButton>
              )}

              <AccessibleButton
                variant="primary"
                onClick={handleNext}
                rightIcon={
                  currentStep < steps.length - 1 ? (
                    <ChevronRightIcon className="h-4 w-4" />
                  ) : null
                }
                size="sm"
              >
                {currentStep < steps.length - 1 ? "Next" : "Finish"}
              </AccessibleButton>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for highlighting */}
      <style jsx>{`
        .onboarding-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(52, 104, 112, 0.3);
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};

// Predefined onboarding tours
export const AdminOnboardingTour = ({ isActive, onComplete, onSkip }) => {
  const steps = [
    {
      target: "#sidebar",
      title: "Navigation Menu",
      content:
        "Use this sidebar to navigate between different sections of the admin panel. You can also use keyboard shortcuts like Ctrl+1 for Dashboard.",
    },
    {
      target: '[aria-label="Search"]',
      title: "Search Functionality",
      content:
        "Quickly find users, appointments, or any data using the search bar. Press Ctrl+K to focus the search from anywhere.",
    },
    {
      target: '[href="/users"]',
      title: "User Management",
      content:
        "Manage all your patients and users from here. You can view detailed profiles, edit information, and manage subscriptions.",
    },
    {
      target: '[href="/appointments"]',
      title: "Appointment Management",
      content:
        "View, schedule, and manage all appointments. You can also cancel appointments and send notifications to patients.",
    },
    {
      target: '[href="/analytics"]',
      title: "Analytics Dashboard",
      content:
        "Monitor your practice performance with detailed analytics on appointments, revenue, and patient growth.",
    },
    {
      target: '[href="/settings"]',
      title: "System Settings",
      content:
        "Configure email templates, business rules, and other system settings to customize your admin panel.",
    },
  ];

  return (
    <OnboardingTooltips
      steps={steps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      storageKey="admin-main-onboarding"
    />
  );
};

export const UserManagementTour = ({ isActive, onComplete, onSkip }) => {
  const steps = [
    {
      target: ".user-search",
      title: "Search Users",
      content:
        "Search for users by name, email, or phone number. Use filters to narrow down results.",
    },
    {
      target: ".user-table",
      title: "User List",
      content:
        "View all users in this table. Click on any user to see detailed information and manage their account.",
    },
    {
      target: '[aria-label*="Add"], [aria-label*="New"]',
      title: "Add New User",
      content:
        "Create new user accounts manually if needed. You can also import users from CSV files.",
    },
  ];

  return (
    <OnboardingTooltips
      steps={steps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      storageKey="admin-user-management-onboarding"
    />
  );
};

export default OnboardingTooltips;
