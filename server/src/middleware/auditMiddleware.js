import { auditService } from "../services/auditService.js";

/**
 * Audit Middleware for HIPAA Compliance
 * Logs all API requests that access or modify healthcare data
 */

/**
 * General audit logging middleware
 */
export const auditRequest = (
  resourceType = "System",
  hipaaCategory = "SYSTEM"
) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData = null;
    let success = true;

    res.json = function (data) {
      responseData = data;
      success = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    // Continue with request
    next();

    // Log after response is sent
    res.on("finish", async () => {
      try {
        const resourceId =
          req.params.id ||
          req.params.userId ||
          req.params.appointmentId ||
          "unknown";
        const patientId =
          req.params.userId ||
          req.body.userId ||
          (req.user?.role === "patient" ? req.user._id : null);

        await auditService.logAction({
          userId: req.user?._id || "anonymous",
          userRole: req.user?.role || "unknown",
          action: getActionFromMethod(req.method),
          resourceType,
          resourceId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
          method: req.method,
          success,
          errorMessage: success ? null : responseData?.message,
          patientId,
          hipaaCategory,
          description: `${req.method} ${req.originalUrl}`,
        });
      } catch (error) {
        console.error("Audit logging failed:", error);
      }
    });
  };
};

/**
 * PHI access audit middleware
 */
export const auditPHIAccess = auditRequest("MedicalRecord", "PHI");

/**
 * User data access audit middleware
 */
export const auditUserAccess = auditRequest("User", "PHI");

/**
 * Appointment access audit middleware
 */
export const auditAppointmentAccess = auditRequest("Appointment", "PHI");

/**
 * Session access audit middleware
 */
export const auditSessionAccess = auditRequest("Session", "PHI");

/**
 * Payment access audit middleware
 */
export const auditPaymentAccess = auditRequest("Payment", "ADMINISTRATIVE");

/**
 * Document access audit middleware
 */
export const auditDocumentAccess = auditRequest("Document", "ePHI");

/**
 * Authentication audit middleware
 */
export const auditAuthAccess = (req, res, next) => {
  const originalJson = res.json;
  let success = true;
  let responseData = null;

  res.json = function (data) {
    responseData = data;
    success = res.statusCode < 400;
    return originalJson.call(this, data);
  };

  next();

  res.on("finish", async () => {
    try {
      const action = getAuthAction(req.originalUrl);

      // For auth events, we need to handle userId differently
      let userId = null;
      let userRole = "user"; // Default role for new registrations

      if (req.user?._id) {
        // User is authenticated, use their ID and role
        userId = req.user._id;
        userRole = req.user.role;
      } else if (success && responseData?.data?.user?.id) {
        // Successful auth operation that returns user data
        userId = responseData.data.user.id;
        userRole = responseData.data.user.role || "user";
      } else {
        // For failed auth or registration attempts, create a system entry
        userId = null;
        userRole = "anonymous";
      }

      await auditService.logAuth(
        userId,
        action,
        req.ip || req.connection.remoteAddress,
        req.get("User-Agent"),
        success,
        success ? null : responseData?.message || "Authentication failed",
        userRole // Pass the userRole
      );
    } catch (error) {
      console.error("Auth audit logging failed:", error);
    }
  });
};

/**
 * Data modification audit middleware
 */
