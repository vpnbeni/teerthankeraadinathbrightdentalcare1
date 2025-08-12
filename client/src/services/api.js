import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request deduplication to prevent double API calls
const pendingRequests = new Map();

const generateRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(
    config.data || {}
  )}:${JSON.stringify(config.params || {})}`;
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Retry logic
const retryRequest = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    // Don't retry POST requests to prevent duplicate operations
    const shouldRetry =
      config.method !== "post" &&
      retryCount < MAX_RETRIES &&
      (RETRY_STATUS_CODES.includes(error.response?.status) ||
        error.code === "NETWORK_ERROR" ||
        error.code === "ECONNABORTED");

    if (shouldRetry) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }

    throw error;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Request deduplication for POST requests (to prevent double booking)
    if (config.method === "post") {
      const requestKey = generateRequestKey(config);

      // If there's already a pending request with the same key, return the existing promise
      if (pendingRequests.has(requestKey)) {
        console.log(`Deduplicating request: ${requestKey}`);
        return pendingRequests.get(requestKey);
      }

      // Store the request promise
      config.requestKey = requestKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Clean up pending request
    if (response.config.requestKey) {
      pendingRequests.delete(response.config.requestKey);
    }

    // Log response time in development
    if (process.env.NODE_ENV === "development" && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      console.log(
        `API Request: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }

    // Show success message if provided by the API
    if (response.data?.message && !response.config.skipSuccessMessage) {
      toast.success(response.data.message);
    }

    return response;
  },
  async (error) => {
    const { response, config } = error;

    // Clean up pending request on error
    if (config.requestKey) {
      pendingRequests.delete(config.requestKey);
    }

    // Don't show error toast if skipErrorMessage is true
    if (config.skipErrorMessage) {
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (response?.status === 401) {
      // Don't redirect if this is an auth check request (initial load) or if skipRedirect is true
      if (!config.url?.includes("/auth/check") && !config.skipRedirect) {
        window.location.hash = "#/";
        toast.error("Your session has expired. Please log in again.");
      }
      return Promise.reject(error);
    }

    // Handle authorization errors
    if (response?.status === 403) {
      toast.error(
        response.data?.message ||
          "You don't have permission to perform this action."
      );
      return Promise.reject(error);
    }

    // Handle validation errors
    if (response?.status === 400) {
      toast.error(
        response.data?.message || "Please check your input and try again."
      );
      return Promise.reject(error);
    }

    // Handle not found errors
    if (response?.status === 404) {
      toast.error(
        response.data?.message || "The requested resource was not found."
      );
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (response?.status === 429) {
      const retryAfter = response.headers["retry-after"] || 60;
      toast.error(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
      return Promise.reject(error);
    }

    // Handle server errors with retry logic
    if (response?.status >= 500) {
      try {
        return await retryRequest(config);
      } catch (retryError) {
        toast.error(
          response.data?.message || "Server error. Please try again later."
        );
        return Promise.reject(retryError);
      }
    }

    // Handle network errors with retry logic
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
      try {
        return await retryRequest(config);
      } catch (retryError) {
        toast.error(
          error.code === "ECONNABORTED"
            ? "Request timeout. Please check your connection and try again."
            : "Network error. Please check your connection."
        );
        return Promise.reject(retryError);
      }
    }

    // Handle other errors
    if (response?.data?.message) {
      toast.error(response.data.message);
    }
    return Promise.reject(error);
  }
);

// Enhanced API wrapper with loading states and error handling
export const apiRequest = async (requestConfig, options = {}) => {
  const {
    showLoading = false,
    loadingMessage = "Loading...",
    successMessage = null,
    errorMessage = null,
    onSuccess = null,
    onError = null,
  } = options;

  let loadingToast;

  try {
    if (showLoading) {
      loadingToast = toast.loading(loadingMessage);
    }

    const response = await api(requestConfig);

    if (loadingToast) {
      toast.dismiss(loadingToast);
    }

    if (successMessage) {
      toast.success(successMessage);
    }

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }

    if (errorMessage) {
      toast.error(errorMessage);
    }

    if (onError) {
      onError(error);
    }

    throw error;
  }
};

export default api;
