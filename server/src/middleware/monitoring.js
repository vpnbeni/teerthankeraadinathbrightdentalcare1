import responseTime from "response-time";
import logger from "../utils/logger.js";
import metricsService from "../services/metricsService.js";

// Performance monitoring middleware
export const performanceMonitor = responseTime((req, res, time) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${time.toFixed(2)}ms`,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  // Record metrics
  const route = req.route ? req.route.path : req.url;
  metricsService.recordHttpRequest(req.method, route, res.statusCode, time);

  // Log slow requests (> 1000ms)
  if (time > 1000) {
    logger.warn(`Slow request detected: ${JSON.stringify(logData)}`);
    metricsService.recordError("slow_request", "warn");
  }

  // Log all requests in development
  if (process.env.NODE_ENV === "development") {
    logger.http(
      `${req.method} ${req.url} - ${res.statusCode} - ${time.toFixed(2)}ms`
    );
  }
});

// Memory usage monitoring
export const memoryMonitor = () => {
  const memUsage = process.memoryUsage();
  const formatMemory = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  return {
    rss: `${formatMemory(memUsage.rss)} MB`,
    heapTotal: `${formatMemory(memUsage.heapTotal)} MB`,
    heapUsed: `${formatMemory(memUsage.heapUsed)} MB`,
    external: `${formatMemory(memUsage.external)} MB`,
    timestamp: new Date().toISOString(),
  };
};

// API health monitoring
export const healthMonitor = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,

  incrementRequest() {
    this.requestCount++;
  },

  incrementError() {
    this.errorCount++;
  },

  getStats() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      uptimeMs: uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate:
        this.requestCount > 0
          ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + "%"
          : "0%",
      memory: memoryMonitor(),
      timestamp: new Date().toISOString(),
    };
  },
};

// Request tracking middleware
export const requestTracker = (req, res, next) => {
  healthMonitor.incrementRequest();

  // Track response status
  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode >= 400) {
      healthMonitor.incrementError();
    }
    originalSend.call(this, data);
  };

  next();
};

// Database performance monitoring
export const dbPerformanceMonitor = {
  queries: [],

  logQuery(operation, collection, duration, error = null) {
    const queryLog = {
      operation,
      collection,
      duration: `${duration}ms`,
      error: error ? error.message : null,
      timestamp: new Date().toISOString(),
    };

    this.queries.push(queryLog);

    // Keep only last 100 queries
    if (this.queries.length > 100) {
      this.queries.shift();
    }

    // Log slow queries (> 100ms)
    if (duration > 100) {
      logger.warn(`Slow database query: ${JSON.stringify(queryLog)}`);
    }

    if (error) {
      logger.error(`Database error: ${JSON.stringify(queryLog)}`);
    }
  },

  getStats() {
    const recentQueries = this.queries.slice(-50);
    const avgDuration =
      recentQueries.length > 0
        ? recentQueries.reduce((sum, q) => sum + parseFloat(q.duration), 0) /
          recentQueries.length
        : 0;

    return {
      totalQueries: this.queries.length,
      recentQueries: recentQueries.length,
      averageDuration: `${avgDuration.toFixed(2)}ms`,
      slowQueries: this.queries.filter((q) => parseFloat(q.duration) > 100)
        .length,
      errors: this.queries.filter((q) => q.error).length,
    };
  },
};

export default {
  performanceMonitor,
  memoryMonitor,
  healthMonitor,
  requestTracker,
  dbPerformanceMonitor,
};
