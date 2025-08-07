import { paymentDebugger } from "../services/paymentDebugger.js";
import { generateRequestId } from "../utils/requestUtils.js";

/**
 * Payment Debug Middleware
 * Captures detailed request/response information for payment operations
 */

export const paymentDebugMiddleware = (req, res, next) => {
  // Only apply to payment-related routes
  if (!req.path.includes("/payments")) {
    return next();
  }

  const requestId = req.headers["x-request-id"] || generateRequestId();
  const startTime = Date.now();

  // Store request ID for use in controllers
  req.requestId = requestId;
  req.debugStartTime = startTime;

  // Capture request details
  const requestData = {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user
      ? {
          id: req.user._id,
          role: req.user.role,
          phone: "[REDACTED]",
        }
      : null,
    clientInfo: {
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
      origin: req.get("Origin"),
    },
    timestamp: new Date().toISOString(),
  };

  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;

  // Override response methods to capture response data
  res.send = function (body) {
    const processingTime = Date.now() - startTime;

    // Log detailed request/response
    paymentDebugger.logDetailedRequest(
      requestId,
      `${req.method} ${req.path}`,
      req,
      {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: body,
        processingTime: `${processingTime}ms`,
      }
    );

    // Call original send method
    return originalSend.call(this, body);
  };

  res.json = function (obj) {
    const processingTime = Date.now() - startTime;

    // Log detailed request/response
    paymentDebugger.logDetailedRequest(
      requestId,
      `${req.method} ${req.path}`,
      req,
      {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: obj,
        processingTime: `${processingTime}ms`,
      }
    );

    // Call original json method
    return originalJson.call(this, obj);
  };

  // Handle errors
  const originalNext = next;
  next = function (error) {
    if (error) {
      const processingTime = Date.now() - startTime;

      // Log detailed request with error
      paymentDebugger.logDetailedRequest(
        requestId,
        `${req.method} ${req.path}`,
        req,
        null,
        error
      );
    }

    return originalNext(error);
  };

  next();
};

export default paymentDebugMiddleware;
