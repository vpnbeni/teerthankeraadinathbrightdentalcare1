import crypto from "crypto";

export function generateRequestId() {
  return crypto.randomBytes(16).toString("hex");
}

export function extractClientInfo(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    referer: req.get("referer"),
    acceptLanguage: req.get("accept-language"),
  };
}

export function sanitizeForLogging(data) {
  const sensitiveFields = [
    "password",
    "token",
    "key",
    "secret",
    "authorization",
  ];

  if (!data) return data;

  if (typeof data === "object" && !Array.isArray(data)) {
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = sanitizeForLogging(sanitized[key]);
      }
    }
    return sanitized;
  }

  return data;
}

export function logRequestStart(requestId, operation, data = {}) {
  console.log(`[${requestId}] 🚀 Starting ${operation}`, {
    timestamp: new Date().toISOString(),
    ...sanitizeForLogging(data),
  });
}

export function logRequestComplete(requestId, operation, startTime, data = {}) {
  const duration = Date.now() - startTime;
  console.log(`[${requestId}] ✅ Completed ${operation} in ${duration}ms`, {
    timestamp: new Date().toISOString(),
    duration,
    ...sanitizeForLogging(data),
  });
}

export function logRequestError(
  requestId,
  operation,
  startTime,
  error,
  data = {}
) {
  const duration = Date.now() - startTime;
  console.error(`[${requestId}] ❌ Error in ${operation} after ${duration}ms`, {
    timestamp: new Date().toISOString(),
    duration,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
    ...sanitizeForLogging(data),
  });
}

export function createSuccessResponse(data, message, requestId, metadata = {}) {
  return {
    success: true,
    data,
    message,
    requestId,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}
