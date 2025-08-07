/**
 * Enhanced loading state management hook
 * Provides comprehensive loading state management with optimistic updates
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { showToast } from "../utils/toast";

// Loading state types
export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// Loading operation types
export const OPERATION_TYPES = {
  FETCH: "fetch",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  BULK: "bulk",
  EXPORT: "export",
  IMPORT: "import",
};

/**
 * Enhanced loading state hook with multiple operation support
 */
export const useLoadingState = (options = {}) => {
  const {
    initialState = LOADING_STATES.IDLE,
    enableOptimisticUpdates = false,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = "Operation completed successfully",
    errorMessage = "Operation failed",
    timeout = 30000, // 30 seconds default timeout
  } = options;

  const [loadingStates, setLoadingStates] = useState({});
  const [globalState, setGlobalState] = useState(initialState);
  const [optimisticData, setOptimisticData] = useState(null);
  const [error, setError] = useState(null);
  const timeoutRefs = useRef({});

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  /**
   * Set loading state for a specific operation
   */
  const setLoadingState = useCallback(
    (operationId, state, data = null) => {
      setLoadingStates((prev) => ({
        ...prev,
        [operationId]: { state, data, timestamp: Date.now() },
      }));

      // Update global state based on any loading operations
      const hasLoading = Object.values({
        ...loadingStates,
        [operationId]: { state },
      }).some((op) => op.state === LOADING_STATES.LOADING);

      setGlobalState(hasLoading ? LOADING_STATES.LOADING : state);

      // Clear timeout if operation completes
      if (
        state !== LOADING_STATES.LOADING &&
        timeoutRefs.current[operationId]
      ) {
        clearTimeout(timeoutRefs.current[operationId]);
        delete timeoutRefs.current[operationId];
      }
    },
    [loadingStates]
  );

  /**
   * Start loading for an operation
   */
  const startLoading = useCallback(
    (operationId, optimisticUpdate = null) => {
      setLoadingState(operationId, LOADING_STATES.LOADING);
      setError(null);

      // Apply optimistic update if provided
      if (enableOptimisticUpdates && optimisticUpdate) {
        setOptimisticData(optimisticUpdate);
      }

      // Set timeout for the operation
      if (timeout > 0) {
        timeoutRefs.current[operationId] = setTimeout(() => {
          setLoadingState(operationId, LOADING_STATES.ERROR);
          setError(new Error("Operation timed out"));

          if (showErrorToast) {
            showToast.error("Operation timed out. Please try again.");
          }
        }, timeout);
      }
    },
    [setLoadingState, enableOptimisticUpdates, timeout, showErrorToast]
  );

  /**
   * Complete loading successfully
   */
  const completeLoading = useCallback(
    (operationId, data = null, customSuccessMessage = null) => {
      setLoadingState(operationId, LOADING_STATES.SUCCESS, data);
      setOptimisticData(null); // Clear optimistic data

      if (showSuccessToast) {
        const message = customSuccessMessage || successMessage;
        showToast.success(message);
      }
    },
    [setLoadingState, showSuccessToast, successMessage]
  );

  /**
   * Complete loading with error
   */
  const errorLoading = useCallback(
    (operationId, error, customErrorMessage = null) => {
      setLoadingState(operationId, LOADING_STATES.ERROR);
      setError(error);
      setOptimisticData(null); // Clear optimistic data

      if (showErrorToast) {
        const message = customErrorMessage || error?.message || errorMessage;
        showToast.error(message);
      }
    },
    [setLoadingState, showErrorToast, errorMessage]
  );

  /**
   * Reset loading state for an operation
   */
  const resetLoading = useCallback(
    (operationId) => {
      setLoadingStates((prev) => {
        const newStates = { ...prev };
        delete newStates[operationId];
        return newStates;
      });

      // Clear timeout
      if (timeoutRefs.current[operationId]) {
        clearTimeout(timeoutRefs.current[operationId]);
        delete timeoutRefs.current[operationId];
      }

      // Update global state
      const hasLoading = Object.values(loadingStates).some(
        (op) => op.state === LOADING_STATES.LOADING
      );
      if (!hasLoading) {
        setGlobalState(LOADING_STATES.IDLE);
        setError(null);
      }
    },
    [loadingStates]
  );

  /**
   * Reset all loading states
   */
  const resetAllLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalState(LOADING_STATES.IDLE);
    setError(null);
    setOptimisticData(null);

    // Clear all timeouts
    Object.values(timeoutRefs.current).forEach(clearTimeout);
    timeoutRefs.current = {};
  }, []);

  /**
   * Check if a specific operation is loading
   */
  const isLoading = useCallback(
    (operationId) => {
      return loadingStates[operationId]?.state === LOADING_STATES.LOADING;
    },
    [loadingStates]
  );

  /**
   * Check if any operation is loading
   */
  const isAnyLoading = useCallback(() => {
    return globalState === LOADING_STATES.LOADING;
  }, [globalState]);

  /**
   * Get loading state for a specific operation
   */
  const getLoadingState = useCallback(
    (operationId) => {
      return (
        loadingStates[operationId] || { state: LOADING_STATES.IDLE, data: null }
      );
    },
    [loadingStates]
  );

  /**
   * Get all loading operations
   */
  const getLoadingOperations = useCallback(() => {
    return Object.entries(loadingStates)
      .filter(([_, state]) => state.state === LOADING_STATES.LOADING)
      .map(([id, state]) => ({ id, ...state }));
  }, [loadingStates]);

  /**
   * Wrapper for async operations with automatic loading state management
   */
  const withLoading = useCallback(
    (operationId, asyncFn, options = {}) => {
      const {
        optimisticUpdate = null,
        successMessage: customSuccessMessage = null,
        errorMessage: customErrorMessage = null,
      } = options;

      return async (...args) => {
        try {
          startLoading(operationId, optimisticUpdate);
          const result = await asyncFn(...args);
          completeLoading(operationId, result, customSuccessMessage);
          return result;
        } catch (error) {
          errorLoading(operationId, error, customErrorMessage);
          throw error;
        }
      };
    },
    [startLoading, completeLoading, errorLoading]
  );

  /**
   * Batch operation wrapper
   */
  const withBatchLoading = useCallback(
    (operations) => {
      const batchId = `batch_${Date.now()}`;

      return async () => {
        try {
          startLoading(batchId);
          const results = await Promise.allSettled(operations);

          const failures = results.filter(
            (result) => result.status === "rejected"
          );
          if (failures.length > 0) {
            throw new Error(`${failures.length} operations failed`);
          }

          const values = results.map((result) => result.value);
          completeLoading(batchId, values);
          return values;
        } catch (error) {
          errorLoading(batchId, error);
          throw error;
        }
      };
    },
    [startLoading, completeLoading, errorLoading]
  );

  return {
    // State getters
    loadingStates,
    globalState,
    optimisticData,
    error,
    isLoading,
    isAnyLoading,
    getLoadingState,
    getLoadingOperations,

    // State setters
    startLoading,
    completeLoading,
    errorLoading,
    resetLoading,
    resetAllLoading,

    // Utility functions
    withLoading,
    withBatchLoading,

    // Convenience getters
    isIdle: globalState === LOADING_STATES.IDLE,
    isGlobalLoading: globalState === LOADING_STATES.LOADING,
    isSuccess: globalState === LOADING_STATES.SUCCESS,
    isError: globalState === LOADING_STATES.ERROR,
  };
};

