import React, { useEffect } from "react";

const Modal = ({ isOpen, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md max-h-[60vh] md:max-w-md md:max-h-[60vh]",
    md: "max-w-lg max-h-[70vh] md:max-w-lg md:max-h-[70vh]",
    lg: "max-w-2xl max-h-[75vh] md:max-w-2xl md:max-h-[75vh]",
    xl: "max-w-4xl max-h-[80vh] md:max-w-4xl md:max-h-[80vh]",
    booking: "w-full h-full md:w-[75vw] md:h-[80vh]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
      {/* Background overlay with glassmorphism */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={`relative ${sizeClasses[size]} bg-white/95 backdrop-blur-xl border-0 md:border md:border-gray-200/50 rounded-none md:rounded-3xl shadow-2xl transform transition-all overflow-hidden`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-lg md:rounded-xl text-gray-400 hover:text-gray-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal content with scroll */}
        <div className="h-full overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
