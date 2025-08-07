import mongoose from "mongoose";
import { Payment, Plan, User } from "../models/index.js";
import { paymentLogger } from "./paymentLogger.js";
import logger from "../utils/logger.js";
import { config } from "../config/environment.js";

/**
 * Payment Debugger Service
 * Provides comprehensive debugging and troubleshooting tools for payment operations
 */

class PaymentDebugger {
  constructor() {
    this.debugSessions = new Map(); // Store active debug sessions
    this.traceBuffer = new Map(); // Store request traces
    this.maxTraceBufferSize = 1000;
    this.maxDebugSessions = 50;
  }

  /**
   * Start a debug session for payment operations
   */
  startDebugSession(sessionId, options = {}) {
    const session = {
      id: sessionId,
      startTime: Date.now(),
      options: {
        logLevel: options.logLevel || "debug",
        includeStackTrace: options.includeStackTrace || false,
        trackPerformance: options.trackPerformance || true,
        captureRequestResponse: options.captureRequestResponse || true,
        ...options,
      },
      traces: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
      },
    };

    // Limit number of active debug sessions
    if (this.debugSessions.size >= this.maxDebugSessions) {
      const oldestSession = Array.from(this.debugSessions.entries()).sort(
        ([, a], [, b]) => a.startTime - b.startTime
      )[0];
      this.debugSessions.delete(oldestSession[0]);
    }

    this.debugSessions.set(sessionId, session);

    logger.info("Debug session started", {
      event: "debug_session_start",
      sessionId,
      options: session.options,
      timestamp: new Date().toISOString(),
    });