/**
 * Specialized hook for form loading states
 */
export const useFormLoadingState = (options = {}) => {
  const {
    enableOptimisticUpdates = true,
    showSuccessToast = true,
    ...restOptions
  } = options;

  const loadingState = useLoadingState({
    enableOptimisticUpdates,
    showSuccessToast,
    ...restOptions,
  });

  const [fieldStates, setFieldStates] = useState({});

  /**
   * Set loading state for a specific field
   */
  const setFieldLoading = useCallback((fieldName, isLoading) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: isLoading,
    }));
  }, []);

  /**
   * Check if a field is loading
   */
  const isFieldLoading = useCallback(
    (fieldName) => {
      return fieldStates[fieldName] || false;
    },
    [fieldStates]
  );

  /**
   * Submit form with loading state management
   */
  const submitForm = useCallback(
    (submitFn, options = {}) => {
      const { optimisticUpdate = null, fieldName = null } = options;

      return loadingState.withLoading(
        "form_submit",
        async (...args) => {
          if (fieldName) {
            setFieldLoading(fieldName, true);
          }

          try {
            const result = await submitFn(...args);
            return result;
          } finally {
            if (fieldName) {
              setFieldLoading(fieldName, false);
            }
          }
        },
        options
      );
    },
    [loadingState, setFieldLoading]
  );

  return {
    ...loadingState,
    fieldStates,
    setFieldLoading,
    isFieldLoading,
    submitForm,
    isSubmitting: loadingState.isLoading("form_submit"),
  };
};

/**
 * Specialized hook for data fetching loading states
 */
export const useDataLoadingState = (options = {}) => {
  const {
    enableOptimisticUpdates = false,
    showSuccessToast = false,
    ...restOptions
  } = options;

  const loadingState = useLoadingState({
    enableOptimisticUpdates,
    showSuccessToast,
    ...restOptions,
  });

  const [data, setData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  /**
   * Fetch data with loading state management
   */
  const fetchData = useCallback(
    (fetchFn, cacheKey = "default") => {
      return loadingState.withLoading(`fetch_${cacheKey}`, async (...args) => {
        const result = await fetchFn(...args);
        setData(result);
        setLastFetch(Date.now());
        return result;
      });
    },
    [loadingState]
  );

  /**
   * Refresh data
   */
  const refreshData = useCallback(
    (fetchFn, cacheKey = "default") => {
      return fetchData(fetchFn, cacheKey);
    },
    [fetchData]
  );

  /**
   * Check if data is stale
   */
  const isDataStale = useCallback(
    (maxAge = 300000) => {
      // 5 minutes default
      return !lastFetch || Date.now() - lastFetch > maxAge;
    },
    [lastFetch]
  );

  return {
    ...loadingState,
    data,
    lastFetch,
    fetchData,
    refreshData,
    isDataStale,
    isFetching: loadingState.isLoading("fetch_default"),
  };
};

export default useLoadingState;
