import { paymentLogger } from "./paymentLogger.js";

/**
 * Comprehensive Error Recovery Service
 * Handles automatic retry logic, graceful degradation, and fallback mechanisms
 */

// Error recovery strategies configuration
const ERROR_RECOVERY_STRATEGIES = {
  NETWORK_ERROR: {
    retryable: true,
    maxRetries: 3,
    backoffStrategy: "exponential",
    baseDelay: 1000,
    maxDelay: 10000,
    jitterFactor: 0.1,
    fallbackAction: "queue_for_later",
  },
  RAZORPAY_API_ERROR: {
    retryable: true,
    maxRetries: 3,
    backoffStrategy: "exponential",
    baseDelay: 2000,
    maxDelay: 15000,
    jitterFactor: 0.2,
    fallbackAction: "notify_admin",
  },
  DATABASE_ERROR: {
    retryable: true,
    maxRetries: 2,
    backoffStrategy: "linear",
    baseDelay: 1500,
    maxDelay: 5000,
    jitterFactor: 0.1,
    fallbackAction: "queue_for_retry",
  },
  TIMEOUT_ERROR: {
    retryable: true,
    maxRetries: 2,
    backoffStrategy: "exponential",
    baseDelay: 3000,
    maxDelay: 12000,
    jitterFactor: 0.15,
    fallbackAction: "extend_timeout",
  },
  VALIDATION_ERROR: {
    retryable: false,
    fallbackAction: "return_user_friendly_error",
  },
  AUTHENTICATION_ERROR: {
    retryable: false,
    fallbackAction: "redirect_to_login",
  },
};

// Timeout configurations for different operations
const OPERATION_TIMEOUTS = {
  RAZORPAY_ORDER_CREATION: 30000, // 30 seconds
  DATABASE_OPERATION: 15000, // 15 seconds
  PAYMENT_VERIFICATION: 20000, // 20 seconds
  WEBHOOK_PROCESSING: 10000, // 10 seconds
  EXTERNAL_API_CALL: 25000, // 25 seconds
};

class ErrorRecoveryService {
  constructor() {
    this.activeRetries = new Map(); // Track active retry operations
    this.failureQueue = new Map(); // Queue for failed operations
    this.circuitBreakers = new Map(); // Circuit breaker states
  }

