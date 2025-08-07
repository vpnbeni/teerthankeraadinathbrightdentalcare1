import { paymentLogger } from "./paymentLogger.js";

/**
 * Comprehensive Timeout Handler Service
 * Manages timeouts for long-running payment operations with graceful degradation
 */

// Timeout configurations for different operations
const TIMEOUT_CONFIGS = {
  RAZORPAY_ORDER_CREATION: {
    timeout: 30000, // 30 seconds
    warningThreshold: 20000, // 20 seconds
    description: "Razorpay order creation",
    userMessage: "Creating payment order is taking longer than expected...",
    fallbackMessage: "Payment order creation timed out. Please try again.",
  },
  DATABASE_OPERATION: {
    timeout: 15000, // 15 seconds
    warningThreshold: 10000, // 10 seconds
    description: "Database operation",
    userMessage: "Saving payment information is taking longer than expected...",
    fallbackMessage:
      "Database operation timed out. Your payment may still be processing.",
  },
  PAYMENT_VERIFICATION: {
    timeout: 20000, // 20 seconds
    warningThreshold: 15000, // 15 seconds
    description: "Payment verification",
    userMessage: "Verifying payment is taking longer than expected...",
    fallbackMessage:
      "Payment verification timed out. Please check your payment status.",
  },
  WEBHOOK_PROCESSING: {
    timeout: 10000, // 10 seconds
    warningThreshold: 7000, // 7 seconds
    description: "Webhook processing",
    userMessage: "Processing payment update...",
    fallbackMessage: "Payment update processing timed out.",
  },
  EXTERNAL_API_CALL: {
    timeout: 25000, // 25 seconds
    warningThreshold: 18000, // 18 seconds
    description: "External API call",
    userMessage: "Connecting to external service...",
    fallbackMessage: "External service call timed out. Please try again.",
  },
};

