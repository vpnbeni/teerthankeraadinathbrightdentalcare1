import client from "prom-client";
import pidusage from "pidusage";
import logger from "../utils/logger.js";

/**
 * Metrics Service for Application Monitoring
 * Provides Prometheus-compatible metrics for monitoring
 */
class MetricsService {
  constructor() {
    // Create a Registry to register the metrics
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({
      register: this.register,
      prefix: "dental_clinic_",
    });

    this.initializeCustomMetrics();
    this.startSystemMetricsCollection();
  }

  /**
   * Initialize custom application metrics
   */
  initializeCustomMetrics() {
    // HTTP request metrics
    this.httpRequestDuration = new client.Histogram({
      name: "dental_clinic_http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.httpRequestTotal = new client.Counter({
      name: "dental_clinic_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
    });

    // Database metrics
    this.dbQueryDuration = new client.Histogram({
      name: "dental_clinic_db_query_duration_seconds",
      help: "Duration of database queries in seconds",
      labelNames: ["operation", "collection"],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.dbQueryTotal = new client.Counter({
      name: "dental_clinic_db_queries_total",
      help: "Total number of database queries",
      labelNames: ["operation", "collection", "status"],
    });

    this.dbConnectionPool = new client.Gauge({
      name: "dental_clinic_db_connection_pool_size",
      help: "Current database connection pool size",
    });

    // Application-specific metrics
    this.activeUsers = new client.Gauge({
      name: "dental_clinic_active_users_total",
      help: "Number of currently active users",
    });

    this.appointmentsToday = new client.Gauge({
      name: "dental_clinic_appointments_today_total",
      help: "Number of appointments scheduled for today",
    });

    this.paymentsToday = new client.Counter({
      name: "dental_clinic_payments_today_total",
      help: "Total payments processed today",
      labelNames: ["status"],
    });

    this.sessionsCompleted = new client.Counter({
      name: "dental_clinic_sessions_completed_total",
      help: "Total number of completed dental sessions",
    });

    // System resource metrics
    this.systemCpuUsage = new client.Gauge({
      name: "dental_clinic_system_cpu_usage_percent",
      help: "System CPU usage percentage",
    });

    this.systemMemoryUsage = new client.Gauge({
      name: "dental_clinic_system_memory_usage_bytes",
      help: "System memory usage in bytes",
    });

    this.systemMemoryTotal = new client.Gauge({
      name: "dental_clinic_system_memory_total_bytes",
      help: "Total system memory in bytes",
    });

    // Error metrics
    this.errorTotal = new client.Counter({
      name: "dental_clinic_errors_total",
      help: "Total number of application errors",
      labelNames: ["type", "severity"],
    });

    // Cache metrics
    this.cacheHits = new client.Counter({
      name: "dental_clinic_cache_hits_total",
      help: "Total number of cache hits",
      labelNames: ["cache_type"],
    });

    this.cacheMisses = new client.Counter({
      name: "dental_clinic_cache_misses_total",
      help: "Total number of cache misses",
      labelNames: ["cache_type"],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.dbQueryDuration);
    this.register.registerMetric(this.dbQueryTotal);
    this.register.registerMetric(this.dbConnectionPool);
    this.register.registerMetric(this.activeUsers);
    this.register.registerMetric(this.appointmentsToday);
    this.register.registerMetric(this.paymentsToday);
    this.register.registerMetric(this.sessionsCompleted);
    this.register.registerMetric(this.systemCpuUsage);
    this.register.registerMetric(this.systemMemoryUsage);
    this.register.registerMetric(this.systemMemoryTotal);
    this.register.registerMetric(this.errorTotal);
    this.register.registerMetric(this.cacheHits);
    this.register.registerMetric(this.cacheMisses);

    logger.info("Custom metrics initialized successfully");
  }

  /**
   * Start collecting system metrics periodically
   */
  startSystemMetricsCollection() {
    setInterval(async () => {
      try {
        // Get system resource usage
        const stats = await pidusage(process.pid);

        this.systemCpuUsage.set(stats.cpu);
        this.systemMemoryUsage.set(stats.memory);

        // Update database connection pool size
        if (global.mongoose && global.mongoose.connection) {
          const poolSize =
            global.mongoose.connection.readyState === 1
              ? global.mongoose.connection.db.serverConfig.poolSize || 0
              : 0;
          this.dbConnectionPool.set(poolSize);
        }

        // Update application-specific metrics
        await this.updateApplicationMetrics();
      } catch (error) {
        logger.error(`Error collecting system metrics: ${error.message}`);
      }
    }, 30000); // Collect every 30 seconds
  }

  /**
   * Update application-specific metrics
   */
  async updateApplicationMetrics() {
    try {
      const mongoose = await import("mongoose");

      if (mongoose.connection.readyState === 1) {
        // Count today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const Appointment = mongoose.model("Appointment");
        const appointmentsCount = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
        });

        this.appointmentsToday.set(appointmentsCount);

        // Count active users (users with active subscriptions)
        const User = mongoose.model("User");
        const activeUsersCount = await User.countDocuments({
          "subscription.status": "active",
        });

        this.activeUsers.set(activeUsersCount);
      }
    } catch (error) {
      logger.error(`Error updating application metrics: ${error.message}`);
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method, route, statusCode, duration) {
    const labels = { method, route, status_code: statusCode };

    this.httpRequestDuration.observe(labels, duration / 1000); // Convert to seconds
    this.httpRequestTotal.inc(labels);
  }

  /**
   * Record database query metrics
   */
  recordDbQuery(operation, collection, duration, success = true) {
    const durationLabels = { operation, collection };
    const countLabels = {
      operation,
      collection,
      status: success ? "success" : "error",
    };

    this.dbQueryDuration.observe(durationLabels, duration / 1000); // Convert to seconds
    this.dbQueryTotal.inc(countLabels);
  }

  /**
   * Record error metrics
   */
  recordError(type, severity = "error") {
    this.errorTotal.inc({ type, severity });
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(cacheType) {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  recordCacheMiss(cacheType) {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  /**
   * Record payment metrics
   */
  recordPayment(status) {
    this.paymentsToday.inc({ status });
  }

  /**
   * Record session completion
   */
  recordSessionCompleted() {
    this.sessionsCompleted.inc();
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJson() {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics() {
    this.register.resetMetrics();
  }

  /**
   * Get current system health metrics
   */
  async getHealthMetrics() {
    try {
      const stats = await pidusage(process.pid);
      const memUsage = process.memoryUsage();

      return {
        system: {
          cpu: `${stats.cpu.toFixed(2)}%`,
          memory: {
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
          },
          uptime: `${Math.floor(process.uptime())} seconds`,
        },
        database: {
          connectionState: global.mongoose?.connection?.readyState || 0,
          poolSize:
            global.mongoose?.connection?.db?.serverConfig?.poolSize || 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error getting health metrics: ${error.message}`);
      return null;
    }
  }
}

export default new MetricsService();
