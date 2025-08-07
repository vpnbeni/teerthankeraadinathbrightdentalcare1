import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

// Custom toast component with enhanced styling
const CustomToast = ({ type, message, onDismiss }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColors = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800",
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[type]} shadow-lg max-w-md`}
    >
      {icons[type]}
      <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>
        {message}
      </p>
      <button
        onClick={onDismiss}
        className={`${textColors[type]} hover:opacity-70 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Enhanced toast functions with better UX
export const showToast = {
  success: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <CustomToast
          type="success"
          message={message}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        position: "top-right",
        ...options,
      }
    );
  },

  error: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <CustomToast
          type="error"
          message={message}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 6000,
        position: "top-right",
        ...options,
      }
    );
  },

  warning: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <CustomToast
          type="warning"
          message={message}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000,
        position: "top-right",
        ...options,
      }
    );
  },

  info: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <CustomToast
          type="info"
          message={message}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        position: "top-right",
        ...options,
      }
    );
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || "Loading...",
        success: messages.success || "Success!",
        error: messages.error || "Something went wrong!",
      },
      {
        position: "top-right",
        ...options,
      }
    );
  },

  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

// Toast container component
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: "",
        duration: 4000,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      }}
    />
  );
};

// Hook for toast notifications with common patterns
export const useToast = () => {
  const showSuccess = React.useCallback((message, options) => {
    return showToast.success(message, options);
  }, []);

  const showError = React.useCallback((message, options) => {
    return showToast.error(message, options);
  }, []);

  const showWarning = React.useCallback((message, options) => {
    return showToast.warning(message, options);
  }, []);

  const showInfo = React.useCallback((message, options) => {
    return showToast.info(message, options);
  }, []);

  const showPromise = React.useCallback((promise, messages, options) => {
    return showToast.promise(promise, messages, options);
  }, []);

  const dismiss = React.useCallback((toastId) => {
    showToast.dismiss(toastId);
  }, []);

  const dismissAll = React.useCallback(() => {
    showToast.dismissAll();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPromise,
    dismiss,
    dismissAll,
  };
};

export default showToast;