  /**
   * Generate unique operation ID for tracking
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if error is retryable based on error type and configuration
   */
  isRetryableError(error, errorType) {
    const strategy = ERROR_RECOVERY_STRATEGIES[errorType];
    if (!strategy || !strategy.retryable) {
      return false;
    }

    // Check for specific non-retryable conditions
    if (error.code === "ENOTFOUND" && error.hostname) {
      // DNS resolution failures are usually not transient
      return false;
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      // Authentication/authorization errors are not retryable
      return false;
    }

    if (error.statusCode === 400 && !error.isTransient) {
      // Bad request errors are usually not retryable unless marked as transient
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay with different backoff strategies
   */
  calculateRetryDelay(attempt, strategy) {
    const { backoffStrategy, baseDelay, maxDelay, jitterFactor } = strategy;
    let delay;

    switch (backoffStrategy) {
      case "exponential":
        delay = baseDelay * Math.pow(2, attempt - 1);
        break;
      case "linear":
        delay = baseDelay * attempt;
        break;
      case "fixed":
        delay = baseDelay;
        break;
      default:
        delay = baseDelay;
    }

    // Apply jitter to prevent thundering herd
    const jitter = delay * jitterFactor * (Math.random() - 0.5);
    delay = Math.max(0, delay + jitter);

    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }

  /**
   * Execute operation with comprehensive retry logic and timeout handling
   */
  async executeWithRetry(operation, operationName, errorType, options = {}) {
    const operationId = this.generateOperationId();
    const strategy = ERROR_RECOVERY_STRATEGIES[errorType];
    const timeout =
      options.timeout || OPERATION_TIMEOUTS[operationName] || 30000;

    const {
      maxRetries = strategy?.maxRetries || 3,
      onRetry = null,
      onFallback = null,
      context = {},
    } = options;

    let lastError;
    let attempt = 0;

    // Track active retry operation
    this.activeRetries.set(operationId, {
      operationName,
      errorType,
      startTime: Date.now(),
      attempts: 0,
      context,
    });

    try {
      while (attempt <= maxRetries) {
        attempt++;
        const attemptStartTime = Date.now();

        try {
          paymentLogger.logRetryAttempt(operationId, {
            operationName,
            attempt,
            maxRetries,
            timeout,
            context,
          });

          // Execute operation with timeout
          const result = await this.executeWithTimeout(
            operation,
            timeout,
            operationId
          );

          // Success - clean up and return
          this.activeRetries.delete(operationId);

          paymentLogger.logRetrySuccess(operationId, {
            operationName,
            attempt,
            duration: Date.now() - attemptStartTime,
            totalDuration:
              Date.now() - this.activeRetries.get(operationId)?.startTime,
          });

          return result;
        } catch (error) {
          lastError = error;
          const attemptDuration = Date.now() - attemptStartTime;

          paymentLogger.logRetryFailure(operationId, {
            operationName,
            attempt,
            maxRetries,
            error: error.message,
            errorCode: error.code,
            statusCode: error.statusCode,
            duration: attemptDuration,
            isTimeout: error.name === "TimeoutError",
          });

          // Update retry tracking
          const retryInfo = this.activeRetries.get(operationId);
          if (retryInfo) {
            retryInfo.attempts = attempt;
            retryInfo.lastError = error;
          }

          // Check if we should retry
          if (
            attempt > maxRetries ||
            !this.isRetryableError(error, errorType)
          ) {
            break;
          }

          // Calculate delay and wait
          const retryDelay = this.calculateRetryDelay(attempt, strategy);

          paymentLogger.logRetryDelay(operationId, {
            operationName,
            attempt,
            retryDelay,
            reason: error.message,
          });

          // Call retry callback if provided
          if (onRetry) {
            try {
              await onRetry(error, attempt, retryDelay);
            } catch (callbackError) {
              console.error("Retry callback error:", callbackError);
            }
          }

          // Wait before retry
          await this.delay(retryDelay);
        }
      }

      // All retries exhausted - execute fallback
      return await this.executeFallback(
        lastError,
        operationName,
        errorType,
        operationId,
        onFallback,
        context
      );
    } finally {
      this.activeRetries.delete(operationId);
    }
  }

  /**
   * Execute operation with timeout handling
   */
  async executeWithTimeout(operation, timeout, operationId) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const timeoutError = new Error(
          `Operation timed out after ${timeout}ms`
        );
        timeoutError.name = "TimeoutError";
        timeoutError.code = "TIMEOUT";
        timeoutError.timeout = timeout;
        timeoutError.operationId = operationId;
        reject(timeoutError);
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Execute fallback mechanisms when all retries are exhausted
   */
  async executeFallback(
    error,
    operationName,
    errorType,
    operationId,
    onFallback,
    context
  ) {
    const strategy = ERROR_RECOVERY_STRATEGIES[errorType];
    const fallbackAction = strategy?.fallbackAction || "throw_error";

    paymentLogger.logFallbackExecution(operationId, {
      operationName,
      errorType,
      fallbackAction,
      error: error.message,
      context,
    });

    try {
      switch (fallbackAction) {
        case "queue_for_later":
          return await this.queueForLater(operationName, context, error);

        case "queue_for_retry":
          return await this.queueForRetry(operationName, context, error);

        case "notify_admin":
          await this.notifyAdmin(operationName, error, context);
          throw this.createUserFriendlyError(error, operationName);

        case "extend_timeout":
          // Try once more with extended timeout
          const extendedTimeout = (context.timeout || 30000) * 2;
          return await this.executeWithTimeout(
            context.operation,
            extendedTimeout,
            operationId
          );

        case "return_user_friendly_error":
          throw this.createUserFriendlyError(error, operationName);

        case "redirect_to_login":
          const authError = new Error("Authentication required");
          authError.code = "AUTH_REQUIRED";
          authError.statusCode = 401;
          authError.redirectTo = "/login";
          throw authError;

        default:
          // Execute custom fallback if provided
          if (onFallback) {
            return await onFallback(error, operationName, context);
          }
          throw error;
      }
    } catch (fallbackError) {
      paymentLogger.logFallbackFailure(operationId, {
        operationName,
        fallbackAction,
        error: fallbackError.message,
        originalError: error.message,
      });
      throw fallbackError;
    }
  }

  /**
   * Queue operation for later execution
   */
  async queueForLater(operationName, context, error) {
    const queueId = this.generateOperationId();

    this.failureQueue.set(queueId, {
      operationName,
      context,
      error,
      queuedAt: new Date(),
      retryAfter: new Date(Date.now() + 5 * 60 * 1000), // Retry after 5 minutes
      attempts: 0,
    });

    paymentLogger.logOperationQueued(queueId, {
      operationName,
      error: error.message,
      retryAfter: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Return a graceful degradation response
    return {
      success: false,
      queued: true,
      queueId,
      message:
        "Operation has been queued for retry. You will be notified when completed.",
      retryAfter: new Date(Date.now() + 5 * 60 * 1000),
    };
  }

  /**
   * Queue operation for immediate retry with different parameters
   */
  async queueForRetry(operationName, context, error) {
    // Similar to queueForLater but with shorter delay
    const queueId = this.generateOperationId();

    this.failureQueue.set(queueId, {
      operationName,
      context,
      error,
      queuedAt: new Date(),
      retryAfter: new Date(Date.now() + 30 * 1000), // Retry after 30 seconds
      attempts: 0,
    });

    return {
      success: false,
      queued: true,
      queueId,
      message: "Operation will be retried shortly. Please wait...",
      retryAfter: new Date(Date.now() + 30 * 1000),
    };
  }

  /**
   * Notify administrators about critical failures
   */
  async notifyAdmin(operationName, error, context) {
    const notification = {
      type: "CRITICAL_PAYMENT_ERROR",
      operationName,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      },
      context,
      timestamp: new Date(),
      severity: "HIGH",
    };

    // Log for admin notification system
    paymentLogger.logAdminNotification(notification);

    // In a real system, this would send email/SMS/Slack notification
    console.error("🚨 ADMIN NOTIFICATION:", notification);
  }

  /**
   * Create user-friendly error messages
   */
  createUserFriendlyError(error, operationName) {
    const userFriendlyMessages = {
      RAZORPAY_ORDER_CREATION:
        "Unable to process payment at the moment. Please try again in a few minutes.",
      DATABASE_OPERATION:
        "Service temporarily unavailable. Please try again shortly.",
      PAYMENT_VERIFICATION:
        "Payment verification failed. Please contact support if money was deducted.",
      WEBHOOK_PROCESSING:
        "Payment status update delayed. Your payment is being processed.",
      EXTERNAL_API_CALL:
        "External service unavailable. Please try again later.",
    };

    const message =
      userFriendlyMessages[operationName] ||
      "An unexpected error occurred. Please try again or contact support.";

    const userError = new Error(message);
    userError.code = "USER_FRIENDLY_ERROR";
    userError.statusCode = error.statusCode || 500;
    userError.originalError = error;
    userError.operationName = operationName;
    userError.isUserFriendly = true;

    return userError;
  }

  /**
   * Process queued operations
   */
  async processQueuedOperations() {
    const now = new Date();
    const readyOperations = [];

    for (const [queueId, queuedOp] of this.failureQueue.entries()) {
      if (now >= queuedOp.retryAfter && queuedOp.attempts < 3) {
        readyOperations.push({ queueId, ...queuedOp });
      }
    }

    for (const operation of readyOperations) {
      try {
        operation.attempts++;

        // Execute the queued operation
        const result = await this.executeWithRetry(
          operation.context.operation,
          operation.operationName,
          "NETWORK_ERROR", // Default error type for queued operations
          {
            maxRetries: 1, // Only one retry for queued operations
            context: operation.context,
          }
        );

        // Success - remove from queue
        this.failureQueue.delete(operation.queueId);

        paymentLogger.logQueuedOperationSuccess(operation.queueId, {
          operationName: operation.operationName,
          attempts: operation.attempts,
        });
      } catch (error) {
        if (operation.attempts >= 3) {
          // Max attempts reached - remove from queue and notify admin
          this.failureQueue.delete(operation.queueId);
          await this.notifyAdmin(
            operation.operationName,
            error,
            operation.context
          );
        } else {
          // Update retry time
          operation.retryAfter = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        }

        paymentLogger.logQueuedOperationFailure(operation.queueId, {
          operationName: operation.operationName,
          attempts: operation.attempts,
          error: error.message,
        });
      }
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    return {
      activeRetries: this.activeRetries.size,
      queuedOperations: this.failureQueue.size,
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      timestamp: new Date(),
    };
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Circuit breaker implementation for external services
   */
  async executeWithCircuitBreaker(operation, serviceName, options = {}) {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      monitoringPeriod = 300000, // 5 minutes
    } = options;

    const circuitState = this.circuitBreakers.get(serviceName) || {
      state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      nextAttemptTime: null,
    };

    // Check circuit breaker state
    if (circuitState.state === "OPEN") {
      if (Date.now() < circuitState.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is OPEN for ${serviceName}. Service unavailable.`
        );
      } else {
        // Try to recover - move to HALF_OPEN
        circuitState.state = "HALF_OPEN";
      }
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      circuitState.state = "CLOSED";
      circuitState.failures = 0;
      circuitState.lastSuccessTime = Date.now();
      this.circuitBreakers.set(serviceName, circuitState);

      return result;
    } catch (error) {
      circuitState.failures++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failures >= failureThreshold) {
        // Open circuit breaker
        circuitState.state = "OPEN";
        circuitState.nextAttemptTime = Date.now() + recoveryTimeout;
      }

      this.circuitBreakers.set(serviceName, circuitState);
      throw error;
    }
  }
}

export const errorRecoveryService = new ErrorRecoveryService();

// Start processing queued operations every minute
setInterval(() => {
  errorRecoveryService.processQueuedOperations().catch((error) => {
    console.error("Error processing queued operations:", error);
  });
}, 60000);

export default ErrorRecoveryService;
