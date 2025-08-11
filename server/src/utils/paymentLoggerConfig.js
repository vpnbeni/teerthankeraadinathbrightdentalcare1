import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "../config/environment.js";

/**
 * Payment Logger Configuration
 * Specialized logging configuration for payment operations
 */

// Create payment-specific logger with enhanced formatting
const paymentLoggerFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    // Enhanced formatting for payment logs
    const logEntry = {
      timestamp,
      level,
      message,
      service: "payment",
      environment: config.NODE_ENV,
      ...meta,
    };

    // Add correlation tracking
    if (meta.requestId) {
      logEntry.correlationId = meta.requestId;
    }

    // Add performance metrics
    if (meta.duration) {
      logEntry.performance = {
        duration: meta.duration,
        slow: parseInt(meta.duration) > 5000, // Mark as slow if > 5 seconds
      };
    }

    // Add error classification
    if (level === "error" && meta.error) {
      logEntry.errorClassification = {
        type: meta.error.code || meta.error.name || "UNKNOWN_ERROR",
        retryable: meta.error.retryable || false,
        severity: meta.error.statusCode >= 500 ? "HIGH" : "MEDIUM",
      };
    }

    return JSON.stringify(logEntry);
  })
);

// Payment-specific transports
const paymentTransports = [
  // Console transport for development
  new winston.transports.Console({
    level: config.NODE_ENV === "development" ? "debug" : "info",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf((info) => {
        const { timestamp, level, message, requestId, event, duration } = info;
        let logMessage = `${timestamp} ${level}: ${message}`;

        if (requestId) {
          logMessage += ` [${requestId}]`;
        }

        if (event) {
          logMessage += ` (${event})`;
        }

        if (duration) {
          logMessage += ` - ${duration}`;
        }

        return logMessage;
      })
    ),
  }),
];

// Only add file transports in non-serverless environments
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTIONS_WORKER_RUNTIME;

if (!isServerless) {
  paymentTransports.push(
    // Payment operations log
    new DailyRotateFile({
      filename: "logs/payment-operations-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      handleExceptions: true,
      json: true,
      maxSize: "50m",
      maxFiles: "30d",
      format: paymentLoggerFormat,
    }),

    // Payment errors log
    new DailyRotateFile({
      filename: "logs/payment-errors-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      handleExceptions: true,
      json: true,
      maxSize: "50m",
      maxFiles: "90d", // Keep error logs longer
      format: paymentLoggerFormat,
    }),

    // Payment metrics log
    new DailyRotateFile({
      filename: "logs/payment-metrics-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      handleExceptions: false,
      json: true,
      maxSize: "20m",
      maxFiles: "7d",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          // Only log metrics-related entries
          if (info.event && info.event.includes("metrics")) {
            return JSON.stringify({
              timestamp: info.timestamp,
              event: info.event,
              metrics: info.metrics,
              performance: info.performance,
              environment: config.NODE_ENV,
            });
          }
          return null;
        }),
        winston.format.filter((info) => info.message !== null)
      ),
    }),

    // Payment analytics log
    new DailyRotateFile({
      filename: "logs/payment-analytics-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      handleExceptions: false,
      json: true,
      maxSize: "30m",
      maxFiles: "14d",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          // Only log analytics-related entries
          if (
            info.event &&
            (info.event.includes("analytics") || info.event.includes("cache"))
          ) {
            return JSON.stringify({
              timestamp: info.timestamp,
              event: info.event,
              data: info.data,
              performance: info.performance,
              environment: config.NODE_ENV,
            });
          }
          return null;
        }),
        winston.format.filter((info) => info.message !== null)
      ),
    })
  );
}

// Create specialized payment logger
export const paymentLogger = winston.createLogger({
  level: config.NODE_ENV === "development" ? "debug" : "info",
  format: paymentLoggerFormat,
  transports: paymentTransports,
  exitOnError: false,

  // Default metadata for all payment logs
  defaultMeta: {
    service: "payment",
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  },
});

// Add structured logging methods
paymentLogger.logPaymentEvent = (event, data, level = "info") => {
  paymentLogger.log(level, `Payment event: ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

paymentLogger.logPerformanceMetric = (metric, value, context = {}) => {
  paymentLogger.info("Performance metric recorded", {
    event: "performance_metric",
    metric,
    value,
    unit: context.unit || "ms",
    threshold: context.threshold,
    exceeded: context.threshold && value > context.threshold,
    ...context,
  });
};

paymentLogger.logSecurityEvent = (event, details, severity = "MEDIUM") => {
  paymentLogger.warn("Security event detected", {
    event: "security_event",
    securityEvent: event,
    severity,
    details,
    timestamp: new Date().toISOString(),
    requiresInvestigation: severity === "HIGH",
  });
};

paymentLogger.logBusinessMetric = (metric, value, context = {}) => {
  paymentLogger.info("Business metric recorded", {
    event: "business_metric",
    metric,
    value,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Export logger configuration for testing
export const paymentLoggerConfig = {
  format: paymentLoggerFormat,
  transports: paymentTransports,
  level: config.NODE_ENV === "development" ? "debug" : "info",
};

export default paymentLogger;
