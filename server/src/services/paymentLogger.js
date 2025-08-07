import logger from "../utils/logger.js";
import { config } from "../config/environment.js";

// Import monitoring service (will be initialized after this service)
let paymentMonitoring = null;
const initMonitoring = () => {
  if (!paymentMonitoring) {
    try {
      const {
        paymentMonitoring: monitoring,
      } = require("./paymentMonitoring.js");
      paymentMonitoring = monitoring;
    } catch (error) {
      // Monitoring service not available, continue without it
      logger.warn("Payment monitoring service not available", {
        error: error.message,
      });
    }
  }
  return paymentMonitoring;
};

/**
 * Payment Logger Service
 * Provides structured logging and monitoring for payment operations
 */

class PaymentLogger {
  constructor() {
    this.metrics = {
      orderCreationCount: 0,
      orderSuccessCount: 0,
      orderFailureCount: 0,
      verificationCount: 0,
      verificationSuccessCount: 0,
      verificationFailureCount: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      razorpayApiCalls: 0,
      razorpayApiFailures: 0,
      databaseOperations: 0,
      databaseFailures: 0,
    };

    this.performanceMetrics = {
      orderCreationTimes: [],
      verificationTimes: [],
      razorpayApiTimes: [],
      databaseTimes: [],
    };

    this.errorTracking = {
      errorCounts: {},
      recentErrors: [],
      maxRecentErrors: 100,
    };

    // Initialize metrics collection interval
    this.startMetricsCollection();
  }

  /**
   * Start metrics collection interval
   */
  startMetricsCollection() {
    // Log metrics summary every 5 minutes
    setInterval(() => {
      this.logMetricsSummary();
    }, 5 * 60 * 1000);

    // Clean up old performance data every hour
    setInterval(() => {
      this.cleanupPerformanceData();
    }, 60 * 60 * 1000);
  }

  /**
   * Log payment order creation start
   */
  logOrderCreationStart(requestId, context) {
    this.metrics.orderCreationCount++;

    const logData = {
      event: "payment_order_creation_start",
      requestId,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      context: this.sanitizeContext(context),
    };

    logger.info("Payment order creation started", logData);
    return logData;
  }

  /**
   * Log payment order creation success
   */
  logOrderCreationSuccess(requestId, duration, result) {
    this.metrics.orderSuccessCount++;
    this.updateProcessingTime(duration);
    this.performanceMetrics.orderCreationTimes.push({
      timestamp: Date.now(),
      duration,
    });

    const logData = {
      event: "payment_order_creation_success",
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      result: {
        orderId: result.order?.id,
        amount: result.order?.amount,
        currency: result.order?.currency,
        planName: result.planDetails?.name,
        userId: result.userDetails?.phone
          ? "[REDACTED]"
          : result.userDetails?.name,
      },
      performance: {
        totalOrdersCreated: this.metrics.orderSuccessCount,
        averageProcessingTime: this.metrics.averageProcessingTime,
        successRate: this.getOrderSuccessRate(),
      },
    };

    logger.info("Payment order creation successful", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("payment_order_success", logData);
    }

    return logData;
  }

  /**
   * Log payment order creation failure
   */
  logOrderCreationFailure(requestId, duration, error, context) {
    this.metrics.orderFailureCount++;
    this.updateProcessingTime(duration);
    this.trackError(error, "order_creation", context);

    const logData = {
      event: "payment_order_creation_failure",
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name,
        stack: error.stack,
      },
      context: this.sanitizeContext(context),
      performance: {
        totalOrderAttempts: this.metrics.orderCreationCount,
        failureRate: this.getOrderFailureRate(),
        averageProcessingTime: this.metrics.averageProcessingTime,
      },
    };

    logger.error("Payment order creation failed", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("payment_order_failure", logData);
    }

