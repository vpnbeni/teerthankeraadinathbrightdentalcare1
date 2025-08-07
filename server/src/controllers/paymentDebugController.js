import { paymentDebugger } from "../services/paymentDebugger.js";
import { paymentLogger } from "../services/paymentLogger.js";
import logger from "../utils/logger.js";
import {
  generateRequestId,
  extractClientInfo,
  createErrorResponse,
  createSuccessResponse,
  logRequestStart,
  logRequestComplete,
  logRequestError,
  sanitizeForLogging,
} from "../utils/requestUtils.js";
import {
  ValidationError,
  AuthenticationError,
  createPaymentErrorResponse,
} from "../utils/paymentErrors.js";

/**
 * Payment Debug Controller
 * Provides administrative endpoints for payment debugging and troubleshooting
 */

/**
 * @desc    Start a debug session for payment operations
 * @route   POST /api/payments/admin/debug/session/start
 * @access  Private (Admin)
 */
export const startDebugSession = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Start Debug Session", {
      userId: req.user?._id,
      userRole: req.user?.role,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const { sessionId, options = {} } = req.body;

    if (!sessionId) {
      throw new ValidationError(
        "Session ID is required",
        "MISSING_SESSION_ID",
        { requestId }
      );
    }

    // Validate session ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      throw new ValidationError(
        "Invalid session ID format. Use alphanumeric characters, hyphens, and underscores only.",
        "INVALID_SESSION_ID_FORMAT",
        { sessionId, requestId }
      );
    }

    const session = paymentDebugger.startDebugSession(sessionId, options);

    logRequestComplete(requestId, "Start Debug Session", startTime, {
      sessionId,
      userId: req.user._id,
      options: session.options,
    });

    const response = createSuccessResponse(
      { session },
      "Debug session started successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        sessionId,
      }
    );

    res.status(201).json(response);
  } catch (error) {
    logRequestError(requestId, "Start Debug Session", startTime, error, {
      userId: req.user?._id,
      sessionId: req.body?.sessionId,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to start debug session",
        "DEBUG_SESSION_START_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Stop a debug session and get summary
 * @route   POST /api/payments/admin/debug/session/:sessionId/stop
 * @access  Private (Admin)
 */
export const stopDebugSession = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Stop Debug Session", {
      userId: req.user?._id,
      sessionId: req.params?.sessionId,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError(
        "Session ID is required",
        "MISSING_SESSION_ID",
        { requestId }
      );
    }

    const summary = paymentDebugger.stopDebugSession(sessionId);

    logRequestComplete(requestId, "Stop Debug Session", startTime, {
      sessionId,
      userId: req.user._id,
      totalTraces: summary.totalTraces,
    });

    const response = createSuccessResponse(
      { summary },
      "Debug session stopped successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        sessionId,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Stop Debug Session", startTime, error, {
      userId: req.user?._id,
      sessionId: req.params?.sessionId,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 404;
      errorResponse = createErrorResponse(
        error.message || "Failed to stop debug session",
        "DEBUG_SESSION_STOP_FAILED",
        404,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Get debug session status
 * @route   GET /api/payments/admin/debug/session/:sessionId
 * @access  Private (Admin)
 */
export const getDebugSessionStatus = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Get Debug Session Status", {
      userId: req.user?._id,
      sessionId: req.params?.sessionId,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError(
        "Session ID is required",
        "MISSING_SESSION_ID",
        { requestId }
      );
    }

    const status = paymentDebugger.getDebugSessionStatus(sessionId);

    if (!status) {
      throw new ValidationError(
        `Debug session ${sessionId} not found`,
        "DEBUG_SESSION_NOT_FOUND",
        { sessionId, requestId }
      );
    }

    logRequestComplete(requestId, "Get Debug Session Status", startTime, {
      sessionId,
      userId: req.user._id,
      traceCount: status.traceCount,
    });

    const response = createSuccessResponse(
      { status },
      "Debug session status retrieved successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        sessionId,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Get Debug Session Status", startTime, error, {
      userId: req.user?._id,
      sessionId: req.params?.sessionId,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to get debug session status",
        "DEBUG_SESSION_STATUS_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Get all active debug sessions
 * @route   GET /api/payments/admin/debug/sessions
 * @access  Private (Admin)
 */
export const getActiveDebugSessions = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Get Active Debug Sessions", {
      userId: req.user?._id,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const sessions = paymentDebugger.getActiveDebugSessions();

    logRequestComplete(requestId, "Get Active Debug Sessions", startTime, {
      userId: req.user._id,
      sessionCount: sessions.length,
    });

    const response = createSuccessResponse(
      { sessions, count: sessions.length },
      "Active debug sessions retrieved successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Get Active Debug Sessions", startTime, error, {
      userId: req.user?._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to get active debug sessions",
        "DEBUG_SESSIONS_RETRIEVAL_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Get request trace by request ID
 * @route   GET /api/payments/admin/debug/trace/:requestId
 * @access  Private (Admin)
 */
export const getRequestTrace = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Get Request Trace", {
      userId: req.user?._id,
      traceRequestId: req.params?.requestId,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const { requestId: traceRequestId } = req.params;

    if (!traceRequestId) {
      throw new ValidationError(
        "Request ID is required",
        "MISSING_REQUEST_ID",
        { requestId }
      );
    }

    const trace = paymentDebugger.getRequestTrace(traceRequestId);

    logRequestComplete(requestId, "Get Request Trace", startTime, {
      userId: req.user._id,
      traceRequestId,
      traceCount: trace.length,
    });

    const response = createSuccessResponse(
      {
        requestId: traceRequestId,
        trace,
        traceCount: trace.length,
      },
      "Request trace retrieved successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        traceRequestId,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Get Request Trace", startTime, error, {
      userId: req.user?._id,
      traceRequestId: req.params?.requestId,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to get request trace",
        "REQUEST_TRACE_RETRIEVAL_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Get all traces for debugging
 * @route   GET /api/payments/admin/debug/traces
 * @access  Private (Admin)
 */
export const getAllTraces = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Get All Traces", {
      userId: req.user?._id,
      limit: req.query?.limit,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const traces = paymentDebugger.getAllTraces(limit);

    logRequestComplete(requestId, "Get All Traces", startTime, {
      userId: req.user._id,
      limit,
      traceCount: traces.length,
    });

    const response = createSuccessResponse(
      {
        traces,
        count: traces.length,
        limit,
      },
      "All traces retrieved successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Get All Traces", startTime, error, {
      userId: req.user?._id,
      limit: req.query?.limit,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to get all traces",
        "ALL_TRACES_RETRIEVAL_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Perform database consistency check
 * @route   POST /api/payments/admin/debug/consistency-check
 * @access  Private (Admin)
 */
export const performConsistencyCheck = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Perform Consistency Check", {
      userId: req.user?._id,
      options: req.body,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const options = req.body || {};

    // Validate options
    if (
      options.stalePendingHours &&
      (options.stalePendingHours < 1 || options.stalePendingHours > 168)
    ) {
      throw new ValidationError(
        "stalePendingHours must be between 1 and 168 (1 week)",
        "INVALID_STALE_PENDING_HOURS",
        { stalePendingHours: options.stalePendingHours, requestId }
      );
    }

    const results = await paymentDebugger.performConsistencyCheck(options);

    logRequestComplete(requestId, "Perform Consistency Check", startTime, {
      userId: req.user._id,
      checkId: results.checkId,
      totalIssues: results.summary.totalIssues,
      criticalIssues: results.summary.criticalIssues,
    });

    const response = createSuccessResponse(
      { results },
      "Database consistency check completed successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        checkId: results.checkId,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Perform Consistency Check", startTime, error, {
      userId: req.user?._id,
      options: req.body,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to perform consistency check",
        "CONSISTENCY_CHECK_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Investigate specific payment
 * @route   POST /api/payments/admin/debug/investigate/:paymentId
 * @access  Private (Admin)
 */
export const investigatePayment = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Investigate Payment", {
      userId: req.user?._id,
      paymentId: req.params?.paymentId,
      options: req.body,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ValidationError(
        "Payment ID is required",
        "MISSING_PAYMENT_ID",
        { requestId }
      );
    }

    // Validate payment ID format
    if (!/^[0-9a-fA-F]{24}$/.test(paymentId)) {
      throw new ValidationError(
        "Invalid payment ID format",
        "INVALID_PAYMENT_ID_FORMAT",
        { paymentId, requestId }
      );
    }

    const options = req.body || {};

    // Validate options
    if (
      options.historyLimit &&
      (options.historyLimit < 1 || options.historyLimit > 100)
    ) {
      throw new ValidationError(
        "historyLimit must be between 1 and 100",
        "INVALID_HISTORY_LIMIT",
        { historyLimit: options.historyLimit, requestId }
      );
    }

    if (
      options.relatedLimit &&
      (options.relatedLimit < 1 || options.relatedLimit > 50)
    ) {
      throw new ValidationError(
        "relatedLimit must be between 1 and 50",
        "INVALID_RELATED_LIMIT",
        { relatedLimit: options.relatedLimit, requestId }
      );
    }

    const investigation = await paymentDebugger.investigatePayment(
      paymentId,
      options
    );

    logRequestComplete(requestId, "Investigate Payment", startTime, {
      userId: req.user._id,
      paymentId,
      investigationId: investigation.investigationId,
      recommendationCount: investigation.recommendations.length,
    });

    const response = createSuccessResponse(
      { investigation },
      "Payment investigation completed successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
        investigationId: investigation.investigationId,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Investigate Payment", startTime, error, {
      userId: req.user?._id,
      paymentId: req.params?.paymentId,
      options: req.body,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to investigate payment",
        "PAYMENT_INVESTIGATION_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Clear trace buffer
 * @route   POST /api/payments/admin/debug/clear-traces
 * @access  Private (Admin)
 */
export const clearTraceBuffer = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Clear Trace Buffer", {
      userId: req.user?._id,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const result = paymentDebugger.clearTraceBuffer();

    logRequestComplete(requestId, "Clear Trace Buffer", startTime, {
      userId: req.user._id,
      clearedTraces: result.clearedTraces,
    });

    const response = createSuccessResponse(
      result,
      "Trace buffer cleared successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Clear Trace Buffer", startTime, error, {
      userId: req.user?._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to clear trace buffer",
        "CLEAR_TRACE_BUFFER_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};

/**
 * @desc    Get debugger statistics
 * @route   GET /api/payments/admin/debug/stats
 * @access  Private (Admin)
 */
export const getDebuggerStats = async (req, res) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);

  try {
    logRequestStart(requestId, "Get Debugger Stats", {
      userId: req.user?._id,
      clientInfo: sanitizeForLogging(clientInfo),
    });

    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new AuthenticationError(
        "Access denied. Admin privileges required.",
        { userId: req.user?._id, requiredRole: "admin" }
      );
    }

    const stats = paymentDebugger.getDebuggerStats();

    logRequestComplete(requestId, "Get Debugger Stats", startTime, {
      userId: req.user._id,
      activeDebugSessions: stats.activeDebugSessions,
      traceBufferSize: stats.traceBufferSize,
    });

    const response = createSuccessResponse(
      { stats },
      "Debugger statistics retrieved successfully",
      requestId,
      {
        processingTime: `${Date.now() - startTime}ms`,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logRequestError(requestId, "Get Debugger Stats", startTime, error, {
      userId: req.user?._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    let statusCode = 500;
    let errorResponse;

    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode;
      errorResponse = createPaymentErrorResponse(error, requestId);
    } else {
      statusCode = 500;
      errorResponse = createErrorResponse(
        error.message || "Failed to get debugger statistics",
        "DEBUGGER_STATS_FAILED",
        500,
        requestId,
        {
          processingTime: `${Date.now() - startTime}ms`,
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
          }),
        }
      );
    }

    res.status(statusCode).json(errorResponse);
  }
};