class TimeoutHandler {
  constructor() {
    this.activeOperations = new Map(); // Track active operations
    this.timeoutCallbacks = new Map(); // Store timeout callbacks
    this.warningCallbacks = new Map(); // Store warning callbacks
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `timeout_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  /**
   * Execute operation with comprehensive timeout handling
   */
  async executeWithTimeout(operation, operationType, options = {}) {
    const operationId = this.generateOperationId();
    const config = TIMEOUT_CONFIGS[operationType];

    if (!config) {
      throw new Error(`Unknown operation type: ${operationType}`);
    }

    const {
      timeout = config.timeout,
      warningThreshold = config.warningThreshold,
      onWarning = null,
      onTimeout = null,
      context = {},
      enableGracefulDegradation = true,
    } = options;

    const startTime = Date.now();
    let warningTimer;
    let timeoutTimer;
    let isCompleted = false;

    // Track active operation
    this.activeOperations.set(operationId, {
      operationType,
      startTime,
      timeout,
      warningThreshold,
      context,
      description: config.description,
    });

    // Log operation start
    paymentLogger.logTimeoutOperationStart(operationId, {
      operationType,
      timeout,
      warningThreshold,
      context,
    });

    try {
      // Set up warning timer
      if (warningThreshold > 0) {
        warningTimer = setTimeout(() => {
          if (!isCompleted) {
            this.handleOperationWarning(operationId, config, onWarning);
          }
        }, warningThreshold);
      }

      // Set up timeout timer
      timeoutTimer = setTimeout(() => {
        if (!isCompleted) {
          this.handleOperationTimeout(
            operationId,
            config,
            onTimeout,
            enableGracefulDegradation
          );
        }
      }, timeout);

      // Execute the operation
      const result = await operation();

      // Operation completed successfully
      isCompleted = true;
      const duration = Date.now() - startTime;

      // Clear timers
      if (warningTimer) clearTimeout(warningTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      // Log success
      paymentLogger.logTimeoutOperationSuccess(operationId, {
        operationType,
        duration,
        wasWarningTriggered: duration > warningThreshold,
        context,
      });

      // Clean up
      this.activeOperations.delete(operationId);

      return result;
    } catch (error) {
      isCompleted = true;
      const duration = Date.now() - startTime;

      // Clear timers
      if (warningTimer) clearTimeout(warningTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      // Log failure
      paymentLogger.logTimeoutOperationFailure(operationId, {
        operationType,
        duration,
        error: error.message,
        isTimeout: error.name === "TimeoutError",
        context,
      });

      // Clean up
      this.activeOperations.delete(operationId);

      // If it's a timeout error, enhance it with user-friendly information
      if (error.name === "TimeoutError") {
        error.userMessage = config.fallbackMessage;
        error.operationType = operationType;
        error.operationId = operationId;
        error.duration = duration;
        error.expectedTimeout = timeout;
        error.context = context;
      }

      throw error;
    }
  }

  /**
   * Handle operation warning (when operation is taking longer than expected)
   */
  handleOperationWarning(operationId, config, onWarning) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const warningInfo = {
      operationId,
      operationType: operation.operationType,
      duration: Date.now() - operation.startTime,
      warningThreshold: operation.warningThreshold,
      expectedTimeout: operation.timeout,
      userMessage: config.userMessage,
      description: config.description,
      context: operation.context,
    };

    // Log warning
    paymentLogger.logTimeoutWarning(operationId, warningInfo);

    console.warn(`⚠️ Operation taking longer than expected:`, warningInfo);

    // Call custom warning callback if provided
    if (onWarning) {
      try {
        onWarning(warningInfo);
      } catch (callbackError) {
        console.error("Warning callback error:", callbackError);
      }
    }

    // Store warning info for potential timeout handling
    this.warningCallbacks.set(operationId, warningInfo);
  }

  /**
   * Handle operation timeout
   */
  handleOperationTimeout(
    operationId,
    config,
    onTimeout,
    enableGracefulDegradation
  ) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const timeoutInfo = {
      operationId,
      operationType: operation.operationType,
      duration: Date.now() - operation.startTime,
      timeout: operation.timeout,
      userMessage: config.fallbackMessage,
      description: config.description,
      context: operation.context,
      wasWarningTriggered: this.warningCallbacks.has(operationId),
    };

    // Log timeout
    paymentLogger.logTimeoutOccurred(operationId, timeoutInfo);

    console.error(`⏰ Operation timed out:`, timeoutInfo);

    // Create timeout error
    const timeoutError = new Error(
      `${config.description} timed out after ${operation.timeout}ms`
    );
    timeoutError.name = "TimeoutError";
    timeoutError.code = "TIMEOUT";
    timeoutError.operationId = operationId;
    timeoutError.operationType = operation.operationType;
    timeoutError.duration = timeoutInfo.duration;
    timeoutError.timeout = operation.timeout;
    timeoutError.userMessage = config.fallbackMessage;
    timeoutError.context = operation.context;

    // Handle graceful degradation
    if (enableGracefulDegradation) {
      this.handleGracefulDegradation(timeoutInfo, timeoutError);
    }

    // Call custom timeout callback if provided
    if (onTimeout) {
      try {
        onTimeout(timeoutError, timeoutInfo);
      } catch (callbackError) {
        console.error("Timeout callback error:", callbackError);
      }
    }

    // Store timeout info
    this.timeoutCallbacks.set(operationId, {
      timeoutInfo,
      error: timeoutError,
    });

    // Clean up warning callback
    this.warningCallbacks.delete(operationId);
  }

  /**
   * Handle graceful degradation for timed out operations
   */
  handleGracefulDegradation(timeoutInfo, timeoutError) {
    switch (timeoutInfo.operationType) {
      case "RAZORPAY_ORDER_CREATION":
        // For order creation timeouts, suggest checking existing orders
        timeoutError.fallbackActions = [
          "Check if order was already created",
          "Refresh the page and try again",
          "Contact support if issue persists",
        ];
        timeoutError.checkExistingOrder = true;
        break;

      case "DATABASE_OPERATION":
        // For database timeouts, suggest checking operation status
        timeoutError.fallbackActions = [
          "Wait a moment and check operation status",
          "Do not retry immediately to avoid duplicates",
          "Contact support if data is inconsistent",
        ];
        timeoutError.checkOperationStatus = true;
        break;

      case "PAYMENT_VERIFICATION":
        // For verification timeouts, provide payment status guidance
        timeoutError.fallbackActions = [
          "Check your payment status in account",
          "Do not make another payment immediately",
          "Contact support with payment details",
        ];
        timeoutError.checkPaymentStatus = true;
        timeoutError.statusCheckUrl = "/api/payments/status";
        break;

      case "WEBHOOK_PROCESSING":
        // For webhook timeouts, queue for retry
        timeoutError.fallbackActions = [
          "Payment update will be retried automatically",
          "Check payment status in a few minutes",
          "Contact support if status doesn't update",
        ];
        timeoutError.willRetryAutomatically = true;
        break;

      case "EXTERNAL_API_CALL":
        // For external API timeouts, suggest alternative approaches
        timeoutError.fallbackActions = [
          "Try again in a few minutes",
          "Check service status page",
          "Use alternative method if available",
        ];
        timeoutError.checkServiceStatus = true;
        break;

      default:
        // Generic fallback actions
        timeoutError.fallbackActions = [
          "Wait a moment and try again",
          "Refresh the page if needed",
          "Contact support for assistance",
        ];
        break;
    }

    // Add common fallback information
    timeoutError.supportContact = "support@teerthankerdentalcare.com";
    timeoutError.retryRecommendedAfter = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Create timeout promise for manual timeout handling
   */
  createTimeoutPromise(timeout, operationType, operationId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const config = TIMEOUT_CONFIGS[operationType];
        const timeoutError = new Error(
          `${config?.description || operationType} timed out after ${timeout}ms`
        );
        timeoutError.name = "TimeoutError";
        timeoutError.code = "TIMEOUT";
        timeoutError.operationId = operationId;
        timeoutError.operationType = operationType;
        timeoutError.timeout = timeout;
        timeoutError.userMessage =
          config?.fallbackMessage || "Operation timed out";
        reject(timeoutError);
      }, timeout);
    });
  }

  /**
   * Get active operations statistics
   */
  getActiveOperationsStats() {
    const now = Date.now();
    const operations = Array.from(this.activeOperations.entries()).map(
      ([id, op]) => ({
        operationId: id,
        operationType: op.operationType,
        duration: now - op.startTime,
        remainingTime: Math.max(0, op.timeout - (now - op.startTime)),
        isNearTimeout: now - op.startTime > op.warningThreshold,
        description: op.description,
      })
    );

    return {
      totalActive: operations.length,
      operations,
      nearTimeoutCount: operations.filter((op) => op.isNearTimeout).length,
      timestamp: new Date(),
    };
  }

  /**
   * Cancel operation timeout
   */
  cancelOperationTimeout(operationId) {
    if (this.activeOperations.has(operationId)) {
      this.activeOperations.delete(operationId);
      this.warningCallbacks.delete(operationId);
      this.timeoutCallbacks.delete(operationId);

      paymentLogger.logTimeoutOperationCancelled(operationId);
      console.log(`⏹️ Operation timeout cancelled: ${operationId}`);
    }
  }

  /**
   * Extend operation timeout
   */
  extendOperationTimeout(operationId, additionalTime) {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.timeout += additionalTime;

      paymentLogger.logTimeoutExtended(operationId, {
        additionalTime,
        newTimeout: operation.timeout,
      });

      console.log(
        `⏰ Operation timeout extended: ${operationId} (+${additionalTime}ms)`
      );
    }
  }

  /**
   * Clean up expired timeout callbacks
   */
  cleanupExpiredCallbacks() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [operationId, callback] of this.timeoutCallbacks.entries()) {
      if (now - callback.timeoutInfo.duration > maxAge) {
        this.timeoutCallbacks.delete(operationId);
      }
    }

    for (const [operationId, warning] of this.warningCallbacks.entries()) {
      if (now - warning.duration > maxAge) {
        this.warningCallbacks.delete(operationId);
      }
    }
  }
}

// Create singleton instance
export const timeoutHandler = new TimeoutHandler();

// Clean up expired callbacks every 5 minutes
setInterval(() => {
  timeoutHandler.cleanupExpiredCallbacks();
}, 5 * 60 * 1000);

// Utility functions
export const executeWithTimeout = (operation, operationType, options = {}) => {
  return timeoutHandler.executeWithTimeout(operation, operationType, options);
};

export const createTimeoutPromise = (timeout, operationType, operationId) => {
  return timeoutHandler.createTimeoutPromise(
    timeout,
    operationType,
    operationId
  );
};

export const getTimeoutConfig = (operationType) => {
  return TIMEOUT_CONFIGS[operationType];
};

export default TimeoutHandler;
