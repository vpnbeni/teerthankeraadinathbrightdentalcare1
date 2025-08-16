import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  auditUserAccess,
  auditDataModification,
} from "../middleware/auditMiddleware.js";
import {
  auditAdminAction,
  auditBulkAdminAction,
} from "../middleware/adminAuditMiddleware.js";
import { validateRequest } from "../middleware/validation.js";
import { validateAdminRequest } from "../middleware/adminValidation.js";
import {
  getAllAppointments,
  getAppointmentDetails,
  rescheduleAppointment,
  completeAppointment,
  adminCancelAppointment,
  bulkCancelAppointments,
  bulkUpdateAppointments,
  getAppointmentStatistics,
} from "../controllers/appointmentController.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserSubscription,
  deleteUser,
  getUserActivity,
  searchUsers,
  getAdminDashboardStats,
  getUserDetails,
  updateUserPersonalInfo,
  updateUserMedicalInfo,
  getUserPayments,
  getUserBookings,
  getRecentUsers,
} from "../controllers/userController.js";
import {
  extendSubscription,
  changeSubscriptionPlan,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import {
  getAdminAppointmentAnalytics,
  getAdminRevenueAnalytics,
  getAdminPatientAnalytics,
  generateAdminReport,
} from "../controllers/analyticsController.js";
import {
  getAuditLogs,
  getAuditLogStats,
  getResourceAuditLogs,
  getAdminAuditLogs,
  exportAuditLogs,
} from "../controllers/auditController.js";
import {
  getSystemSettings,
  updateEmailTemplates,
  updateBusinessRules,
  updateTimeSlotDefaults,
  getSettingsByCategory,
  resetSettingsToDefault,
  updateNotificationEmail,
} from "../controllers/settingsController.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminOnly);

// Admin routes


// Admin appointment management routes
router.get(
  "/appointments",
  validateAdminRequest("adminAnalyticsDateRange"),
  auditAdminAction("appointment", "view"),
  getAllAppointments
);
router.get(
  "/appointments/:appointmentId",
  auditAdminAction("appointment", "view"),
  getAppointmentDetails
);
router.put(
  "/appointments/:appointmentId/reschedule",
  validateAdminRequest("rescheduleAppointment"),
  auditAdminAction("appointment", "reschedule"),
  rescheduleAppointment
);
router.put(
  "/appointments/:appointmentId/complete",
  auditAdminAction("appointment", "update"),
  completeAppointment
);
router.post(
  "/appointments/:appointmentId/cancel",
  validateAdminRequest("adminCancelAppointment"),
  auditAdminAction("appointment", "cancel"),
  adminCancelAppointment
);
router.post(
  "/appointments/bulk-cancel",
  validateAdminRequest("bulkCancelAppointments"),
  auditBulkAdminAction("appointment"),
  bulkCancelAppointments
);
router.post(
  "/appointments/bulk-update",
  auditBulkAdminAction("appointment"),
  bulkUpdateAppointments
);
router.get(
  "/appointments/statistics",
  auditAdminAction("appointment", "view"),
  getAppointmentStatistics
);

// Admin user management routes
router.get("/users", auditAdminAction("user", "view"), getAllUsers);
router.get("/users/recent", auditAdminAction("user", "view"), getRecentUsers);
router.get("/users/:id", auditAdminAction("user", "view"), getUserById);
router.put("/users/:id", auditAdminAction("user", "update"), updateUser);
router.put(
  "/users/:id/subscription",
  auditAdminAction("subscription", "update"),
  updateUserSubscription
);
router.delete("/users/:id", auditAdminAction("user", "delete"), deleteUser);
router.get(
  "/users/:id/activity",
  auditAdminAction("user", "view"),
  getUserActivity
);
router.post("/users/search", auditAdminAction("user", "view"), searchUsers);
router.get(
  "/dashboard/stats",
  auditAdminAction("system", "view"),
  getAdminDashboardStats
);

// Comprehensive user management endpoints
router.get(
  "/users/:id/details",
  auditUserAccess,
  auditAdminAction("user", "view"),
  getUserDetails
);
router.put(
  "/users/:id/personal",
  validateAdminRequest("adminUpdateUserPersonalInfo"),
  auditDataModification("User", "PHI"),
  auditAdminAction("user", "update"),
  updateUserPersonalInfo
);
router.put(
  "/users/:id/medical",
  validateAdminRequest("adminUpdateUserMedicalInfo"),
  auditDataModification("User", "PHI"),
  auditAdminAction("user", "update"),
  updateUserMedicalInfo
);
router.get(
  "/users/:id/payments",
  auditUserAccess,
  auditAdminAction("user", "view"),
  getUserPayments
);
router.get(
  "/users/:id/bookings",
  auditUserAccess,
  auditAdminAction("user", "view"),
  getUserBookings
);

// Subscription management endpoints
router.put(
  "/users/:id/subscription/extend",
  validateAdminRequest("adminExtendSubscription"),
  auditDataModification("User", "subscription"),
  auditAdminAction("subscription", "extend_subscription"),
  extendSubscription
);
router.put(
  "/users/:id/subscription/change-plan",
  validateAdminRequest("adminChangeSubscriptionPlan"),
  auditDataModification("User", "subscription"),
  auditAdminAction("subscription", "change_plan"),
  changeSubscriptionPlan
);
router.put(
  "/users/:id/subscription/cancel",
  validateAdminRequest("adminCancelSubscription"),
  auditDataModification("User", "subscription"),
  auditAdminAction("subscription", "cancel_subscription"),
  cancelSubscription
);

// Analytics and reporting endpoints
router.get(
  "/analytics/appointments",
  validateAdminRequest("adminAnalyticsDateRange"),
  auditAdminAction("system", "view"),
  getAdminAppointmentAnalytics
);
router.get(
  "/analytics/revenue",
  validateAdminRequest("adminAnalyticsDateRange"),
  auditAdminAction("system", "view"),
  getAdminRevenueAnalytics
);
router.get(
  "/analytics/patients",
  validateAdminRequest("adminAnalyticsDateRange"),
  auditAdminAction("system", "view"),
  getAdminPatientAnalytics
);
router.post(
  "/reports/generate",
  validateAdminRequest("adminGenerateReport"),
  auditAdminAction("system", "create"),
  generateAdminReport
);

// Audit logging endpoints
router.get(
  "/audit-logs",
  validateAdminRequest("adminAuditLogFilters"),
  auditAdminAction("system", "view"),
  getAuditLogs
);
router.get(
  "/audit-logs/stats",
  auditAdminAction("system", "view"),
  getAuditLogStats
);
router.get(
  "/audit-logs/export",
  validateAdminRequest("adminAuditLogFilters"),
  auditAdminAction("system", "view"),
  exportAuditLogs
);
router.get(
  "/audit-logs/resource/:resource/:resourceId",
  auditAdminAction("system", "view"),
  getResourceAuditLogs
);
router.get(
  "/audit-logs/admin/:adminId",
  auditAdminAction("system", "view"),
  getAdminAuditLogs
);

// System settings management endpoints
router.get(
  "/settings",
  auditAdminAction("settings", "view"),
  getSystemSettings
);
router.get(
  "/settings/:category",
  auditAdminAction("settings", "view"),
  getSettingsByCategory
);
router.put(
  "/settings/email-templates",
  validateAdminRequest("adminUpdateEmailTemplates"),
  auditAdminAction("settings", "update"),
  updateEmailTemplates
);
router.put(
  "/settings/business-rules",
  validateAdminRequest("adminUpdateBusinessRules"),
  auditAdminAction("settings", "update"),
  updateBusinessRules
);
router.put(
  "/settings/time-slots",
  validateAdminRequest("adminUpdateTimeSlotDefaults"),
  auditAdminAction("settings", "update"),
  updateTimeSlotDefaults
);
router.put(
  "/settings/notification-email",
  validateAdminRequest("adminUpdateNotificationEmail"),
  auditAdminAction("settings", "update"),
  updateNotificationEmail
);
router.post(
  "/settings/reset",
  auditAdminAction("settings", "reset"),
  resetSettingsToDefault
);

export default router;
