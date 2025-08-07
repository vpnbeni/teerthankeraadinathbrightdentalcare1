import api from "./api.js";

/**
 * Audit Log Service
 * Handles all audit log related API calls
 */
class AuditService {
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params = {}) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      adminId,
      action,
      resource,
      resourceId,
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (adminId) queryParams.append("adminId", adminId);
    if (action) queryParams.append("action", action);
    if (resource) queryParams.append("resource", resource);
    if (resourceId) queryParams.append("resourceId", resourceId);

    const response = await api.get(`/admin/audit-logs?${queryParams}`);
    return response.data;
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(params = {}) {
    const { startDate, endDate } = params;

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const response = await api.get(`/admin/audit-logs/stats?${queryParams}`);
    return response.data;
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(resource, resourceId, params = {}) {
    const { page = 1, limit = 20 } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await api.get(
      `/admin/audit-logs/resource/${resource}/${resourceId}?${queryParams}`
    );
    return response.data;
  }

  /**
   * Get audit logs for a specific admin user
   */
  async getAdminAuditLogs(adminId, params = {}) {
    const { page = 1, limit = 20, startDate, endDate } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const response = await api.get(
      `/admin/audit-logs/admin/${adminId}?${queryParams}`
    );
    return response.data;
  }

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs(params = {}) {
    const {
      startDate,
      endDate,
      adminId,
      action,
      resource,
      resourceId,
      format = "csv",
    } = params;

    const queryParams = new URLSearchParams({ format });

    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (adminId) queryParams.append("adminId", adminId);
    if (action) queryParams.append("action", action);
    if (resource) queryParams.append("resource", resource);
    if (resourceId) queryParams.append("resourceId", resourceId);

    const response = await api.get(`/admin/audit-logs/export?${queryParams}`, {
      responseType: "blob",
    });

    // Create download link
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Audit logs exported successfully" };
  }

  /**
   * Get available filter options
   */
  async getFilterOptions() {
    // These are based on the AuditLog model schema
    return {
      actions: [
        "create",
        "update",
        "delete",
        "view",
        "cancel",
        "reschedule",
        "extend_subscription",
        "change_plan",
        "cancel_subscription",
        "bulk_operation",
        "login",
        "logout",
      ],
      resources: [
        "user",
        "appointment",
        "availability",
        "subscription",
        "settings",
        "system",
      ],
    };
  }
}

export default new AuditService();