    return session;
  }

  /**
   * Stop a debug session and return summary
   */
  stopDebugSession(sessionId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const duration = Date.now() - session.startTime;
    const summary = {
      sessionId,
      duration: `${duration}ms`,
      totalTraces: session.traces.length,
      metrics: session.metrics,
      traces: session.traces,
      endTime: new Date().toISOString(),
    };

    this.debugSessions.delete(sessionId);

    logger.info("Debug session stopped", {
      event: "debug_session_stop",
      sessionId,
      summary,
      timestamp: new Date().toISOString(),
    });

    return summary;
  }

  /**
   * Add trace to debug session
   */
  addTrace(sessionId, requestId, operation, data) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    const trace = {
      requestId,
      operation,
      timestamp: new Date().toISOString(),
      data: this.sanitizeTraceData(data),
    };

    session.traces.push(trace);
    session.metrics.totalRequests++;

    // Also add to global trace buffer
    this.addToTraceBuffer(requestId, trace);
  }

  /**
   * Add to global trace buffer for request tracking
   */
  addToTraceBuffer(requestId, trace) {
    if (!this.traceBuffer.has(requestId)) {
      this.traceBuffer.set(requestId, []);
    }

    const traces = this.traceBuffer.get(requestId);

    // Sanitize trace data before storing
    const sanitizedTrace = {
      ...trace,
      data: this.sanitizeTraceData(trace.data),
    };

    traces.push(sanitizedTrace);

    // Limit buffer size
    if (this.traceBuffer.size > this.maxTraceBufferSize) {
      const oldestKey = this.traceBuffer.keys().next().value;
      this.traceBuffer.delete(oldestKey);
    }
  }

  /**
   * Get trace for specific request ID
   */
  getRequestTrace(requestId) {
    return this.traceBuffer.get(requestId) || [];
  }

  /**
   * Get all traces for debugging
   */
  getAllTraces(limit = 100) {
    const allTraces = [];
    for (const [requestId, traces] of this.traceBuffer.entries()) {
      allTraces.push({
        requestId,
        traces,
        traceCount: traces.length,
      });
    }

    return allTraces
      .sort((a, b) => {
        const aLatest = Math.max(
          ...a.traces.map((t) => new Date(t.timestamp).getTime())
        );
        const bLatest = Math.max(
          ...b.traces.map((t) => new Date(t.timestamp).getTime())
        );
        return bLatest - aLatest;
      })
      .slice(0, limit);
  }

  /**
   * Detailed request/response logging for debugging
   */
  logDetailedRequest(requestId, operation, request, response, error = null) {
    const logData = {
      event: "detailed_payment_request",
      requestId,
      operation,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: this.sanitizeRequestBody(request.body),
        query: request.query,
        params: request.params,
        user: request.user
          ? {
              id: request.user._id,
              phone: "[REDACTED]",
              role: request.user.role,
            }
          : null,
        clientInfo: {
          userAgent: request.get("User-Agent"),
          ipAddress: request.ip,
          origin: request.get("Origin"),
        },
      },
      response: response
        ? {
            statusCode: response.statusCode,
            headers: this.sanitizeHeaders(response.getHeaders()),
            body: this.sanitizeResponseBody(response.body),
            processingTime: response.processingTime,
          }
        : null,
      error: error
        ? {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack,
            details: error.details,
          }
        : null,
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    logger.debug("Detailed payment request log", logData);

    // Add to trace buffer
    this.addToTraceBuffer(requestId, {
      operation: "detailed_request_log",
      timestamp: new Date().toISOString(),
      data: logData,
    });

    return logData;
  }

  /**
   * Database consistency checks for payment records
   */
  async performConsistencyCheck(options = {}) {
    const checkId = `check_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const startTime = Date.now();

    logger.info("Starting payment database consistency check", {
      event: "consistency_check_start",
      checkId,
      options,
      timestamp: new Date().toISOString(),
    });

    const results = {
      checkId,
      startTime: new Date().toISOString(),
      checks: {},
      issues: [],
      summary: {},
    };

    try {
      // Check 1: Orphaned payments (payments without valid user or plan)
      results.checks.orphanedPayments = await this.checkOrphanedPayments();

      // Check 2: Duplicate Razorpay order IDs
      results.checks.duplicateOrderIds = await this.checkDuplicateOrderIds();

      // Check 3: Inconsistent payment statuses
      results.checks.inconsistentStatuses =
        await this.checkInconsistentStatuses();

      // Check 4: Missing required fields
      results.checks.missingFields = await this.checkMissingRequiredFields();

      // Check 5: Payment amount mismatches with plan prices
      results.checks.amountMismatches = await this.checkAmountMismatches();

      // Check 6: Stale pending payments
      results.checks.stalePendingPayments =
        await this.checkStalePendingPayments(options.stalePendingHours || 24);

      // Check 7: Request ID duplicates
      results.checks.duplicateRequestIds =
        await this.checkDuplicateRequestIds();

      // Compile issues
      for (const [checkName, checkResult] of Object.entries(results.checks)) {
        if (checkResult.issues && checkResult.issues.length > 0) {
          results.issues.push(
            ...checkResult.issues.map((issue) => ({
              check: checkName,
              ...issue,
            }))
          );
        }
      }

      // Generate summary
      results.summary = {
        totalChecks: Object.keys(results.checks).length,
        totalIssues: results.issues.length,
        criticalIssues: results.issues.filter((i) => i.severity === "critical")
          .length,
        warningIssues: results.issues.filter((i) => i.severity === "warning")
          .length,
        infoIssues: results.issues.filter((i) => i.severity === "info").length,
      };

      const duration = Date.now() - startTime;
      results.endTime = new Date().toISOString();
      results.duration = `${duration}ms`;

      logger.info("Payment database consistency check completed", {
        event: "consistency_check_complete",
        checkId,
        duration: `${duration}ms`,
        summary: results.summary,
        timestamp: new Date().toISOString(),
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Payment database consistency check failed", {
        event: "consistency_check_error",
        checkId,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Check for orphaned payments
   */
  async checkOrphanedPayments() {
    const issues = [];

    try {
      // Find payments with invalid user references
      const paymentsWithInvalidUsers = await Payment.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $match: {
            user: { $size: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            razorpayOrderId: 1,
            amount: 1,
            status: 1,
            createdAt: 1,
          },
        },
      ]);

      for (const payment of paymentsWithInvalidUsers) {
        issues.push({
          type: "orphaned_payment_user",
          severity: "critical",
          paymentId: payment._id,
          userId: payment.userId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message: "Payment references non-existent user",
        });
      }

      // Find payments with invalid plan references
      const paymentsWithInvalidPlans = await Payment.aggregate([
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        {
          $match: {
            plan: { $size: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            planId: 1,
            razorpayOrderId: 1,
            amount: 1,
            status: 1,
            createdAt: 1,
          },
        },
      ]);

      for (const payment of paymentsWithInvalidPlans) {
        issues.push({
          type: "orphaned_payment_plan",
          severity: "critical",
          paymentId: payment._id,
          planId: payment.planId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message: "Payment references non-existent plan",
        });
      }

      return {
        checkName: "orphaned_payments",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking orphaned payments", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for duplicate Razorpay order IDs
   */
  async checkDuplicateOrderIds() {
    const issues = [];

    try {
      const duplicates = await Payment.aggregate([
        {
          $match: {
            razorpayOrderId: { $ne: null, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$razorpayOrderId",
            count: { $sum: 1 },
            payments: {
              $push: {
                id: "$_id",
                userId: "$userId",
                status: "$status",
                amount: "$amount",
                createdAt: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]);

      for (const duplicate of duplicates) {
        issues.push({
          type: "duplicate_razorpay_order_id",
          severity: "critical",
          razorpayOrderId: duplicate._id,
          duplicateCount: duplicate.count,
          payments: duplicate.payments,
          message: `Razorpay order ID ${duplicate._id} is used by ${duplicate.count} payments`,
        });
      }

      return {
        checkName: "duplicate_order_ids",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking duplicate order IDs", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for inconsistent payment statuses
   */
  async checkInconsistentStatuses() {
    const issues = [];

    try {
      // Check for completed payments without Razorpay payment ID
      const completedWithoutPaymentId = await Payment.find({
        status: "completed",
        $or: [
          { razorpayPaymentId: { $exists: false } },
          { razorpayPaymentId: null },
          { razorpayPaymentId: "" },
        ],
      }).select("_id userId razorpayOrderId amount status createdAt");

      for (const payment of completedWithoutPaymentId) {
        issues.push({
          type: "completed_without_payment_id",
          severity: "critical",
          paymentId: payment._id,
          userId: payment.userId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message:
            "Payment marked as completed but missing Razorpay payment ID",
        });
      }

      // Check for completed payments without signature
      const completedWithoutSignature = await Payment.find({
        status: "completed",
        $or: [
          { razorpaySignature: { $exists: false } },
          { razorpaySignature: null },
          { razorpaySignature: "" },
        ],
      }).select(
        "_id userId razorpayOrderId razorpayPaymentId amount status createdAt"
      );

      for (const payment of completedWithoutSignature) {
        issues.push({
          type: "completed_without_signature",
          severity: "warning",
          paymentId: payment._id,
          userId: payment.userId,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message: "Payment marked as completed but missing Razorpay signature",
        });
      }

      return {
        checkName: "inconsistent_statuses",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking inconsistent statuses", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for missing required fields
   */
  async checkMissingRequiredFields() {
    const issues = [];

    try {
      // Check for payments missing request ID
      const missingRequestId = await Payment.find({
        $or: [
          { requestId: { $exists: false } },
          { requestId: null },
          { requestId: "" },
        ],
      }).select("_id userId razorpayOrderId amount status createdAt");

      for (const payment of missingRequestId) {
        issues.push({
          type: "missing_request_id",
          severity: "warning",
          paymentId: payment._id,
          userId: payment.userId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message: "Payment missing request ID for tracking",
        });
      }

      // Check for payments missing Razorpay order ID
      const missingOrderId = await Payment.find({
        $or: [
          { razorpayOrderId: { $exists: false } },
          { razorpayOrderId: null },
          { razorpayOrderId: "" },
        ],
      }).select("_id userId amount status createdAt");

      for (const payment of missingOrderId) {
        issues.push({
          type: "missing_razorpay_order_id",
          severity: "critical",
          paymentId: payment._id,
          userId: payment.userId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          message: "Payment missing Razorpay order ID",
        });
      }

      return {
        checkName: "missing_fields",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking missing required fields", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for payment amount mismatches with plan prices
   */
  async checkAmountMismatches() {
    const issues = [];

    try {
      const mismatches = await Payment.aggregate([
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        {
          $match: {
            plan: { $size: 1 },
          },
        },
        {
          $addFields: {
            planPrice: { $arrayElemAt: ["$plan.price", 0] },
            planName: { $arrayElemAt: ["$plan.name", 0] },
          },
        },
        {
          $match: {
            $expr: { $ne: ["$amount", "$planPrice"] },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            planId: 1,
            amount: 1,
            planPrice: 1,
            planName: 1,
            razorpayOrderId: 1,
            status: 1,
            createdAt: 1,
          },
        },
      ]);

      for (const mismatch of mismatches) {
        issues.push({
          type: "amount_plan_mismatch",
          severity: "warning",
          paymentId: mismatch._id,
          userId: mismatch.userId,
          planId: mismatch.planId,
          planName: mismatch.planName,
          paymentAmount: mismatch.amount,
          planPrice: mismatch.planPrice,
          difference: mismatch.amount - mismatch.planPrice,
          razorpayOrderId: mismatch.razorpayOrderId,
          status: mismatch.status,
          createdAt: mismatch.createdAt,
          message: `Payment amount (${mismatch.amount}) doesn't match plan price (${mismatch.planPrice})`,
        });
      }

      return {
        checkName: "amount_mismatches",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking amount mismatches", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for stale pending payments
   */
  async checkStalePendingPayments(staleHours = 24) {
    const issues = [];

    try {
      const staleThreshold = new Date(Date.now() - staleHours * 60 * 60 * 1000);

      const stalePayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: staleThreshold },
      }).select("_id userId planId razorpayOrderId amount createdAt requestId");

      for (const payment of stalePayments) {
        const hoursOld = Math.floor(
          (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60)
        );

        issues.push({
          type: "stale_pending_payment",
          severity: "warning",
          paymentId: payment._id,
          userId: payment.userId,
          planId: payment.planId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          createdAt: payment.createdAt,
          requestId: payment.requestId,
          hoursOld,
          message: `Payment has been pending for ${hoursOld} hours`,
        });
      }

      return {
        checkName: "stale_pending_payments",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
        staleThresholdHours: staleHours,
      };
    } catch (error) {
      logger.error("Error checking stale pending payments", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for duplicate request IDs
   */
  async checkDuplicateRequestIds() {
    const issues = [];

    try {
      const duplicates = await Payment.aggregate([
        {
          $match: {
            requestId: { $ne: null, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$requestId",
            count: { $sum: 1 },
            payments: {
              $push: {
                id: "$_id",
                userId: "$userId",
                razorpayOrderId: "$razorpayOrderId",
                status: "$status",
                amount: "$amount",
                createdAt: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]);

      for (const duplicate of duplicates) {
        issues.push({
          type: "duplicate_request_id",
          severity: "warning",
          requestId: duplicate._id,
          duplicateCount: duplicate.count,
          payments: duplicate.payments,
          message: `Request ID ${duplicate._id} is used by ${duplicate.count} payments`,
        });
      }

      return {
        checkName: "duplicate_request_ids",
        passed: issues.length === 0,
        issueCount: issues.length,
        issues,
      };
    } catch (error) {
      logger.error("Error checking duplicate request IDs", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Administrative tools for payment status investigation
   */
  async investigatePayment(paymentId, options = {}) {
    const investigationId = `inv_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const startTime = Date.now();

    logger.info("Starting payment investigation", {
      event: "payment_investigation_start",
      investigationId,
      paymentId,
      options,
      timestamp: new Date().toISOString(),
    });

    try {
      const investigation = {
        investigationId,
        paymentId,
        startTime: new Date().toISOString(),
        findings: {},
        recommendations: [],
        summary: {},
      };

      // Get payment details with full population
      const payment = await Payment.findById(paymentId)
        .populate("userId", "name phone email isVerified role createdAt")
        .populate("planId", "name sessions price duration isActive")
        .lean();

      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      investigation.findings.paymentDetails = payment;

      // Check payment history and patterns
      investigation.findings.userPaymentHistory =
        await this.getUserPaymentHistory(
          payment.userId._id,
          options.historyLimit || 10
        );

      // Check for related payments
      investigation.findings.relatedPayments = await this.getRelatedPayments(
        payment,
        options.relatedLimit || 5
      );

      // Analyze payment attempts
      investigation.findings.attemptAnalysis =
        this.analyzePaymentAttempts(payment);

      // Check status history
      investigation.findings.statusAnalysis =
        this.analyzeStatusHistory(payment);

      // Performance analysis
      investigation.findings.performanceAnalysis =
        await this.analyzePaymentPerformance(payment);

      // Generate recommendations
      investigation.recommendations = this.generateInvestigationRecommendations(
        investigation.findings
      );

      // Generate summary
      investigation.summary = this.generateInvestigationSummary(investigation);

      const duration = Date.now() - startTime;
      investigation.endTime = new Date().toISOString();
      investigation.duration = `${duration}ms`;

      logger.info("Payment investigation completed", {
        event: "payment_investigation_complete",
        investigationId,
        paymentId,
        duration: `${duration}ms`,
        recommendationCount: investigation.recommendations.length,
        timestamp: new Date().toISOString(),
      });

      return investigation;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Payment investigation failed", {
        event: "payment_investigation_error",
        investigationId,
        paymentId,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Get user payment history for investigation
   */
  async getUserPaymentHistory(userId, limit = 10) {
    return await Payment.find({ userId })
      .populate("planId", "name price sessions")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get related payments (same order ID, similar timing, etc.)
   */
  async getRelatedPayments(payment, limit = 5) {
    const related = {};

    // Same Razorpay order ID
    if (payment.razorpayOrderId) {
      related.sameOrderId = await Payment.find({
        razorpayOrderId: payment.razorpayOrderId,
        _id: { $ne: payment._id },
      })
        .populate("userId", "name phone")
        .limit(limit)
        .lean();
    }

    // Same request ID
    if (payment.requestId) {
      related.sameRequestId = await Payment.find({
        requestId: payment.requestId,
        _id: { $ne: payment._id },
      })
        .populate("userId", "name phone")
        .limit(limit)
        .lean();
    }

    // Similar timing (within 1 hour)
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const startTime = new Date(payment.createdAt.getTime() - timeWindow);
    const endTime = new Date(payment.createdAt.getTime() + timeWindow);

    related.similarTiming = await Payment.find({
      userId: payment.userId,
      createdAt: { $gte: startTime, $lte: endTime },
      _id: { $ne: payment._id },
    })
      .populate("planId", "name price")
      .limit(limit)
      .lean();

    return related;
  }

  /**
   * Analyze payment attempts
   */
  analyzePaymentAttempts(payment) {
    const analysis = {
      totalAttempts: payment.attempts?.length || 0,
      attemptsByStatus: {},
      firstAttempt: null,
      lastAttempt: null,
      averageTimeBetweenAttempts: 0,
    };

    if (payment.attempts && payment.attempts.length > 0) {
      // Group by status
      payment.attempts.forEach((attempt) => {
        if (!analysis.attemptsByStatus[attempt.status]) {
          analysis.attemptsByStatus[attempt.status] = 0;
        }
        analysis.attemptsByStatus[attempt.status]++;
      });

      // First and last attempts
      const sortedAttempts = payment.attempts.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      analysis.firstAttempt = sortedAttempts[0];
      analysis.lastAttempt = sortedAttempts[sortedAttempts.length - 1];

      // Average time between attempts
      if (sortedAttempts.length > 1) {
        const totalTime =
          new Date(analysis.lastAttempt.timestamp) -
          new Date(analysis.firstAttempt.timestamp);
        analysis.averageTimeBetweenAttempts = Math.round(
          totalTime / (sortedAttempts.length - 1)
        );
      }
    }

    return analysis;
  }

  /**
   * Analyze status history
   */
  analyzeStatusHistory(payment) {
    const analysis = {
      totalStatusChanges: payment.statusHistory?.length || 0,
      statusFlow: [],
      timeInEachStatus: {},
      unusualTransitions: [],
    };

    if (payment.statusHistory && payment.statusHistory.length > 0) {
      const sortedHistory = payment.statusHistory.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Build status flow
      analysis.statusFlow = sortedHistory.map((entry) => ({
        status: entry.status,
        timestamp: entry.timestamp,
        reason: entry.reason,
      }));

      // Calculate time in each status
      for (let i = 0; i < sortedHistory.length; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];

        const timeInStatus = next
          ? new Date(next.timestamp) - new Date(current.timestamp)
          : Date.now() - new Date(current.timestamp);

        if (!analysis.timeInEachStatus[current.status]) {
          analysis.timeInEachStatus[current.status] = 0;
        }
        analysis.timeInEachStatus[current.status] += timeInStatus;
      }

      // Detect unusual transitions
      const validTransitions = {
        pending: ["completed", "failed"],
        completed: ["refunded"],
        failed: ["pending"], // Retry scenarios
        refunded: [], // Terminal state
      };

      for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];

        if (!validTransitions[current.status]?.includes(next.status)) {
          analysis.unusualTransitions.push({
            from: current.status,
            to: next.status,
            timestamp: next.timestamp,
            reason: next.reason,
          });
        }
      }
    }

    return analysis;
  }

  /**
   * Analyze payment performance
   */
  async analyzePaymentPerformance(payment) {
    const analysis = {
      processingTime: null,
      comparisonWithAverage: null,
      performanceRating: "unknown",
    };

    if (payment.attempts && payment.attempts.length > 0) {
      const firstAttempt = payment.attempts.find(
        (a) => a.status === "initiated"
      );
      const completedAttempt = payment.attempts.find(
        (a) => a.status === "completed"
      );

      if (firstAttempt && completedAttempt) {
        analysis.processingTime =
          new Date(completedAttempt.timestamp) -
          new Date(firstAttempt.timestamp);

        // Get average processing time from metrics
        const metrics = paymentLogger.getMetricsSnapshot();
        if (metrics.metrics.averageProcessingTime > 0) {
          analysis.comparisonWithAverage = {
            paymentTime: analysis.processingTime,
            averageTime: metrics.metrics.averageProcessingTime,
            difference:
              analysis.processingTime - metrics.metrics.averageProcessingTime,
            percentageDifference: (
              ((analysis.processingTime -
                metrics.metrics.averageProcessingTime) /
                metrics.metrics.averageProcessingTime) *
              100
            ).toFixed(2),
          };

          // Rate performance
          if (
            analysis.processingTime <
            metrics.metrics.averageProcessingTime * 0.8
          ) {
            analysis.performanceRating = "excellent";
          } else if (
            analysis.processingTime <
            metrics.metrics.averageProcessingTime * 1.2
          ) {
            analysis.performanceRating = "good";
          } else if (
            analysis.processingTime <
            metrics.metrics.averageProcessingTime * 2
          ) {
            analysis.performanceRating = "average";
          } else {
            analysis.performanceRating = "poor";
          }
        }
      }
    }

    return analysis;
  }

  /**
   * Generate investigation recommendations
   */
  generateInvestigationRecommendations(findings) {
    const recommendations = [];

    const payment = findings.paymentDetails;

    // Check payment status
    if (payment.status === "pending") {
      const createdHoursAgo =
        (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60);
      if (createdHoursAgo > 24) {
        recommendations.push({
          type: "action_required",
          priority: "high",
          title: "Stale Pending Payment",
          description: `Payment has been pending for ${Math.floor(
            createdHoursAgo
          )} hours`,
          actions: [
            "Check Razorpay dashboard for order status",
            "Consider marking as failed if no user action",
            "Contact user if payment was attempted",
          ],
        });
      }
    }

    // Check for missing required fields
    if (payment.status === "completed") {
      if (!payment.razorpayPaymentId) {
        recommendations.push({
          type: "data_integrity",
          priority: "critical",
          title: "Missing Payment ID",
          description: "Completed payment is missing Razorpay payment ID",
          actions: [
            "Verify payment in Razorpay dashboard",
            "Update payment record with correct payment ID",
            "Investigate how payment was marked complete without ID",
          ],
        });
      }

      if (!payment.razorpaySignature) {
        recommendations.push({
          type: "security",
          priority: "high",
          title: "Missing Payment Signature",
          description: "Completed payment is missing verification signature",
          actions: [
            "Verify payment authenticity in Razorpay dashboard",
            "Check if signature verification was bypassed",
            "Update security procedures if needed",
          ],
        });
      }
    }

    // Check attempt patterns
    const attemptAnalysis = findings.attemptAnalysis;
    if (attemptAnalysis.totalAttempts > 3) {
      recommendations.push({
        type: "user_experience",
        priority: "medium",
        title: "Multiple Payment Attempts",
        description: `Payment has ${attemptAnalysis.totalAttempts} attempts`,
        actions: [
          "Review user experience during payment flow",
          "Check for technical issues causing retries",
          "Consider improving error messages",
        ],
      });
    }

    // Check performance
    const performanceAnalysis = findings.performanceAnalysis;
    if (performanceAnalysis.performanceRating === "poor") {
      recommendations.push({
        type: "performance",
        priority: "medium",
        title: "Poor Payment Performance",
        description:
          "Payment took significantly longer than average to process",
        actions: [
          "Check system performance during payment time",
          "Review Razorpay API response times",
          "Investigate database performance",
        ],
      });
    }

    // Check for related payment issues
    const related = findings.relatedPayments;
    if (related.sameOrderId && related.sameOrderId.length > 0) {
      recommendations.push({
        type: "data_integrity",
        priority: "critical",
        title: "Duplicate Order ID",
        description: "Multiple payments share the same Razorpay order ID",
        actions: [
          "Investigate how duplicate order IDs were created",
          "Verify which payment is legitimate",
          "Update order ID generation logic if needed",
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate investigation summary
   */
  generateInvestigationSummary(investigation) {
    const findings = investigation.findings;
    const payment = findings.paymentDetails;

    return {
      paymentStatus: payment.status,
      paymentAge: `${Math.floor(
        (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60)
      )} hours`,
      totalAttempts: findings.attemptAnalysis.totalAttempts,
      statusChanges: findings.statusAnalysis.totalStatusChanges,
      performanceRating: findings.performanceAnalysis.performanceRating,
      userPaymentCount: findings.userPaymentHistory.length,
      relatedPaymentCount: Object.values(findings.relatedPayments).flat()
        .length,
      recommendationCount: investigation.recommendations.length,
      criticalIssues: investigation.recommendations.filter(
        (r) => r.priority === "critical"
      ).length,
      highPriorityIssues: investigation.recommendations.filter(
        (r) => r.priority === "high"
      ).length,
    };
  }

  /**
   * Sanitize trace data for logging
   */
  sanitizeTraceData(data) {
    if (!data || typeof data !== "object") return data;

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

    const sanitized = JSON.parse(JSON.stringify(data));

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
   * Sanitize headers for logging
   */
  sanitizeHeaders(headers) {
    if (!headers) return headers;

    const sanitized = { ...headers };
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  sanitizeRequestBody(body) {
    if (!body) return body;
    return this.sanitizeTraceData(body);
  }

  /**
   * Sanitize response body for logging
   */
  sanitizeResponseBody(body) {
    if (!body) return body;
    return this.sanitizeTraceData(body);
  }

  /**
   * Get debug session status
   */
  getDebugSessionStatus(sessionId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      startTime: new Date(session.startTime).toISOString(),
      duration: `${Date.now() - session.startTime}ms`,
      traceCount: session.traces.length,
      metrics: session.metrics,
      options: session.options,
    };
  }

  /**
   * Get all active debug sessions
   */
  getActiveDebugSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.debugSessions.entries()) {
      sessions.push(this.getDebugSessionStatus(sessionId));
    }
    return sessions;
  }

  /**
   * Clear trace buffer
   */
  clearTraceBuffer() {
    const clearedCount = this.traceBuffer.size;
    this.traceBuffer.clear();

    logger.info("Trace buffer cleared", {
      event: "trace_buffer_clear",
      clearedTraces: clearedCount,
      timestamp: new Date().toISOString(),
    });

    return { clearedTraces: clearedCount };
  }

  /**
   * Get debugger statistics
   */
  getDebuggerStats() {
    return {
      activeDebugSessions: this.debugSessions.size,
      traceBufferSize: this.traceBuffer.size,
      maxTraceBufferSize: this.maxTraceBufferSize,
      maxDebugSessions: this.maxDebugSessions,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const paymentDebugger = new PaymentDebugger();
export default paymentDebugger;
