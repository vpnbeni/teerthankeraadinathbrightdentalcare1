import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { dbPerformanceMonitor } from "../middleware/monitoring.js";
import metricsService from "./metricsService.js";

class OptimizationService {
  constructor() {
    this.setupDatabaseOptimizations();
    this.setupQueryOptimization();
    this.startPerformanceMonitoring();
  }

  // Setup database indexes for better performance
  async setupDatabaseOptimizations() {
    try {
      // User collection indexes
      await mongoose.connection
        .collection("users")
        .createIndex({ phone: 1 }, { unique: true });
      await mongoose.connection
        .collection("users")
        .createIndex({ email: 1 }, { sparse: true });
      await mongoose.connection
        .collection("users")
        .createIndex({ "subscription.status": 1 });
      await mongoose.connection
        .collection("users")
        .createIndex({ createdAt: -1 });
      await mongoose.connection.collection("users").createIndex({ role: 1 });

      // Appointment collection indexes
      await mongoose.connection
        .collection("appointments")
        .createIndex({ userId: 1 });
      await mongoose.connection
        .collection("appointments")
        .createIndex({ date: 1 });
      await mongoose.connection
        .collection("appointments")
        .createIndex({ status: 1 });
      await mongoose.connection
        .collection("appointments")
        .createIndex({ userId: 1, date: -1 });
      await mongoose.connection
        .collection("appointments")
        .createIndex({ date: 1, timeSlot: 1 });

      // Payment collection indexes
      await mongoose.connection
        .collection("payments")
        .createIndex({ userId: 1 });
      await mongoose.connection
        .collection("payments")
        .createIndex({ status: 1 });
      await mongoose.connection
        .collection("payments")
        .createIndex({ transactionDate: -1 });
      await mongoose.connection
        .collection("payments")
        .createIndex({ razorpayOrderId: 1 }, { sparse: true });

      // Session collection indexes
      await mongoose.connection
        .collection("sessions")
        .createIndex({ userId: 1 });
      await mongoose.connection
        .collection("sessions")
        .createIndex({ appointmentId: 1 });
      await mongoose.connection
        .collection("sessions")
        .createIndex({ completedAt: -1 });

      // Plan collection indexes
      await mongoose.connection
        .collection("plans")
        .createIndex({ isActive: 1 });
      await mongoose.connection.collection("plans").createIndex({ price: 1 });

      logger.info("Database indexes created successfully");
    } catch (error) {
      logger.error(`Error creating database indexes: ${error.message}`);
    }
  }

  // Monitor database performance
  setupDatabaseMonitoring() {
    // Monitor mongoose queries
    mongoose.set("debug", (collectionName, method, query, doc) => {
      const startTime = Date.now();

      // Log the query completion
      process.nextTick(() => {
        const duration = Date.now() - startTime;
        dbPerformanceMonitor.logQuery(method, collectionName, duration);
      });
    });
  }

  // Enhanced caching system
  cache = new Map();
  cacheStats = new Map();
  cacheTimeout = 5 * 60 * 1000; // 5 minutes
  maxCacheSize = 1000; // Maximum number of cached items

  async getCachedData(key, fetchFunction, customTimeout = null) {
    const timeout = customTimeout || this.cacheTimeout;
    const cached = this.cache.get(key);

    // Initialize cache stats for this key
    if (!this.cacheStats.has(key)) {
      this.cacheStats.set(key, { hits: 0, misses: 0 });
    }

    const stats = this.cacheStats.get(key);

    if (cached && Date.now() - cached.timestamp < timeout) {
      stats.hits++;
      metricsService.recordCacheHit("application");
      logger.debug(`Cache hit for key: ${key}`);
      return cached.data;
    }

    try {
      stats.misses++;
      metricsService.recordCacheMiss("application");
      logger.debug(`Cache miss for key: ${key}`);

      const data = await fetchFunction();

      // Implement LRU cache eviction
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
        this.cacheStats.delete(firstKey);
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        accessCount: 1,
      });

