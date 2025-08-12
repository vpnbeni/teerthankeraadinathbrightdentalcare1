import axios from "axios";
import { showToast } from "../shared/utils/toast";
import {
  adminErrorHandler,
  handleApiError,
  withErrorHandling,
} from "../shared/utils/error-handlers";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for admin operations
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Enhanced retry logic with exponential backoff
const retryRequest = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    const shouldRetry =
      retryCount < MAX_RETRIES &&
      (RETRY_STATUS_CODES.includes(error.response?.status) ||
        error.code === "NETWORK_ERROR" ||
        error.code === "ECONNABORTED");

    if (shouldRetry) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      // console.log(
      //   `Retrying request (attempt ${
      //     retryCount + 1
      //   }/${MAX_RETRIES}) after ${delay}ms`
      // );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }

    throw error;
  }
};

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request metadata for debugging and monitoring
    config.metadata = {
      startTime: new Date(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      // console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
      //   method: config.method?.toUpperCase(),
      //   url: config.url,
      //   data: config.data,
      //   params: config.params,
      // });
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => {
    // Log response time and details in development
    if (process.env.NODE_ENV === "development" && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      // console.log(`✅ API Response [${response.config.metadata.requestId}]:`, {
      //   status: response.status,
      //   duration: `${duration}ms`,
      //   data: response.data,
      // });
    }

    return response;
  },
  async (error) => {
    const { response, config } = error;

    // Log error details
    if (process.env.NODE_ENV === "development") {
      console.error(`❌ API Error [${config?.metadata?.requestId}]:`, {
        status: response?.status,
        message: response?.data?.message,
        url: config?.url,
        method: config?.method,
      });
    }

    // Handle authentication errors
    if (response?.status === 401) {
      localStorage.removeItem("adminToken");

      // Don't redirect if already on login page
      if (!window.location.hash.includes("#/login")) {
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 1000);
      }

      handleApiError(
        error,
        "AUTHENTICATION",
        "Session expired. Please login again."
      );
      return Promise.reject(error);
    }

    // Handle authorization errors
    if (response?.status === 403) {
      handleApiError(
        error,
        "AUTHORIZATION",
        "Access denied. Admin privileges required."
      );
      return Promise.reject(error);
    }

    // Handle validation errors (don't show toast, let form handle it)
    if (response?.status === 400) {
      // Don't show toast for validation errors, let the form components handle them
      return Promise.reject(error);
    }

    // Handle not found errors
    if (response?.status === 404) {
      handleApiError(
        error,
        "NOT_FOUND",
        "The requested resource was not found."
      );
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (response?.status === 429) {
      const retryAfter = response.headers["retry-after"] || 60;
      handleApiError(
        error,
        "RATE_LIMIT",
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
      return Promise.reject(error);
    }

    // Handle server errors with retry logic
    if (response?.status >= 500) {
      try {
        return await retryRequest(config);
      } catch (retryError) {
        handleApiError(
          retryError,
          "SERVER_ERROR",
          "Server error. Please try again later."
        );
        return Promise.reject(retryError);
      }
    }

    // Handle network errors with retry logic
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
      try {
        return await retryRequest(config);
      } catch (retryError) {
        const context =
          error.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK_ERROR";
        const message =
          error.code === "ECONNABORTED"
            ? "Request timeout. Please check your connection and try again."
            : "Network error. Please check your connection.";

        handleApiError(retryError, context, message);
        return Promise.reject(retryError);
      }
    }

    // Handle other errors
    handleApiError(
      error,
      "UNKNOWN_ERROR",
      "Something went wrong. Please try again."
    );
    return Promise.reject(error);
  }
);

// Enhanced API wrapper with comprehensive options
export const apiRequest = async (requestConfig, options = {}) => {
  const {
    showLoading = false,
    loadingMessage = "Loading...",
    successMessage = null,
    errorMessage = null,
    onSuccess = null,
    onError = null,
    context = null,
    retryOnError = false,
    validateResponse = null,
  } = options;

  let loadingToast;

  const executeRequest = async () => {
    try {
      if (showLoading) {
        loadingToast = showToast.info(loadingMessage, { duration: Infinity });
      }

      const response = await api(requestConfig);

      // Validate response if validator provided
      if (validateResponse && !validateResponse(response.data)) {
        throw new Error("Invalid response data received");
      }

      if (loadingToast) {
        showToast.dismiss(loadingToast);
      }

      if (successMessage) {
        showToast.success(successMessage);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;
    } catch (error) {
      if (loadingToast) {
        showToast.dismiss(loadingToast);
      }

      // Handle error with context
      if (context) {
        handleApiError(error, context, errorMessage);
      } else if (errorMessage) {
        showToast.error(errorMessage);
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  };

  // Use retry wrapper if enabled
  if (retryOnError) {
    return withErrorHandling(executeRequest, context, {
      maxRetries: 2,
      customMessage: errorMessage,
    })();
  }

  return executeRequest();
};

// Specialized API methods for different operations
export const apiMethods = {
  // GET request with caching support
  get: (url, options = {}) => {
    const { cache = false, cacheKey, ...restOptions } = options;

    if (cache && cacheKey) {
      const cached = sessionStorage.getItem(`api_cache_${cacheKey}`);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const maxAge = options.maxAge || 300000; // 5 minutes default

          if (Date.now() - timestamp < maxAge) {
            return Promise.resolve(data);
          }
        } catch (error) {
          // Invalid cache, continue with request
        }
      }
    }

    return apiRequest({ method: "GET", url }, restOptions).then((data) => {
      if (cache && cacheKey) {
        sessionStorage.setItem(
          `api_cache_${cacheKey}`,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      }
      return data;
    });
  },

  // POST request for creating resources
  post: (url, data, options = {}) => {
    return apiRequest(
      {
        method: "POST",
        url,
        data,
      },
      {
        successMessage: "Created successfully",
        ...options,
      }
    );
  },

  // PUT request for updating resources
  put: (url, data, options = {}) => {
    return apiRequest(
      {
        method: "PUT",
        url,
        data,
      },
      {
        successMessage: "Updated successfully",
        ...options,
      }
    );
  },

  // PATCH request for partial updates
  patch: (url, data, options = {}) => {
    return apiRequest(
      {
        method: "PATCH",
        url,
        data,
      },
      {
        successMessage: "Updated successfully",
        ...options,
      }
    );
  },

  // DELETE request for removing resources
  delete: (url, options = {}) => {
    return apiRequest(
      {
        method: "DELETE",
        url,
      },
      {
        successMessage: "Deleted successfully",
        ...options,
      }
    );
  },

  // Bulk operations
  bulk: (operations, options = {}) => {
    const requests = operations.map((op) => api(op));

    return Promise.allSettled(requests).then((results) => {
      const successful = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value.data);
      const failed = results
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason);

      if (failed.length > 0) {
        console.warn(`${failed.length} bulk operations failed:`, failed);
      }

      if (options.successMessage && successful.length > 0) {
        showToast.success(
          `${successful.length} operations completed successfully`
        );
      }

      return { successful, failed };
    });
  },
};

// Network status monitoring
export const networkMonitor = {
  isOnline: navigator.onLine,

  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      showToast.success("Connection restored");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      showToast.error(
        "Connection lost. Please check your internet connection."
      );
    });
  },

  checkConnection() {
    return fetch("/api/health", { method: "HEAD" })
      .then(() => true)
      .catch(() => false);
  },
};

// Initialize network monitoring
networkMonitor.init();

export default api;
