import { EventEmitter } from "events";
import logger from "../utils/logger.js";
import { paymentLogger } from "./paymentLogger.js";
import { config } from "../config/environment.js";

/**
 * Payment Monitoring Service
 * Provides real-time monitoring, alerting, and health checks for payment operations
 */

class PaymentMonitoring extends EventEmitter {
  constructor() {
    super();

    this.healthStatus = {
      overall: "healthy",
      components: {
        razorpayApi: "healthy",
        database: "healthy",
        paymentProcessing: "healthy",
      },
      lastHealthCheck: new Date().toISOString(),
    };

    this.alerts = {
      active: [],
      resolved: [],
      thresholds: {
        errorRate: 10, // 10% error rate threshold
        responseTime: 5000, // 5 second response time threshold
        failureCount: 5, // 5 consecutive failures
        lowSuccessRate: 80, // 80% success rate threshold
      },
    };

    this.monitoring = {
      enabled: true,
      intervals: {
        healthCheck: 60000, // 1 minute
        metricsCollection: 30000, // 30 seconds
        alertEvaluation: 15000, // 15 seconds
      },
    };

    this.consecutiveFailures = {
      orderCreation: 0,
      verification: 0,
      razorpayApi: 0,
      database: 0,
    };

    // Start monitoring
    this.startMonitoring();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Start monitoring services
   */
  startMonitoring() {
    if (!this.monitoring.enabled) return;

    // Health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.monitoring.intervals.healthCheck);

    // Metrics collection interval
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.monitoring.intervals.metricsCollection);

    // Alert evaluation interval
    this.alertInterval = setInterval(() => {
      this.evaluateAlerts();
    }, this.monitoring.intervals.alertEvaluation);

    logger.info("Payment monitoring started", {
      event: "monitoring_started",
      intervals: this.monitoring.intervals,
      thresholds: this.alerts.thresholds,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop monitoring services
   */
  stopMonitoring() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.alertInterval) clearInterval(this.alertInterval);

    this.monitoring.enabled = false;

    logger.info("Payment monitoring stopped", {
      event: "monitoring_stopped",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set up event listeners for payment events
   */
  setupEventListeners() {
    // Listen for payment events from payment logger
    this.on("payment_order_success", (data) => {
      this.consecutiveFailures.orderCreation = 0;
      this.updateComponentHealth("paymentProcessing", "healthy");
    });

    this.on("payment_order_failure", (data) => {
      this.consecutiveFailures.orderCreation++;
      this.checkConsecutiveFailures("orderCreation", data);
    });

    this.on("payment_verification_success", (data) => {
      this.consecutiveFailures.verification = 0;
      this.updateComponentHealth("paymentProcessing", "healthy");
    });

    this.on("payment_verification_failure", (data) => {
      this.consecutiveFailures.verification++;
      this.checkConsecutiveFailures("verification", data);
    });

    this.on("razorpay_api_success", (data) => {
      this.consecutiveFailures.razorpayApi = 0;
      this.updateComponentHealth("razorpayApi", "healthy");
    });

    this.on("razorpay_api_failure", (data) => {
      this.consecutiveFailures.razorpayApi++;
      this.checkConsecutiveFailures("razorpayApi", data);
    });

    this.on("database_operation_success", (data) => {
      this.consecutiveFailures.database = 0;
      this.updateComponentHealth("database", "healthy");
    });

    this.on("database_operation_failure", (data) => {
      this.consecutiveFailures.database++;
      this.checkConsecutiveFailures("database", data);
    });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthCheckStart = Date.now();

    try {
      // Get current metrics
      const metrics = paymentLogger.getMetricsSnapshot();

      // Check overall system health
      const healthChecks = {
        paymentProcessing: this.checkPaymentProcessingHealth(metrics),
        razorpayApi: this.checkRazorpayApiHealth(metrics),
        database: this.checkDatabaseHealth(metrics),
        performance: this.checkPerformanceHealth(metrics),
      };

      // Update component health status
      Object.entries(healthChecks).forEach(([component, status]) => {
        this.updateComponentHealth(component, status);
      });

      // Determine overall health
      const unhealthyComponents = Object.values(
        this.healthStatus.components
      ).filter((status) => status !== "healthy");

      this.healthStatus.overall =
        unhealthyComponents.length === 0
          ? "healthy"
          : unhealthyComponents.length === 1
          ? "degraded"
          : "unhealthy";

      this.healthStatus.lastHealthCheck = new Date().toISOString();

      const healthCheckDuration = Date.now() - healthCheckStart;

      logger.info("Health check completed", {
        event: "health_check_completed",
        duration: `${healthCheckDuration}ms`,
        overallHealth: this.healthStatus.overall,
        componentHealth: this.healthStatus.components,
        consecutiveFailures: this.consecutiveFailures,
        timestamp: new Date().toISOString(),
      });

      // Emit health check event
      this.emit("health_check_completed", {
        status: this.healthStatus,
        duration: healthCheckDuration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const healthCheckDuration = Date.now() - healthCheckStart;

      logger.error("Health check failed", {
        event: "health_check_failed",
        duration: `${healthCheckDuration}ms`,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      this.healthStatus.overall = "unhealthy";
      this.healthStatus.lastHealthCheck = new Date().toISOString();
    }
  }

  /**
   * Check payment processing health
   */
  checkPaymentProcessingHealth(metrics) {
    const orderSuccessRate = parseFloat(metrics.successRates.orderSuccessRate);
    const verificationSuccessRate = parseFloat(
      metrics.successRates.verificationSuccessRate
    );

    if (
      orderSuccessRate < this.alerts.thresholds.lowSuccessRate ||
      verificationSuccessRate < this.alerts.thresholds.lowSuccessRate
    ) {
      return "unhealthy";
    }

    if (
      this.consecutiveFailures.orderCreation >=
        this.alerts.thresholds.failureCount ||
      this.consecutiveFailures.verification >=
        this.alerts.thresholds.failureCount
    ) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Check Razorpay API health
   */
  checkRazorpayApiHealth(metrics) {
    const apiSuccessRate = parseFloat(
      metrics.successRates.razorpayApiSuccessRate
    );
    const avgApiTime = metrics.performance.averageRazorpayApiTime;

    if (apiSuccessRate < this.alerts.thresholds.lowSuccessRate) {
      return "unhealthy";
    }

    if (
      avgApiTime > this.alerts.thresholds.responseTime ||
      this.consecutiveFailures.razorpayApi >=
        this.alerts.thresholds.failureCount
    ) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Check database health
   */
  checkDatabaseHealth(metrics) {
    const dbSuccessRate = parseFloat(metrics.successRates.databaseSuccessRate);
    const avgDbTime = metrics.performance.averageDatabaseTime;

    if (dbSuccessRate < this.alerts.thresholds.lowSuccessRate) {
      return "unhealthy";
    }

    if (
      avgDbTime > this.alerts.thresholds.responseTime ||
      this.consecutiveFailures.database >= this.alerts.thresholds.failureCount
    ) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Check performance health
   */
  checkPerformanceHealth(metrics) {
    const avgProcessingTime = metrics.metrics.averageProcessingTime;

    if (avgProcessingTime > this.alerts.thresholds.responseTime * 2) {
      return "unhealthy";
    }

    if (avgProcessingTime > this.alerts.thresholds.responseTime) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Update component health status
   */
  updateComponentHealth(component, status) {
    const previousStatus = this.healthStatus.components[component];
    this.healthStatus.components[component] = status;

    if (previousStatus !== status) {
      logger.info("Component health status changed", {
        event: "component_health_changed",
        component,
        previousStatus,
        newStatus: status,
        timestamp: new Date().toISOString(),
      });

      this.emit("component_health_changed", {
        component,
        previousStatus,
        newStatus: status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check consecutive failures and trigger alerts
   */
  checkConsecutiveFailures(type, data) {
    const failureCount = this.consecutiveFailures[type];

    if (failureCount >= this.alerts.thresholds.failureCount) {
      this.createAlert({
        type: "consecutive_failures",
        severity: "HIGH",
        component: type,
        message: `${failureCount} consecutive failures detected in ${type}`,
        data,
        threshold: this.alerts.thresholds.failureCount,
        actualValue: failureCount,
      });
    }
  }

  /**
   * Collect and analyze metrics
   */
  collectMetrics() {
    try {
      const metrics = paymentLogger.getMetricsSnapshot();

      // Log metrics for analysis
      logger.info("Payment metrics collected", {
        event: "metrics_collected",
        metrics: {
          orders: {
            total: metrics.metrics.orderCreationCount,
            successful: metrics.metrics.orderSuccessCount,
            failed: metrics.metrics.orderFailureCount,
            successRate: metrics.successRates.orderSuccessRate,
          },
          verifications: {
            total: metrics.metrics.verificationCount,
            successful: metrics.metrics.verificationSuccessCount,
            failed: metrics.metrics.verificationFailureCount,
            successRate: metrics.successRates.verificationSuccessRate,
          },
          performance: {
            averageProcessingTime: metrics.metrics.averageProcessingTime,
            averageRazorpayApiTime: metrics.performance.averageRazorpayApiTime,
            averageDatabaseTime: metrics.performance.averageDatabaseTime,
          },
          errors: {
            totalErrorTypes: metrics.errorSummary.totalErrorTypes,
            recentErrorsCount: metrics.errorSummary.recentErrorsCount,
          },
        },
        timestamp: new Date().toISOString(),
      });

      // Emit metrics event
      this.emit("metrics_collected", {
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to collect metrics", {
        event: "metrics_collection_failed",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Evaluate alerts based on current metrics
   */
  evaluateAlerts() {
    try {
      const metrics = paymentLogger.getMetricsSnapshot();

      // Check error rate thresholds
      this.checkErrorRateThresholds(metrics);

      // Check response time thresholds
      this.checkResponseTimeThresholds(metrics);

      // Check success rate thresholds
      this.checkSuccessRateThresholds(metrics);

      // Resolve alerts that are no longer active
      this.resolveInactiveAlerts(metrics);
    } catch (error) {
      logger.error("Alert evaluation failed", {
        event: "alert_evaluation_failed",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check error rate thresholds
   */
  checkErrorRateThresholds(metrics) {
    const orderFailureRate = parseFloat(metrics.successRates.orderSuccessRate);
    const verificationFailureRate = parseFloat(
      metrics.successRates.verificationSuccessRate
    );

    if (100 - orderFailureRate > this.alerts.thresholds.errorRate) {
      this.createAlert({
        type: "high_error_rate",
        severity: "HIGH",
        component: "order_creation",
        message: `Order creation error rate is ${100 - orderFailureRate}%`,
        threshold: this.alerts.thresholds.errorRate,
        actualValue: 100 - orderFailureRate,
      });
    }

    if (100 - verificationFailureRate > this.alerts.thresholds.errorRate) {
      this.createAlert({
        type: "high_error_rate",
        severity: "HIGH",
        component: "verification",
        message: `Payment verification error rate is ${
          100 - verificationFailureRate
        }%`,
        threshold: this.alerts.thresholds.errorRate,
        actualValue: 100 - verificationFailureRate,
      });
    }
  }

  /**
   * Check response time thresholds
   */
  checkResponseTimeThresholds(metrics) {
    const avgProcessingTime = metrics.metrics.averageProcessingTime;
    const avgRazorpayTime = metrics.performance.averageRazorpayApiTime;
    const avgDatabaseTime = metrics.performance.averageDatabaseTime;

    if (avgProcessingTime > this.alerts.thresholds.responseTime) {
      this.createAlert({
        type: "slow_response_time",
        severity: "MEDIUM",
        component: "payment_processing",
        message: `Average processing time is ${avgProcessingTime}ms`,
        threshold: this.alerts.thresholds.responseTime,
        actualValue: avgProcessingTime,
      });
    }

    if (avgRazorpayTime > this.alerts.thresholds.responseTime) {
      this.createAlert({
        type: "slow_response_time",
        severity: "MEDIUM",
        component: "razorpay_api",
        message: `Average Razorpay API time is ${avgRazorpayTime}ms`,
        threshold: this.alerts.thresholds.responseTime,
        actualValue: avgRazorpayTime,
      });
    }

    if (avgDatabaseTime > this.alerts.thresholds.responseTime) {
      this.createAlert({
        type: "slow_response_time",
        severity: "MEDIUM",
        component: "database",
        message: `Average database time is ${avgDatabaseTime}ms`,
        threshold: this.alerts.thresholds.responseTime,
        actualValue: avgDatabaseTime,
      });
    }
  }

  /**
   * Check success rate thresholds
   */
  checkSuccessRateThresholds(metrics) {
    const orderSuccessRate = parseFloat(metrics.successRates.orderSuccessRate);
    const verificationSuccessRate = parseFloat(
      metrics.successRates.verificationSuccessRate
    );
    const razorpaySuccessRate = parseFloat(
      metrics.successRates.razorpayApiSuccessRate
    );
    const databaseSuccessRate = parseFloat(
      metrics.successRates.databaseSuccessRate
    );

    if (orderSuccessRate < this.alerts.thresholds.lowSuccessRate) {
      this.createAlert({
        type: "low_success_rate",
        severity: "HIGH",
        component: "order_creation",
        message: `Order creation success rate is ${orderSuccessRate}%`,
        threshold: this.alerts.thresholds.lowSuccessRate,
        actualValue: orderSuccessRate,
      });
    }

    if (verificationSuccessRate < this.alerts.thresholds.lowSuccessRate) {
      this.createAlert({
        type: "low_success_rate",
        severity: "HIGH",
        component: "verification",
        message: `Payment verification success rate is ${verificationSuccessRate}%`,
        threshold: this.alerts.thresholds.lowSuccessRate,
        actualValue: verificationSuccessRate,
      });
    }

    if (razorpaySuccessRate < this.alerts.thresholds.lowSuccessRate) {
      this.createAlert({
        type: "low_success_rate",
        severity: "HIGH",
        component: "razorpay_api",
        message: `Razorpay API success rate is ${razorpaySuccessRate}%`,
        threshold: this.alerts.thresholds.lowSuccessRate,
        actualValue: razorpaySuccessRate,
      });
    }

    if (databaseSuccessRate < this.alerts.thresholds.lowSuccessRate) {
      this.createAlert({
        type: "low_success_rate",
        severity: "HIGH",
        component: "database",
        message: `Database success rate is ${databaseSuccessRate}%`,
        threshold: this.alerts.thresholds.lowSuccessRate,
        actualValue: databaseSuccessRate,
      });
    }
  }

  /**
   * Create new alert
   */
  createAlert(alertData) {
    const alertId = `${alertData.type}_${alertData.component}_${Date.now()}`;

    // Check if similar alert already exists
    const existingAlert = this.alerts.active.find(
      (alert) =>
        alert.type === alertData.type && alert.component === alertData.component
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.count = (existingAlert.count || 1) + 1;
      existingAlert.lastOccurrence = new Date().toISOString();
      existingAlert.actualValue = alertData.actualValue;
      return;
    }

    const alert = {
      id: alertId,
      ...alertData,
      createdAt: new Date().toISOString(),
      lastOccurrence: new Date().toISOString(),
      count: 1,
      status: "active",
    };

    this.alerts.active.push(alert);

    logger.warn("Payment alert created", {
      event: "alert_created",
      alert,
      timestamp: new Date().toISOString(),
    });

    this.emit("alert_created", alert);
  }

  /**
   * Resolve inactive alerts
   */
  resolveInactiveAlerts(metrics) {
    const now = Date.now();
    const alertTimeout = 5 * 60 * 1000; // 5 minutes

    this.alerts.active = this.alerts.active.filter((alert) => {
      const alertAge = now - new Date(alert.lastOccurrence).getTime();

      if (alertAge > alertTimeout) {
        // Move to resolved alerts
        alert.status = "resolved";
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedReason = "timeout";

        this.alerts.resolved.push(alert);

        logger.info("Payment alert resolved", {
          event: "alert_resolved",
          alert,
          reason: "timeout",
          timestamp: new Date().toISOString(),
        });

        this.emit("alert_resolved", alert);

        return false; // Remove from active alerts
      }

      return true; // Keep in active alerts
    });

    // Limit resolved alerts history
    if (this.alerts.resolved.length > 100) {
      this.alerts.resolved = this.alerts.resolved.slice(-100);
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus() {
    return {
      monitoring: this.monitoring,
      health: this.healthStatus,
      alerts: {
        active: this.alerts.active,
        resolved: this.alerts.resolved.slice(-10), // Last 10 resolved alerts
        thresholds: this.alerts.thresholds,
      },
      consecutiveFailures: this.consecutiveFailures,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.alerts.thresholds = {
      ...this.alerts.thresholds,
      ...newThresholds,
    };

    logger.info("Alert thresholds updated", {
      event: "thresholds_updated",
      newThresholds: this.alerts.thresholds,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    const activeCount = this.alerts.active.length;

    this.alerts.active.forEach((alert) => {
      alert.status = "resolved";
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedReason = "manual_clear";
      this.alerts.resolved.push(alert);
    });

    this.alerts.active = [];

    logger.info("All alerts cleared", {
      event: "alerts_cleared",
      clearedCount: activeCount,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instance
export const paymentMonitoring = new PaymentMonitoring();
export default paymentMonitoring;
