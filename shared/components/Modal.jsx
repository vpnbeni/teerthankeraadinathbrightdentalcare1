import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  useAccessibility,
  useFocusManagement,
} from "../hooks/useAccessibility";
import { focusManagement, keyboardNavigation } from "../utils/accessibility";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  overlayClassName = "",
  contentClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  footer,
  initialFocus,
  ...props
}) => {
  const { reducedMotion, announce } = useAccessibility();
  const { saveFocus, restoreFocus } = useFocusManagement();

  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Size configurations
  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-lg",
    large: "max-w-2xl",
    xlarge: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const cleanup = keyboardNavigation.handleEscape(onClose);
    return cleanup;
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    previousFocusRef.current = document.activeElement;

    // Set up focus trap
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const cleanup = focusManagement.trapFocus(modalElement);

    // Focus initial element
    setTimeout(() => {
      if (initialFocus && initialFocus.current) {
        initialFocus.current.focus();
      } else if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 100);

    // Announce modal opening
    announce(`${title || "Modal"} dialog opened`);

    return () => {
      cleanup();
      // Restore focus when modal closes
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, title, initialFocus, announce]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle close button click
  const handleClose = () => {
    announce(`${title || "Modal"} dialog closed`);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black bg-opacity-50 backdrop-blur-sm
        ${reducedMotion ? "" : "animate-fade-in"}
        ${overlayClassName}
      `}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby="modal-content"
    >
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} max-h-[90vh]
          bg-white rounded-lg shadow-xl
          flex flex-col
          ${reducedMotion ? "" : "animate-bounce-in"}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={`
            flex items-center justify-between p-6 border-b border-gray-200
            ${headerClassName}
          `}
          >
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="
                  p-2 text-gray-400 hover:text-gray-600 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  transition-colors duration-200
                "
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          id="modal-content"
          className={`
            flex-1 overflow-y-auto p-6
            ${bodyClassName}
          `}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`
            flex items-center justify-end gap-3 p-6 border-t border-gray-200
            ${footerClassName}
          `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Confirmation modal component
export const ConfirmModal = ({
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

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500/20",
    primary: "bg-primary hover:bg-primary-dark focus:ring-primary/20",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500/20",
  };

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={loading}
        className="
          px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
          rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        "
      >
        {cancelText}
      </button>
      <button
        ref={confirmButtonRef}
        onClick={handleConfirm}
        disabled={loading}
        className={`
          px-4 py-2 text-sm font-medium text-white rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${variantStyles[variant]}
        `}
      >
        {loading ? "Processing..." : confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      initialFocus={confirmButtonRef}
      {...props}
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
};

// Alert modal component
export const AlertModal = ({
  isOpen,
  onClose,
  title = "Alert",
  message,
  variant = "info",
  buttonText = "OK",
  ...props
}) => {
  const buttonRef = useRef(null);

  const variantIcons = {
    info: "💡",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const variantColors = {
    info: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  const footer = (
    <button
      ref={buttonRef}
      onClick={onClose}
      className="
        px-4 py-2 text-sm font-medium text-white bg-primary
        rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2
        focus:ring-primary/20 focus:ring-offset-2
        transition-colors duration-200
      "
    >
      {buttonText}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      initialFocus={buttonRef}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {variantIcons[variant]}
        </span>
        <p className={`text-gray-600 ${variantColors[variant]}`}>{message}</p>
      </div>
    </Modal>
  );
};

// Loading modal component
export const LoadingModal = ({
  isOpen,
  title = "Loading...",
  message = "Please wait while we process your request.",
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing during loading
      title={title}
      size="small"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-gray-600 text-center">{message}</p>
      </div>
    </Modal>
  );
};

export default Modal;