    return logData;
  }

  /**
   * Log payment verification start
   */
  logVerificationStart(requestId, context) {
    this.metrics.verificationCount++;

    const logData = {
      event: "payment_verification_start",
      requestId,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      context: this.sanitizeContext(context),
    };

    logger.info("Payment verification started", logData);
    return logData;
  }

  /**
   * Log payment verification success
   */
  logVerificationSuccess(requestId, duration, result) {
    this.metrics.verificationSuccessCount++;
    this.updateProcessingTime(duration);
    this.performanceMetrics.verificationTimes.push({
      timestamp: Date.now(),
      duration,
    });

    const logData = {
      event: "payment_verification_success",
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      result: {
        paymentId: result.payment?._id,
        razorpayOrderId: result.razorpayOrderId,
        razorpayPaymentId: result.razorpayPaymentId,
        amount: result.payment?.amount,
        status: result.payment?.status,
      },
      performance: {
        totalVerifications: this.metrics.verificationSuccessCount,
        verificationSuccessRate: this.getVerificationSuccessRate(),
        averageProcessingTime: this.metrics.averageProcessingTime,
      },
    };

    logger.info("Payment verification successful", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("payment_verification_success", logData);
    }

    return logData;
  }

  /**
   * Log payment verification failure
   */
  logVerificationFailure(requestId, duration, error, context) {
    this.metrics.verificationFailureCount++;
    this.updateProcessingTime(duration);
    this.trackError(error, "verification", context);

    const logData = {
      event: "payment_verification_failure",
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name,
        stack: error.stack,
      },
      context: this.sanitizeContext(context),
      performance: {
        totalVerificationAttempts: this.metrics.verificationCount,
        verificationFailureRate: this.getVerificationFailureRate(),
        averageProcessingTime: this.metrics.averageProcessingTime,
      },
    };

    logger.error("Payment verification failed", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("payment_verification_failure", logData);
    }

    return logData;
  }

  /**
   * Log Razorpay API call start
   */
  logRazorpayApiStart(requestId, operation, params) {
    this.metrics.razorpayApiCalls++;

    const logData = {
      event: "razorpay_api_call_start",
      requestId,
      operation,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      params: this.sanitizeContext(params),
    };

    logger.info("Razorpay API call started", logData);
    return logData;
  }

  /**
   * Log Razorpay API call success
   */
  logRazorpayApiSuccess(requestId, operation, duration, response) {
    this.performanceMetrics.razorpayApiTimes.push({
      timestamp: Date.now(),
      duration,
      operation,
    });

    const logData = {
      event: "razorpay_api_call_success",
      requestId,
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      response: {
        id: response.id,
        status: response.status,
        amount: response.amount,
        currency: response.currency,
      },
      performance: {
        totalRazorpayApiCalls: this.metrics.razorpayApiCalls,
        razorpayApiSuccessRate: this.getRazorpayApiSuccessRate(),
        averageRazorpayApiTime: this.getAverageRazorpayApiTime(),
      },
    };

    logger.info("Razorpay API call successful", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("razorpay_api_success", logData);
    }

    return logData;
  }

  /**
   * Log Razorpay API call failure
   */
  logRazorpayApiFailure(requestId, operation, duration, error, context) {
    this.metrics.razorpayApiFailures++;
    this.trackError(error, `razorpay_${operation}`, context);

    this.performanceMetrics.razorpayApiTimes.push({
      timestamp: Date.now(),
      duration,
      operation,
      failed: true,
    });

    const logData = {
      event: "razorpay_api_call_failure",
      requestId,
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        razorpayError: error.error?.code,
        razorpayDescription: error.error?.description,
        stack: error.stack,
      },
      context: this.sanitizeContext(context),
      performance: {
        totalRazorpayApiCalls: this.metrics.razorpayApiCalls,
        razorpayApiFailureRate: this.getRazorpayApiFailureRate(),
        averageRazorpayApiTime: this.getAverageRazorpayApiTime(),
      },
    };

    logger.error("Razorpay API call failed", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("razorpay_api_failure", logData);
    }

    return logData;
  }

  /**
   * Log database operation start
   */
  logDatabaseOperationStart(requestId, operation, params) {
    this.metrics.databaseOperations++;

    const logData = {
      event: "database_operation_start",
      requestId,
      operation,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      params: this.sanitizeContext(params),
    };

    logger.info("Database operation started", logData);
    return logData;
  }

  /**
   * Log database operation success
   */
  logDatabaseOperationSuccess(requestId, operation, duration, result) {
    this.performanceMetrics.databaseTimes.push({
      timestamp: Date.now(),
      duration,
      operation,
    });

    const logData = {
      event: "database_operation_success",
      requestId,
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      result: this.sanitizeContext(result),
      performance: {
        totalDatabaseOperations: this.metrics.databaseOperations,
        databaseSuccessRate: this.getDatabaseSuccessRate(),
        averageDatabaseTime: this.getAverageDatabaseTime(),
      },
    };

    logger.info("Database operation successful", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("database_operation_success", logData);
    }

    return logData;
  }

  /**
   * Log database operation failure
   */
  logDatabaseOperationFailure(requestId, operation, duration, error, context) {
    this.metrics.databaseFailures++;
    this.trackError(error, `database_${operation}`, context);

    this.performanceMetrics.databaseTimes.push({
      timestamp: Date.now(),
      duration,
      operation,
      failed: true,
    });

    const logData = {
      event: "database_operation_failure",
      requestId,
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      },
      context: this.sanitizeContext(context),
      performance: {
        totalDatabaseOperations: this.metrics.databaseOperations,
        databaseFailureRate: this.getDatabaseFailureRate(),
        averageDatabaseTime: this.getAverageDatabaseTime(),
      },
    };

    logger.error("Database operation failed", logData);

    // Emit event to monitoring service
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.emit("database_operation_failure", logData);
    }

    return logData;
  }

  /**
   * Track error for analytics
   */
  trackError(error, operation, context) {
    const errorKey = `${operation}_${error.code || error.name}`;

    if (!this.errorTracking.errorCounts[errorKey]) {
      this.errorTracking.errorCounts[errorKey] = 0;
    }
    this.errorTracking.errorCounts[errorKey]++;

    // Add to recent errors
    this.errorTracking.recentErrors.push({
      timestamp: new Date().toISOString(),
      operation,
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
      },
      context: this.sanitizeContext(context),
    });

    // Keep only recent errors
    if (
      this.errorTracking.recentErrors.length >
      this.errorTracking.maxRecentErrors
    ) {
      this.errorTracking.recentErrors = this.errorTracking.recentErrors.slice(
        -this.errorTracking.maxRecentErrors
      );
    }
  }

  /**
   * Update processing time metrics
   */
  updateProcessingTime(duration) {
    this.metrics.totalProcessingTime += duration;
    const totalOperations =
      this.metrics.orderCreationCount + this.metrics.verificationCount;
    this.metrics.averageProcessingTime =
      totalOperations > 0
        ? Math.round(this.metrics.totalProcessingTime / totalOperations)
        : 0;
  }

  /**
   * Get order success rate
   */
  getOrderSuccessRate() {
    if (this.metrics.orderCreationCount === 0) return 0;
    return (
      (this.metrics.orderSuccessCount / this.metrics.orderCreationCount) *
      100
    ).toFixed(2);
  }

  /**
   * Get order failure rate
   */
  getOrderFailureRate() {
    if (this.metrics.orderCreationCount === 0) return 0;
    return (
      (this.metrics.orderFailureCount / this.metrics.orderCreationCount) *
      100
    ).toFixed(2);
  }

  /**
   * Get verification success rate
   */
  getVerificationSuccessRate() {
    if (this.metrics.verificationCount === 0) return 0;
    return (
      (this.metrics.verificationSuccessCount / this.metrics.verificationCount) *
      100
    ).toFixed(2);
  }

  /**
   * Get verification failure rate
   */
  getVerificationFailureRate() {
    if (this.metrics.verificationCount === 0) return 0;
    return (
      (this.metrics.verificationFailureCount / this.metrics.verificationCount) *
      100
    ).toFixed(2);
  }

  /**
   * Get Razorpay API success rate
   */
  getRazorpayApiSuccessRate() {
    if (this.metrics.razorpayApiCalls === 0) return 0;
    const successCount =
      this.metrics.razorpayApiCalls - this.metrics.razorpayApiFailures;
    return ((successCount / this.metrics.razorpayApiCalls) * 100).toFixed(2);
  }

  /**
   * Get Razorpay API failure rate
   */
  getRazorpayApiFailureRate() {
    if (this.metrics.razorpayApiCalls === 0) return 0;
    return (
      (this.metrics.razorpayApiFailures / this.metrics.razorpayApiCalls) *
      100
    ).toFixed(2);
  }

  /**
   * Get database success rate
   */
  getDatabaseSuccessRate() {
    if (this.metrics.databaseOperations === 0) return 0;
    const successCount =
      this.metrics.databaseOperations - this.metrics.databaseFailures;
    return ((successCount / this.metrics.databaseOperations) * 100).toFixed(2);
  }

  /**
   * Get database failure rate
   */
  getDatabaseFailureRate() {
    if (this.metrics.databaseOperations === 0) return 0;
    return (
      (this.metrics.databaseFailures / this.metrics.databaseOperations) *
      100
    ).toFixed(2);
  }

  /**
   * Get average Razorpay API time
   */
  getAverageRazorpayApiTime() {
    const recentTimes = this.performanceMetrics.razorpayApiTimes.slice(-100);
    if (recentTimes.length === 0) return 0;
    const total = recentTimes.reduce((sum, item) => sum + item.duration, 0);
    return Math.round(total / recentTimes.length);
  }

  /**
   * Get average database time
   */
  getAverageDatabaseTime() {
    const recentTimes = this.performanceMetrics.databaseTimes.slice(-100);
    if (recentTimes.length === 0) return 0;
    const total = recentTimes.reduce((sum, item) => sum + item.duration, 0);
    return Math.round(total / recentTimes.length);
  }

  /**
   * Sanitize context for logging (remove sensitive data)
   */
  sanitizeContext(context) {
    if (!context || typeof context !== "object") return context;

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "signature",
      "razorpaySignature",
      "razorpayKeySecret",
      "phone",
      "email",
    ];

    const sanitized = { ...context };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (
            sensitiveFields.some((field) =>
              key.toLowerCase().includes(field.toLowerCase())
            )
          ) {
            obj[key] = "[REDACTED]";
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    const summary = {
      event: "payment_metrics_summary",
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      metrics: {
        orders: {
          total: this.metrics.orderCreationCount,
          successful: this.metrics.orderSuccessCount,
          failed: this.metrics.orderFailureCount,
          successRate: this.getOrderSuccessRate() + "%",
        },
        verifications: {
          total: this.metrics.verificationCount,
          successful: this.metrics.verificationSuccessCount,
          failed: this.metrics.verificationFailureCount,
          successRate: this.getVerificationSuccessRate() + "%",
        },
        razorpayApi: {
          total: this.metrics.razorpayApiCalls,
          failed: this.metrics.razorpayApiFailures,
          successRate: this.getRazorpayApiSuccessRate() + "%",
          averageTime: this.getAverageRazorpayApiTime() + "ms",
        },
        database: {
          total: this.metrics.databaseOperations,
          failed: this.metrics.databaseFailures,
          successRate: this.getDatabaseSuccessRate() + "%",
          averageTime: this.getAverageDatabaseTime() + "ms",
        },
        performance: {
          averageProcessingTime: this.metrics.averageProcessingTime + "ms",
          totalProcessingTime: this.metrics.totalProcessingTime + "ms",
        },
        errors: {
          totalErrorTypes: Object.keys(this.errorTracking.errorCounts).length,
          recentErrorsCount: this.errorTracking.recentErrors.length,
          topErrors: this.getTopErrors(5),
        },
      },
    };

    logger.info("Payment metrics summary", summary);
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(limit = 5) {
    return Object.entries(this.errorTracking.errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Clean up old performance data
   */
  cleanupPerformanceData() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Keep only last hour of performance data
    this.performanceMetrics.orderCreationTimes =
      this.performanceMetrics.orderCreationTimes.filter(
        (item) => item.timestamp > oneHourAgo
      );

    this.performanceMetrics.verificationTimes =
      this.performanceMetrics.verificationTimes.filter(
        (item) => item.timestamp > oneHourAgo
      );

    this.performanceMetrics.razorpayApiTimes =
      this.performanceMetrics.razorpayApiTimes.filter(
        (item) => item.timestamp > oneHourAgo
      );

    this.performanceMetrics.databaseTimes =
      this.performanceMetrics.databaseTimes.filter(
        (item) => item.timestamp > oneHourAgo
      );

    logger.info("Performance data cleanup completed", {
      event: "performance_data_cleanup",
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  }

  /**
   * Get current metrics snapshot
   */
  getMetricsSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      metrics: { ...this.metrics },
      performance: {
        averageRazorpayApiTime: this.getAverageRazorpayApiTime(),
        averageDatabaseTime: this.getAverageDatabaseTime(),
      },
      successRates: {
        orderSuccessRate: this.getOrderSuccessRate(),
        verificationSuccessRate: this.getVerificationSuccessRate(),
        razorpayApiSuccessRate: this.getRazorpayApiSuccessRate(),
        databaseSuccessRate: this.getDatabaseSuccessRate(),
      },
      errorSummary: {
        totalErrorTypes: Object.keys(this.errorTracking.errorCounts).length,
        recentErrorsCount: this.errorTracking.recentErrors.length,
        topErrors: this.getTopErrors(10),
      },
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics() {
    this.metrics = {
      orderCreationCount: 0,
      orderSuccessCount: 0,
      orderFailureCount: 0,
      verificationCount: 0,
      verificationSuccessCount: 0,
      verificationFailureCount: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      razorpayApiCalls: 0,
      razorpayApiFailures: 0,
      databaseOperations: 0,
      databaseFailures: 0,
    };

    this.performanceMetrics = {
      orderCreationTimes: [],
      verificationTimes: [],
      razorpayApiTimes: [],
      databaseTimes: [],
    };

    this.errorTracking = {
      errorCounts: {},
      recentErrors: [],
      maxRecentErrors: 100,
    };

    logger.info("Payment metrics reset", {
      event: "payment_metrics_reset",
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  }

  /**
   * Log Razorpay API warning when operation takes longer than expected
   */
  logRazorpayApiWarning(requestId, operation, warningInfo) {
    logger.warn("Razorpay API operation warning", {
      requestId,
      operation,
      duration: warningInfo.duration,
      warningThreshold: warningInfo.warningThreshold,
      expectedTimeout: warningInfo.expectedTimeout,
      userMessage: warningInfo.userMessage,
      timestamp: new Date().toISOString(),
      category: "payment_warning",
    });

    // Update metrics
    this.metrics.razorpayApiWarnings =
      (this.metrics.razorpayApiWarnings || 0) + 1;

    // Send to monitoring if available
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.recordWarning("razorpay_api_slow", {
        operation,
        duration: warningInfo.duration,
        threshold: warningInfo.warningThreshold,
      });
    }
  }

  /**
   * Log Razorpay API timeout
   */
  logRazorpayApiTimeout(requestId, operation, timeoutInfo) {
    logger.error("Razorpay API operation timeout", {
      requestId,
      operation,
      duration: timeoutInfo.duration,
      timeout: timeoutInfo.timeout,
      userMessage: timeoutInfo.userMessage,
      wasWarningTriggered: timeoutInfo.wasWarningTriggered,
      timestamp: new Date().toISOString(),
      category: "payment_timeout",
      severity: "high",
    });

    // Update metrics
    this.metrics.razorpayApiTimeouts =
      (this.metrics.razorpayApiTimeouts || 0) + 1;

    // Send to monitoring if available
    const monitoring = initMonitoring();
    if (monitoring) {
      monitoring.recordTimeout("razorpay_api", {
        operation,
        duration: timeoutInfo.duration,
        timeout: timeoutInfo.timeout,
      });
    }
  }

  /**
   * Log retry attempt
   */
  logRetryAttempt(operationId, retryInfo) {
    logger.info("Operation retry attempt", {
      operationId,
      operationName: retryInfo.operationName,
      attempt: retryInfo.attempt,
      maxRetries: retryInfo.maxRetries,
      timeout: retryInfo.timeout,
      context: retryInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_retry",
    });

    // Update metrics
    this.metrics.retryAttempts = (this.metrics.retryAttempts || 0) + 1;
  }

  /**
   * Log retry success
   */
  logRetrySuccess(operationId, successInfo) {
    logger.info("Operation retry success", {
      operationId,
      operationName: successInfo.operationName,
      attempt: successInfo.attempt,
      duration: successInfo.duration,
      totalDuration: successInfo.totalDuration,
      timestamp: new Date().toISOString(),
      category: "payment_retry_success",
    });

    // Update metrics
    this.metrics.retrySuccesses = (this.metrics.retrySuccesses || 0) + 1;
  }

  /**
   * Log retry failure
   */
  logRetryFailure(operationId, failureInfo) {
    logger.error("Operation retry failure", {
      operationId,
      operationName: failureInfo.operationName,
      attempt: failureInfo.attempt,
      maxRetries: failureInfo.maxRetries,
      error: failureInfo.error,
      errorCode: failureInfo.errorCode,
      statusCode: failureInfo.statusCode,
      duration: failureInfo.duration,
      isTimeout: failureInfo.isTimeout,
      timestamp: new Date().toISOString(),
      category: "payment_retry_failure",
    });

    // Update metrics
    this.metrics.retryFailures = (this.metrics.retryFailures || 0) + 1;
  }

  /**
   * Log retry delay
   */
  logRetryDelay(operationId, delayInfo) {
    logger.info("Operation retry delay", {
      operationId,
      operationName: delayInfo.operationName,
      attempt: delayInfo.attempt,
      retryDelay: delayInfo.retryDelay,
      reason: delayInfo.reason,
      timestamp: new Date().toISOString(),
      category: "payment_retry_delay",
    });
  }

  /**
   * Log fallback execution
   */
  logFallbackExecution(operationId, fallbackInfo) {
    logger.warn("Operation fallback execution", {
      operationId,
      operationName: fallbackInfo.operationName,
      errorType: fallbackInfo.errorType,
      fallbackAction: fallbackInfo.fallbackAction,
      error: fallbackInfo.error,
      context: fallbackInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_fallback",
    });

    // Update metrics
    this.metrics.fallbackExecutions =
      (this.metrics.fallbackExecutions || 0) + 1;
  }

  /**
   * Log fallback failure
   */
  logFallbackFailure(operationId, failureInfo) {
    logger.error("Operation fallback failure", {
      operationId,
      operationName: failureInfo.operationName,
      fallbackAction: failureInfo.fallbackAction,
      error: failureInfo.error,
      originalError: failureInfo.originalError,
      timestamp: new Date().toISOString(),
      category: "payment_fallback_failure",
      severity: "critical",
    });

    // Update metrics
    this.metrics.fallbackFailures = (this.metrics.fallbackFailures || 0) + 1;
  }

  /**
   * Log operation queued
   */
  logOperationQueued(queueId, queueInfo) {
    logger.info("Operation queued for retry", {
      queueId,
      operationName: queueInfo.operationName,
      error: queueInfo.error,
      retryAfter: queueInfo.retryAfter,
      timestamp: new Date().toISOString(),
      category: "payment_queue",
    });

    // Update metrics
    this.metrics.operationsQueued = (this.metrics.operationsQueued || 0) + 1;
  }

  /**
   * Log admin notification
   */
  logAdminNotification(notification) {
    logger.error("Admin notification sent", {
      type: notification.type,
      operationName: notification.operationName,
      error: notification.error,
      context: notification.context,
      severity: notification.severity,
      timestamp: notification.timestamp,
      category: "payment_admin_notification",
    });

    // Update metrics
    this.metrics.adminNotifications =
      (this.metrics.adminNotifications || 0) + 1;
  }

  /**
   * Log queued operation success
   */
  logQueuedOperationSuccess(queueId, successInfo) {
    logger.info("Queued operation success", {
      queueId,
      operationName: successInfo.operationName,
      attempts: successInfo.attempts,
      timestamp: new Date().toISOString(),
      category: "payment_queue_success",
    });

    // Update metrics
    this.metrics.queuedOperationSuccesses =
      (this.metrics.queuedOperationSuccesses || 0) + 1;
  }

  /**
   * Log queued operation failure
   */
  logQueuedOperationFailure(queueId, failureInfo) {
    logger.error("Queued operation failure", {
      queueId,
      operationName: failureInfo.operationName,
      attempts: failureInfo.attempts,
      error: failureInfo.error,
      timestamp: new Date().toISOString(),
      category: "payment_queue_failure",
    });

    // Update metrics
    this.metrics.queuedOperationFailures =
      (this.metrics.queuedOperationFailures || 0) + 1;
  }

  /**
   * Log timeout operation start
   */
  logTimeoutOperationStart(operationId, operationInfo) {
    logger.info("Timeout operation started", {
      operationId,
      operationType: operationInfo.operationType,
      timeout: operationInfo.timeout,
      warningThreshold: operationInfo.warningThreshold,
      context: operationInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_operation",
    });
  }

  /**
   * Log timeout operation success
   */
  logTimeoutOperationSuccess(operationId, successInfo) {
    logger.info("Timeout operation success", {
      operationId,
      operationType: successInfo.operationType,
      duration: successInfo.duration,
      wasWarningTriggered: successInfo.wasWarningTriggered,
      context: successInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_success",
    });

    // Update performance metrics
    if (successInfo.operationType === "RAZORPAY_ORDER_CREATION") {
      this.performanceMetrics.orderCreationTimes.push(successInfo.duration);
    }
  }

  /**
   * Log timeout operation failure
   */
  logTimeoutOperationFailure(operationId, failureInfo) {
    logger.error("Timeout operation failure", {
      operationId,
      operationType: failureInfo.operationType,
      duration: failureInfo.duration,
      error: failureInfo.error,
      isTimeout: failureInfo.isTimeout,
      context: failureInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_failure",
    });
  }

  /**
   * Log timeout warning
   */
  logTimeoutWarning(operationId, warningInfo) {
    logger.warn("Timeout operation warning", {
      operationId,
      operationType: warningInfo.operationType,
      duration: warningInfo.duration,
      warningThreshold: warningInfo.warningThreshold,
      expectedTimeout: warningInfo.expectedTimeout,
      userMessage: warningInfo.userMessage,
      context: warningInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_warning",
    });
  }

  /**
   * Log timeout occurred
   */
  logTimeoutOccurred(operationId, timeoutInfo) {
    logger.error("Operation timeout occurred", {
      operationId,
      operationType: timeoutInfo.operationType,
      duration: timeoutInfo.duration,
      timeout: timeoutInfo.timeout,
      userMessage: timeoutInfo.userMessage,
      wasWarningTriggered: timeoutInfo.wasWarningTriggered,
      context: timeoutInfo.context,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_occurred",
      severity: "high",
    });

    // Update metrics
    this.metrics.timeoutOccurrences =
      (this.metrics.timeoutOccurrences || 0) + 1;
  }

  /**
   * Log timeout operation cancelled
   */
  logTimeoutOperationCancelled(operationId) {
    logger.info("Timeout operation cancelled", {
      operationId,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_cancelled",
    });
  }

  /**
   * Log timeout extended
   */
  logTimeoutExtended(operationId, extensionInfo) {
    logger.info("Operation timeout extended", {
      operationId,
      additionalTime: extensionInfo.additionalTime,
      newTimeout: extensionInfo.newTimeout,
      timestamp: new Date().toISOString(),
      category: "payment_timeout_extended",
    });
  }
}

export const paymentLogger = new PaymentLogger();
export default paymentLogger;
