/**
 * Accessible Modal Component
 * Provides WCAG-compliant modal dialog with focus management and keyboard navigation
 */

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAccessibility, useFocusManagement } from "../hooks";
import {
  focusManagement,
  keyboardNavigation,
  animationAccessibility,
} from "../utils/accessibility";

const AccessibleModal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  overlayClassName = "",
  contentClassName = "",
  initialFocus,
  finalFocus,
  ariaLabel,
  ariaDescribedBy,
  role = "dialog",
  ...props
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const { announce, reducedMotion } = useAccessibility();
  const { saveFocus, restoreFocus } = useFocusManagement();

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Handle modal opening
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Announce modal opening
      announce(`${title || "Dialog"} opened`);

      // Set up focus trap
      const cleanup = focusManagement.trapFocus(modalRef.current);

      // Focus initial element
      setTimeout(() => {
        if (initialFocus && initialFocus.current) {
          initialFocus.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else {
          const firstFocusable = focusManagement.getFocusableElements(
            modalRef.current
          )[0];
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);

      return () => {
        cleanup();
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, title, initialFocus, announce]);

  // Handle modal closing
  const handleClose = useCallback(() => {
    if (!onClose) return;

    // Announce modal closing
    announce(`${title || "Dialog"} closed`);

    // Close modal
    onClose();

    // Restore focus
    setTimeout(() => {
      if (finalFocus && finalFocus.current) {
        finalFocus.current.focus();
      } else if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }, 100);
  }, [onClose, title, finalFocus, announce]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === keyboardNavigation.keys.ESCAPE) {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event) => {
      if (closeOnBackdrop && event.target === overlayRef.current) {
        handleClose();
      }
    },
    [closeOnBackdrop, handleClose]
  );

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      onClick={handleBackdropClick}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}
          transform transition-all duration-300 ease-out
          ${reducedMotion ? "" : "animate-modal-enter"}
          ${contentClassName}
        `}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2
                className="text-lg font-semibold text-gray-900"
                id="modal-title"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md p-1"
                aria-label="Close dialog"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`p-6 ${className}`}>{children}</div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Specialized modal components
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  ...props
}) => {
  const confirmButtonRef = useRef(null);

  const variantClasses = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocus={confirmButtonRef}
      ariaDescribedBy="confirmation-message"
      {...props}
    >
      <div className="space-y-4">
        {message && (
          <p id="confirmation-message" className="text-gray-700">
            {message}
          </p>
        )}

        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};

export const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  submitDisabled = false,
  ...props
}) => {
  const submitButtonRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(event);
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialFocus={submitButtonRef}
      {...props}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">{children}</div>

        <div className="flex space-x-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={submitButtonRef}
            type="submit"
            disabled={loading || submitDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Saving..." : submitText}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
};

export const InfoModal = ({
  isOpen,
  onClose,
  title,
  children,
  closeText = "Close",
  ...props
}) => {
  const closeButtonRef = useRef(null);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialFocus={closeButtonRef}
      role="alertdialog"
      {...props}
    >
      <div className="space-y-4">
        <div className="text-gray-700">{children}</div>

        <div className="flex justify-end">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
          >
            {closeText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};

// Add modal animation styles to CSS
const modalStyles = `
  @keyframes modal-enter {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .animate-modal-enter {
    animation: modal-enter 0.3s ease-out;
  }
  
  .reduce-motion .animate-modal-enter {
    animation: none;
  }
`;

// Inject styles if not already present
if (
  typeof document !== "undefined" &&
  !document.getElementById("modal-styles")
) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "modal-styles";
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}

export default AccessibleModal;
