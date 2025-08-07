/**
 * Handle API response and extract data
 * @param {Promise} apiCall - API call promise
 * @returns {Promise} - Promise with extracted data
 */
export const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall;
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Success",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message || error.message || "An error occurred",
      status: error.response?.status,
    };
  }
};

/**
 * Create query string from object
 * @param {object} params - Parameters object
 * @returns {string} - Query string
 */
export const createQueryString = (params) => {
  if (!params || typeof params !== "object") return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Parse query string to object
 * @param {string} queryString - Query string to parse
 * @returns {object} - Parsed parameters object
 */
export const parseQueryString = (queryString) => {
  if (!queryString || typeof queryString !== "string") return {};

  const params = {};
  const searchParams = new URLSearchParams(
    queryString.startsWith("?") ? queryString.slice(1) : queryString
  );

  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }

  return params;
};

/**
 * Create API error object
 * @param {Error} error - Error object
 * @returns {object} - Standardized error object
 */
export const createApiError = (error) => {
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status || 500,
    code: error.response?.data?.code || "UNKNOWN_ERROR",
    details: error.response?.data?.details || null,
  };
};

/**
 * Retry API call with exponential backoff
 * @param {Function} apiCall - API call function
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise with API response
 */
export const retryApiCall = async (
  apiCall,
  maxRetries = 3,
  baseDelay = 1000
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Cancel previous request and make new one
 * @param {object} cancelToken - Axios cancel token
 * @param {Function} apiCall - API call function
 * @returns {Promise} - Promise with API response
 */
export const cancelPreviousRequest = (cancelToken, apiCall) => {
  if (cancelToken.current) {
    cancelToken.current.cancel("Request cancelled due to new request");
  }

  const source = axios.CancelToken.source();
  cancelToken.current = source;

  return apiCall(source.token);
};

/**
 * Transform form data for API
 * @param {object} formData - Form data object
 * @param {object} transformRules - Transformation rules
 * @returns {object} - Transformed data
 */
export const transformFormData = (formData, transformRules = {}) => {
  const transformed = { ...formData };

  Object.entries(transformRules).forEach(([field, rule]) => {
    if (transformed[field] !== undefined) {
      switch (rule.type) {
        case "date":
          transformed[field] = new Date(transformed[field]).toISOString();
          break;
        case "number":
          transformed[field] = Number(transformed[field]);
          break;
        case "boolean":
          transformed[field] = Boolean(transformed[field]);
          break;
        case "array":
          if (!Array.isArray(transformed[field])) {
            transformed[field] = [transformed[field]];
          }
          break;
        case "string":
          transformed[field] = String(transformed[field]).trim();
          break;
        case "custom":
          if (typeof rule.transform === "function") {
            transformed[field] = rule.transform(transformed[field]);
          }
          break;
      }
    }
  });

  return transformed;
};

/**
 * Create FormData for file uploads
 * @param {object} data - Data object
 * @param {Array} fileFields - Array of file field names
 * @returns {FormData} - FormData object
 */
export const createFormData = (data, fileFields = []) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (fileFields.includes(key)) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((file, index) => {
          if (file instanceof File) {
            formData.append(`${key}[${index}]`, file);
          }
        });
      }
    } else if (value !== null && value !== undefined) {
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  return formData;
};

/**
 * Handle file download from API response
 * @param {object} response - API response with blob data
 * @param {string} filename - Filename for download
 * @param {string} contentType - Content type of file
 */
export const downloadFile = (
  response,
  filename,
  contentType = "application/octet-stream"
) => {
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Check if request was cancelled
 * @param {Error} error - Error object
 * @returns {boolean} - True if request was cancelled
 */
export const isRequestCancelled = (error) => {
  return (
    error.message === "Request cancelled due to new request" ||
    error.code === "ERR_CANCELED"
  );
};
