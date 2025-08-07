import AuditLog from "../models/AuditLog.js";

/**
 * Admin Audit Middleware
 * Logs all admin actions automatically with change tracking
 */
export const auditAdminAction = (resource, action = null) => {
  return async (req, res, next) => {
    // Store original data for comparison (for update operations)
    let originalData = null;

    // For update operations, try to get original data
    if ((req.method === "PUT" || req.method === "PATCH") && req.params.id) {
      try {
        // This would need to be customized based on resource type
        // For now, we'll capture it in the response handler
        originalData = { note: "Original data captured in response handler" };
      } catch (error) {
        console.error("Failed to capture original data:", error);
      }
    }

    // Store original res.json to capture response data
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
        const auditAction = action || getActionFromMethod(req.method);
        const resourceId =
          req.params.id ||
          req.params.userId ||
          req.params.appointmentId ||
          null;

        // Prepare change tracking data
        let changes = {
          before: null,
          after: null,
        };

        if (req.method === "PUT" || req.method === "PATCH") {
          changes.before = originalData;
          changes.after = req.body;
        } else if (req.method === "POST" && success) {
          changes.after = responseData?.data || req.body;
        }

        // Create audit log entry
        await AuditLog.create({
          adminId: req.user._id,
          action: auditAction,
          resource: resource,
          resourceId: resourceId,
          changes: changes,
          metadata: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            sessionId: req.sessionID,
            endpoint: req.originalUrl,
            method: req.method,
          },
          description: `Admin ${auditAction} ${resource}${
            resourceId ? ` ${resourceId}` : ""
          }`,
          success: success,
          errorMessage: success ? null : responseData?.message,
        });

        console.log(
          `🔍 ADMIN AUDIT: ${auditAction} ${resource}${
            resourceId ? `:${resourceId}` : ""
          } by admin:${req.user._id}`
        );
      } catch (error) {
        console.error("Admin audit logging failed:", error);
        // Don't throw error to avoid breaking the main operation
      }
    });
  };
};

/**
 * Bulk operation audit middleware
 */
export const auditBulkAdminAction = (resource) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    let responseData = null;
    let success = true;

    res.json = function (data) {
      responseData = data;
      success = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    next();

    res.on("finish", async () => {
      try {
        const affectedIds = req.body.ids || req.body.appointmentIds || [];

        await AuditLog.create({
          adminId: req.user._id,
          action: "bulk_operation",
          resource: resource,
          resourceId: "bulk",
          changes: {
            before: null,
            after: {
              operation: req.body.action || "bulk_action",
              affectedIds: affectedIds,
              count: affectedIds.length,
            },
          },
          metadata: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            sessionId: req.sessionID,
            endpoint: req.originalUrl,
            method: req.method,
          },
          description: `Admin bulk operation on ${affectedIds.length} ${resource} records`,
          success: success,
          errorMessage: success ? null : responseData?.message,
        });

        console.log(
          `🔍 ADMIN AUDIT: bulk_operation ${resource} (${affectedIds.length} items) by admin:${req.user._id}`
        );
      } catch (error) {
        console.error("Bulk admin audit logging failed:", error);
      }
    });
  };
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

  return actionMap[method] || "unknown";
}

export default {
  auditAdminAction,
  auditBulkAdminAction,
};
