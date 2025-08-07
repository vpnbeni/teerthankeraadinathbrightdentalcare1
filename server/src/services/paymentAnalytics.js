import { Payment, Plan, User } from "../models/index.js";
import logger from "../utils/logger.js";
import { paymentLogger } from "./paymentLogger.js";

/**
 * Payment Analytics Service
 * Provides comprehensive analytics and monitoring for payment operations
 */

class PaymentAnalytics {
  constructor() {
    this.analyticsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get comprehensive payment analytics
   */
  async getPaymentAnalytics(startDate, endDate) {
    const cacheKey = `analytics_${startDate.getTime()}_${endDate.getTime()}`;

    // Check cache first
    if (this.analyticsCache.has(cacheKey)) {
      const cached = this.analyticsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info("Payment analytics served from cache", {
          event: "analytics_cache_hit",
          cacheKey,
          timestamp: new Date().toISOString(),
        });
        return cached.data;
      }
    }

    const startTime = Date.now();

    try {
      logger.info("Generating payment analytics", {
        event: "analytics_generation_start",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Run analytics queries in parallel
      const [
        overviewStats,
        successRateStats,
        planPerformance,
        timeSeriesData,
        errorAnalysis,
        performanceMetrics,
        userBehaviorStats,
        revenueAnalytics,
      ] = await Promise.all([
        this.getOverviewStats(startDate, endDate),
        this.getSuccessRateStats(startDate, endDate),
        this.getPlanPerformance(startDate, endDate),
        this.getTimeSeriesData(startDate, endDate),
        this.getErrorAnalysis(startDate, endDate),
        this.getPerformanceMetrics(startDate, endDate),
        this.getUserBehaviorStats(startDate, endDate),
        this.getRevenueAnalytics(startDate, endDate),
      ]);

      const analytics = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          durationDays: Math.ceil(
            (endDate - startDate) / (1000 * 60 * 60 * 24)
          ),
        },
        overview: overviewStats,
        successRates: successRateStats,
        planPerformance,
        timeSeries: timeSeriesData,
        errorAnalysis,
        performance: performanceMetrics,
        userBehavior: userBehaviorStats,
        revenue: revenueAnalytics,
        realTimeMetrics: paymentLogger.getMetricsSnapshot(),
        generatedAt: new Date().toISOString(),
        generationTime: Date.now() - startTime,
      };

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now(),
      });

      const duration = Date.now() - startTime;
      logger.info("Payment analytics generated successfully", {
        event: "analytics_generation_success",
        duration: `${duration}ms`,
        cacheKey,
        timestamp: new Date().toISOString(),
      });

