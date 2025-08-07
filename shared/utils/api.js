import {
  API_BASE_URL,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from "../constants/index.js";

/**
 * API utility class for making HTTP requests
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise} - Response promise
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Request failed",
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 0, null);
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise} - Response promise
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, { method: "GET" });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @returns {Promise} - Response promise
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @returns {Promise} - Response promise
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @returns {Promise} - Response promise
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - Response promise
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  /**
   * Upload file
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @returns {Promise} - Response promise
   */
  async upload(endpoint, formData) {
    const headers = { ...this.defaultHeaders };
    delete headers["Content-Type"]; // Let browser set content-type for FormData

    return this.request(endpoint, {
      method: "POST",
      body: formData,
      headers,
    });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /**
   * Check if error is due to authentication
   * @returns {boolean} - True if auth error
   */
  isAuthError() {
    return this.status === HTTP_STATUS.UNAUTHORIZED;
  }

  /**
   * Check if error is due to forbidden access
   * @returns {boolean} - True if forbidden error
   */
  isForbiddenError() {
    return this.status === HTTP_STATUS.FORBIDDEN;
  }

  /**
   * Check if error is due to validation
   * @returns {boolean} - True if validation error
   */
  isValidationError() {
    return this.status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
  }

  /**
   * Check if error is server error
   * @returns {boolean} - True if server error
   */
  isServerError() {
    return this.status >= 500;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