      return data;
    } catch (error) {
      logger.error(`Cache fetch error for key ${key}: ${error.message}`);
      metricsService.recordError("cache_fetch_error");
      throw error;
    }
  }

  // Clear cache with statistics
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      this.cacheStats.delete(key);
      logger.info(`Cache cleared for key: ${key}`);
    } else {
      const size = this.cache.size;
      this.cache.clear();
      this.cacheStats.clear();
      logger.info(`All cache cleared (${size} items removed)`);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const totalHits = Array.from(this.cacheStats.values()).reduce(
      (sum, stat) => sum + stat.hits,
      0
    );
    const totalMisses = Array.from(this.cacheStats.values()).reduce(
      (sum, stat) => sum + stat.misses,
      0
    );
    const hitRate =
      totalHits + totalMisses > 0
        ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(2)
        : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      totalHits,
      totalMisses,
      hitRate: `${hitRate}%`,
      keys: Array.from(this.cache.keys()),
      keyStats: Object.fromEntries(this.cacheStats),
    };
  }

  // Database connection optimization
  optimizeConnection() {
    // Set connection pool options
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error.message}`);
        process.exit(1);
      }
    });
  }

  // Query optimization helpers
  getOptimizedQuery(model, filter = {}, options = {}) {
    const query = model.find(filter);

    // Add pagination
    if (options.page && options.limit) {
      const skip = (options.page - 1) * options.limit;
      query.skip(skip).limit(options.limit);
    }

    // Add sorting
    if (options.sort) {
      query.sort(options.sort);
    }

    // Add field selection
    if (options.select) {
      query.select(options.select);
    }

    // Add population
    if (options.populate) {
      query.populate(options.populate);
    }

    return query;
  }

  // Performance metrics
  async getPerformanceMetrics() {
    try {
      const dbStats = await mongoose.connection.db.stats();

      return {
        database: {
          collections: dbStats.collections,
          dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          storageSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`,
          indexes: dbStats.indexes,
          indexSize: `${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`,
        },
        queries: dbPerformanceMonitor.getStats(),
        cache: {
          size: this.cache.size,
          keys: Array.from(this.cache.keys()),
        },
      };
    } catch (error) {
      logger.error(`Error getting performance metrics: ${error.message}`);
      return null;
    }
  }

  // Setup query optimization monitoring
  setupQueryOptimization() {
    // Monitor slow queries
    mongoose.set("debug", (collectionName, method, query, doc, options) => {
      const startTime = Date.now();

      // Use setImmediate to capture the query completion time
      setImmediate(() => {
        const duration = Date.now() - startTime;
        metricsService.recordDbQuery(method, collectionName, duration, true);

        if (duration > 100) {
          // Log queries taking more than 100ms
          logger.warn(
            `Slow query detected: ${method} on ${collectionName} took ${duration}ms`,
            {
              query: JSON.stringify(query),
              options: JSON.stringify(options),
            }
          );
        }
      });
    });
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    // Monitor memory usage every minute
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

      if (heapUsedMB > 500) {
        // Alert if heap usage exceeds 500MB
        logger.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
        metricsService.recordError("high_memory_usage", "warn");
      }
    }, 60000);

    // Monitor event loop lag
    let start = process.hrtime.bigint();
    setInterval(() => {
      const delta = process.hrtime.bigint() - start;
      const nanosec = Number(delta);
      const millisec = nanosec / 1000000;

      if (millisec > 100) {
        // Alert if event loop lag exceeds 100ms
        logger.warn(`Event loop lag detected: ${millisec.toFixed(2)}ms`);
        metricsService.recordError("event_loop_lag", "warn");
      }

      start = process.hrtime.bigint();
    }, 5000);
  }

  // Cleanup old data with enhanced logging
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      let cleanupCount = 0;

      // Clean up old audit logs (keep only 30 days)
      const AuditLog = mongoose.model("AuditLog");
      if (AuditLog) {
        const auditResult = await AuditLog.deleteMany({
          timestamp: { $lt: thirtyDaysAgo },
        });
        cleanupCount += auditResult.deletedCount;
        logger.info(`Cleaned up ${auditResult.deletedCount} old audit logs`);
      }

      // Clean up expired OTP records (keep only 1 day)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // This would clean up OTP records if they exist as a separate collection

      // Clean up old temporary files from uploads
      // This would clean up temporary files older than 7 days

      // Clean up cache entries older than configured timeout
      const now = Date.now();
      let cacheCleanupCount = 0;
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout * 2) {
          // Clean entries older than 2x timeout
          this.cache.delete(key);
          this.cacheStats.delete(key);
          cacheCleanupCount++;
        }
      }

      if (cacheCleanupCount > 0) {
        logger.info(`Cleaned up ${cacheCleanupCount} expired cache entries`);
      }

      logger.info(
        `Data cleanup completed: ${cleanupCount} database records, ${cacheCleanupCount} cache entries`
      );

      return {
        databaseRecords: cleanupCount,
        cacheEntries: cacheCleanupCount,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error during data cleanup: ${error.message}`);
      metricsService.recordError("data_cleanup_error");
      throw error;
    }
  }

  // Database connection health check
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const duration = Date.now() - start;

      return {
        status: "healthy",
        responseTime: `${duration}ms`,
        connectionState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
      };
    } catch (error) {
      logger.error(`Database health check failed: ${error.message}`);
      metricsService.recordError("database_health_check_failed");
      return {
        status: "unhealthy",
        error: error.message,
        connectionState: mongoose.connection.readyState,
      };
    }
  }
}

export default new OptimizationService();
