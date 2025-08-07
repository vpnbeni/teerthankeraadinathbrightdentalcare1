import toast from "react-hot-toast";

// Toast utility using react-hot-toast
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: "top-right",
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: "top-right",
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      icon: "⚠️",
      duration: 4000,
      position: "top-right",
      style: {
        background: "#FEF3C7",
        color: "#92400E",
        border: "1px solid #F59E0B",
      },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      icon: "ℹ️",
      duration: 4000,
      position: "top-right",
      style: {
        background: "#DBEAFE",
        color: "#1E40AF",
        border: "1px solid #3B82F6",
      },
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: "top-right",
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || "Loading...",
        success: messages.success || "Success!",
        error: messages.error || "Something went wrong",
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

  remove: (toastId) => {
    toast.remove(toastId);
  },
};

// Default export for convenience
export default showToast;