      return analytics;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Payment analytics generation failed", {
        event: "analytics_generation_failure",
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(startDate, endDate) {
    const [totalPayments, successfulPayments, failedPayments, pendingPayments] =
      await Promise.all([
        Payment.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        Payment.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed",
        }),
        Payment.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: "failed",
        }),
        Payment.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: "pending",
        }),
      ]);

    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
        },
      },
    ]);

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      averageAmount: totalRevenue[0]?.averageAmount || 0,
      overallSuccessRate:
        totalPayments > 0
          ? ((successfulPayments / totalPayments) * 100).toFixed(2)
          : 0,
      overallFailureRate:
        totalPayments > 0
          ? ((failedPayments / totalPayments) * 100).toFixed(2)
          : 0,
    };
  }

  /**
   * Get success rate statistics
   */
  async getSuccessRateStats(startDate, endDate) {
    const dailyStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const processedDailyStats = dailyStats.map((day) => {
      const statusMap = {};
      day.statuses.forEach((s) => {
        statusMap[s.status] = s.count;
      });

      const successful = statusMap.completed || 0;
      const failed = statusMap.failed || 0;
      const pending = statusMap.pending || 0;
      const total = day.totalCount;

      return {
        date: day._id,
        total,
        successful,
        failed,
        pending,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
        failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : 0,
      };
    });

    // Calculate hourly success rates for recent data
    const hourlyStats = await Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.hour",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const processedHourlyStats = hourlyStats.map((hour) => {
      const statusMap = {};
      hour.statuses.forEach((s) => {
        statusMap[s.status] = s.count;
      });

      const successful = statusMap.completed || 0;
      const total = hour.totalCount;

      return {
        hour: hour._id,
        total,
        successful,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
      };
    });

    return {
      daily: processedDailyStats,
      hourly: processedHourlyStats,
    };
  }

  /**
   * Get plan performance analytics
   */
  async getPlanPerformance(startDate, endDate) {
    const planStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: {
            planId: "$planId",
            planName: "$plan.name",
            status: "$status",
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: {
            planId: "$_id.planId",
            planName: "$_id.planName",
          },
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
              revenue: "$totalRevenue",
            },
          },
          totalAttempts: { $sum: "$count" },
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
    ]);

    return planStats.map((plan) => {
      const statusMap = {};
      plan.statuses.forEach((s) => {
        statusMap[s.status] = {
          count: s.count,
          revenue: s.revenue,
        };
      });

      const successful = statusMap.completed?.count || 0;
      const failed = statusMap.failed?.count || 0;
      const pending = statusMap.pending?.count || 0;
      const successfulRevenue = statusMap.completed?.revenue || 0;

      return {
        planId: plan._id.planId,
        planName: plan._id.planName,
        totalAttempts: plan.totalAttempts,
        successful,
        failed,
        pending,
        successRate:
          plan.totalAttempts > 0
            ? ((successful / plan.totalAttempts) * 100).toFixed(2)
            : 0,
        totalRevenue: successfulRevenue,
        averageAmount:
          successful > 0 ? (successfulRevenue / successful).toFixed(2) : 0,
      };
    });
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(startDate, endDate) {
    const timeSeriesData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            hour: { $hour: "$createdAt" },
          },
          totalPayments: { $sum: 1 },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
          },
        },
      },
      {
        $sort: { "_id.date": 1, "_id.hour": 1 },
      },
    ]);

    return timeSeriesData.map((item) => ({
      date: item._id.date,
      hour: item._id.hour,
      timestamp: new Date(
        `${item._id.date}T${item._id.hour.toString().padStart(2, "0")}:00:00`
      ).toISOString(),
      totalPayments: item.totalPayments,
      successfulPayments: item.successfulPayments,
      failedPayments: item.failedPayments,
      totalRevenue: item.totalRevenue,
      successRate:
        item.totalPayments > 0
          ? ((item.successfulPayments / item.totalPayments) * 100).toFixed(2)
          : 0,
    }));
  }

  /**
   * Get error analysis
   */
  async getErrorAnalysis(startDate, endDate) {
    const errorStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "failed",
        },
      },
      {
        $unwind: "$attempts",
      },
      {
        $match: {
          "attempts.status": "failed",
        },
      },
      {
        $group: {
          _id: "$attempts.errorMessage",
          count: { $sum: 1 },
          lastOccurrence: { $max: "$attempts.timestamp" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Get error trends over time
    const errorTrends = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "failed",
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          errorCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    return {
      topErrors: errorStats.map((error) => ({
        errorMessage: error._id || "Unknown Error",
        count: error.count,
        lastOccurrence: error.lastOccurrence,
      })),
      errorTrends: errorTrends.map((trend) => ({
        date: trend._id.date,
        errorCount: trend.errorCount,
      })),
      realTimeErrors: paymentLogger.getMetricsSnapshot().errorSummary,
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(startDate, endDate) {
    // Get average processing times from payment records
    const processingTimes = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          "metadata.processingTime": { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: "$metadata.processingTime" },
          minProcessingTime: { $min: "$metadata.processingTime" },
          maxProcessingTime: { $max: "$metadata.processingTime" },
          totalProcessed: { $sum: 1 },
        },
      },
    ]);

    // Get real-time performance metrics from payment logger
    const realTimeMetrics = paymentLogger.getMetricsSnapshot();

    return {
      historical: {
        averageProcessingTime: processingTimes[0]?.averageProcessingTime || 0,
        minProcessingTime: processingTimes[0]?.minProcessingTime || 0,
        maxProcessingTime: processingTimes[0]?.maxProcessingTime || 0,
        totalProcessed: processingTimes[0]?.totalProcessed || 0,
      },
      realTime: {
        averageProcessingTime: realTimeMetrics.metrics.averageProcessingTime,
        averageRazorpayApiTime:
          realTimeMetrics.performance.averageRazorpayApiTime,
        averageDatabaseTime: realTimeMetrics.performance.averageDatabaseTime,
        razorpayApiSuccessRate:
          realTimeMetrics.successRates.razorpayApiSuccessRate,
        databaseSuccessRate: realTimeMetrics.successRates.databaseSuccessRate,
      },
    };
  }

  /**
   * Get user behavior statistics
   */
  async getUserBehaviorStats(startDate, endDate) {
    const userStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$userId",
          totalPayments: { $sum: 1 },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalSpent: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
          },
          firstPayment: { $min: "$createdAt" },
          lastPayment: { $max: "$createdAt" },
          userPhone: { $first: "$user.phone" },
        },
      },
    ]);

    const behaviorAnalysis = {
      totalUniqueUsers: userStats.length,
      averagePaymentsPerUser:
        userStats.length > 0
          ? (
              userStats.reduce((sum, user) => sum + user.totalPayments, 0) /
              userStats.length
            ).toFixed(2)
          : 0,
      averageSpentPerUser:
        userStats.length > 0
          ? (
              userStats.reduce((sum, user) => sum + user.totalSpent, 0) /
              userStats.length
            ).toFixed(2)
          : 0,
      repeatCustomers: userStats.filter((user) => user.totalPayments > 1)
        .length,
      newCustomers: userStats.filter((user) => user.firstPayment >= startDate)
        .length,
    };

    // Payment attempt patterns
    const attemptPatterns = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $size: "$attempts" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      ...behaviorAnalysis,
      attemptPatterns: attemptPatterns.map((pattern) => ({
        attempts: pattern._id,
        count: pattern.count,
      })),
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(startDate, endDate) {
    const revenueData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          dailyRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          averageTransactionValue: { $avg: "$amount" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    const totalRevenue = revenueData.reduce(
      (sum, day) => sum + day.dailyRevenue,
      0
    );
    const totalTransactions = revenueData.reduce(
      (sum, day) => sum + day.transactionCount,
      0
    );

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $group: {
          _id: {
            planId: "$planId",
            planName: "$plan.name",
          },
          revenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue:
        totalTransactions > 0
          ? (totalRevenue / totalTransactions).toFixed(2)
          : 0,
      dailyRevenue: revenueData.map((day) => ({
        date: day._id.date,
        revenue: day.dailyRevenue,
        transactionCount: day.transactionCount,
        averageTransactionValue: day.averageTransactionValue.toFixed(2),
      })),
      revenueByPlan: revenueByPlan.map((plan) => ({
        planId: plan._id.planId,
        planName: plan._id.planName,
        revenue: plan.revenue,
        transactionCount: plan.transactionCount,
        averageTransactionValue: (plan.revenue / plan.transactionCount).toFixed(
          2
        ),
        revenuePercentage: ((plan.revenue / totalRevenue) * 100).toFixed(2),
      })),
    };
  }

  /**
   * Get real-time payment status
   */
  getRealTimeStatus() {
    return paymentLogger.getMetricsSnapshot();
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.analyticsCache.clear();
    logger.info("Payment analytics cache cleared", {
      event: "analytics_cache_cleared",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.analyticsCache.size,
      cacheTimeout: this.cacheTimeout,
      cacheKeys: Array.from(this.analyticsCache.keys()),
    };
  }
}

// Create singleton instance
export const paymentAnalytics = new PaymentAnalytics();
export default paymentAnalytics;