export const auditDataModification = (resourceType, hipaaCategory = "PHI") => {
  return async (req, res, next) => {
    // Capture original data for comparison
    let originalData = null;

    if (req.method === "PUT" || req.method === "PATCH") {
      try {
        // This would need to be customized based on the resource type
        // For now, we'll just log that data was modified
        originalData = { note: "Original data not captured" };
      } catch (error) {
        console.error("Failed to capture original data:", error);
      }
    }

    const originalJson = res.json;
    let success = true;
    let responseData = null;

    res.json = function (data) {
      responseData = data;
      success = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    next();

    res.on("finish", async () => {
      try {
        const action = getActionFromMethod(req.method);
        const resourceId =
          req.params.id ||
          req.params.userId ||
          req.params.appointmentId ||
          "unknown";
        const patientId =
          req.params.userId ||
          req.body.userId ||
          (req.user?.role === "patient" ? req.user._id : null);

        await auditService.logDataModification(
          req.user?._id || "system",
          req.user?.role || "system",
          action,
          resourceType,
          resourceId,
          originalData,
          req.body,
          req.ip || req.connection.remoteAddress,
          patientId
        );
      } catch (error) {
        console.error("Data modification audit failed:", error);
      }
    });
  };
};

/**
 * Bulk operation audit middleware
 */
export const auditBulkOperation = (resourceType, hipaaCategory = "PHI") => {
  return async (req, res, next) => {
    const originalJson = res.json;
    let success = true;
    let responseData = null;

    res.json = function (data) {
      responseData = data;
      success = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    next();

    res.on("finish", async () => {
      try {
        await auditService.logAction({
          userId: req.user?._id || "system",
          userRole: req.user?.role || "system",
          action: "BULK_OPERATION",
          resourceType,
          resourceId: "bulk",
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
          method: req.method,
          success,
          errorMessage: success ? null : responseData?.message,
          hipaaCategory,
          description: `Bulk ${req.method} operation on ${resourceType}`,
        });
      } catch (error) {
        console.error("Bulk operation audit failed:", error);
      }
    });
  };
};

/**
 * Admin action audit middleware
 */
export const auditAdminAction = (req, res, next) => {
  const originalJson = res.json;
  let success = true;

  res.json = function (data) {
    success = res.statusCode < 400;
    return originalJson.call(this, data);
  };

  next();

  res.on("finish", async () => {
    try {
      await auditService.logAction({
        userId: req.user?._id || "system",
        userRole: "admin",
        action: "view",
        resourceType: "System",
        resourceId: "admin_action",
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        method: req.method,
        success,
        hipaaCategory: "ADMINISTRATIVE",
        description: `Admin action: ${req.method} ${req.originalUrl}`,
      });
    } catch (error) {
      console.error("Admin action audit failed:", error);
    }
  });
};

/**
 * Helper function to get action from HTTP method
 */
function getActionFromMethod(method) {
  const actionMap = {
    GET: "view",
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };

  return actionMap[method] || "view";
}

/**
 * Helper function to get auth action from URL
 */
function getAuthAction(url) {
  if (url.includes("/login")) return "login";
  if (url.includes("/logout")) return "logout";
  if (url.includes("/register")) return "create";
  if (url.includes("/verify")) return "view";
  if (url.includes("/reset-password")) return "update";
  if (url.includes("/change-password")) return "update";
  return "view";
}

/**
 * Middleware to log sensitive data exports
 */
export const auditDataExport = (req, res, next) => {
  const originalJson = res.json;
  let success = true;

  res.json = function (data) {
    success = res.statusCode < 400;
    return originalJson.call(this, data);
  };

  next();

  res.on("finish", async () => {
    try {
      const resourceId = req.params.userId || req.params.id || "unknown";

      await auditService.logAction({
        userId: req.user?._id || "system",
        userRole: req.user?.role || "admin",
        action: "DATA_EXPORT",
        resourceType: "User",
        resourceId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        method: req.method,
        success,
        patientId: resourceId,
        hipaaCategory: "PHI",
        description: "Patient data exported for HIPAA compliance",
      });
    } catch (error) {
      console.error("Data export audit failed:", error);
    }
  });
};

export default {
  auditRequest,
  auditPHIAccess,
  auditUserAccess,
  auditAppointmentAccess,
  auditSessionAccess,
  auditPaymentAccess,
  auditDocumentAccess,
  auditAuthAccess,
  auditDataModification,
  auditBulkOperation,
  auditAdminAction,
  auditDataExport,
};
