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
import { syncUserSessions } from "../controllers/adminController.js";
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailabilitySettings,
  updateAvailabilitySettings,
  generateAvailability,
  syncHolidays,
} from "../controllers/availabilityController.js";
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
} from "../controllers/settingsController.js";
import {
  getAvailabilityTemplate,
  updateAvailabilityTemplate,
  addTemplateSlot,
  removeTemplateSlot,
  toggleTemplateSlot,
  resetTemplateToDefault,
  getActiveTemplateSlots,
} from "../controllers/availabilityTemplateController.js";
import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  bulkCreateHolidays,
  bulkUpdateHolidays,
  bulkDeleteHolidays,
  checkHoliday,
  getHolidaysInRange,
  getUpcomingHolidays,
  getHolidayStats,
  reactivateHoliday,
} from "../controllers/holidayController.js";
import {
  getCustomDates,
  getCustomDateById,
  createCustomDate,
  updateCustomDate,
  deleteCustomDate,
  bulkCreateCustomDates,
  bulkUpdateCustomDates,
  bulkDeleteCustomDates,
  getCustomDatesInRange,
  previewCustomDates,
} from "../controllers/customDateController.js";
import {
  getCustomTemplates,
  getCustomTemplate,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  copyCustomTemplate,
  getApplicableTemplates,
  previewTemplateSlots,
  bulkUpdateCustomTemplates,
} from "../controllers/customTemplateController.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminOnly);

// Admin routes
router.post("/sync-sessions", syncUserSessions);

// Availability management routes
router.get(
  "/availability",
  validateAdminRequest("adminAnalyticsDateRange"),
  auditAdminAction("availability", "view"),
  getAvailability
);
router.post(
  "/availability",
  validateAdminRequest("createAvailability"),
  auditAdminAction("availability", "create"),
  createAvailability
);
// Availability settings routes (must come BEFORE :id routes)
router.get(
  "/availability/settings",
  auditAdminAction("settings", "view"),
  getAvailabilitySettings
);
router.put(
  "/availability/settings",
  auditAdminAction("settings", "update"),
  updateAvailabilitySettings
);

// Availability generation route
router.post(
  "/availability/generate",
  auditAdminAction("availability", "create"),
  generateAvailability
);

// Holiday sync route
router.post(
  "/availability/sync-holidays",
  auditAdminAction("availability", "update"),
  syncHolidays
);

// Availability template management routes
router.get(
  "/availability/template",
  auditAdminAction("availability_template", "view"),
  getAvailabilityTemplate
);
router.put(
  "/availability/template",
  validateAdminRequest("adminUpdateAvailabilityTemplate"),
  auditAdminAction("availability_template", "update"),
  updateAvailabilityTemplate
);
router.post(
  "/availability/template/slots",
  validateAdminRequest("adminAddTemplateSlot"),
  auditAdminAction("availability_template", "create"),
  addTemplateSlot
);
router.delete(
  "/availability/template/slots/:slotId",
  validateAdminRequest("adminRemoveTemplateSlot"),
  auditAdminAction("availability_template", "delete"),
  removeTemplateSlot
);
router.patch(
  "/availability/template/slots/:slotId/toggle",
  validateAdminRequest("adminRemoveTemplateSlot"),
  auditAdminAction("availability_template", "update"),
  toggleTemplateSlot
);
router.post(
  "/availability/template/reset",
  auditAdminAction("availability_template", "reset"),
  resetTemplateToDefault
);
router.get(
  "/availability/template/active-slots",
  auditAdminAction("availability_template", "view"),
  getActiveTemplateSlots
);

// Holiday management routes
router.get(
  "/availability/holidays",
  auditAdminAction("holiday", "view"),
  getHolidays
);
router.get(
  "/availability/holidays/stats",
  auditAdminAction("holiday", "view"),
  getHolidayStats
);
router.get(
  "/availability/holidays/upcoming",
  auditAdminAction("holiday", "view"),
  getUpcomingHolidays
);
router.get(
  "/availability/holidays/range",
  auditAdminAction("holiday", "view"),
  getHolidaysInRange
);
router.get(
  "/availability/holidays/check/:date",
  auditAdminAction("holiday", "view"),
  checkHoliday
);
router.post(
  "/availability/holidays",
  validateAdminRequest("adminCreateHoliday"),
  auditAdminAction("holiday", "create"),
  createHoliday
);
router.post(
  "/availability/holidays/bulk",
  validateAdminRequest("adminBulkCreateHolidays"),
  auditBulkAdminAction("holiday"),
  bulkCreateHolidays
);
router.put(
  "/availability/holidays/bulk",
  validateAdminRequest("adminBulkUpdateHolidays"),
  auditBulkAdminAction("holiday"),
  bulkUpdateHolidays
);
router.delete(
  "/availability/holidays/bulk",
  validateAdminRequest("adminBulkDeleteHolidays"),
  auditBulkAdminAction("holiday"),
  bulkDeleteHolidays
);
router.get(
  "/availability/holidays/:id",
  auditAdminAction("holiday", "view"),
  getHolidayById
);
router.put(
  "/availability/holidays/:id",
  validateAdminRequest("adminUpdateHoliday"),
  auditAdminAction("holiday", "update"),
  updateHoliday
);
router.delete(
  "/availability/holidays/:id",
  auditAdminAction("holiday", "delete"),
  deleteHoliday
);
router.patch(
  "/availability/holidays/:id/reactivate",
  auditAdminAction("holiday", "update"),
  reactivateHoliday
);

// Custom dates management routes
router.get(
  "/availability/custom-dates",
  auditAdminAction("custom_date", "view"),
  getCustomDates
);
router.get(
  "/availability/custom-dates/range",
  auditAdminAction("custom_date", "view"),
  getCustomDatesInRange
);
router.post(
  "/availability/custom-dates/preview",
  auditAdminAction("custom_date", "view"),
  previewCustomDates
);
router.post(
  "/availability/custom-dates",
  validateAdminRequest("adminCreateCustomDate"),
  auditAdminAction("custom_date", "create"),
  createCustomDate
);
router.post(
  "/availability/custom-dates/bulk",
  validateAdminRequest("adminBulkCreateCustomDates"),
  auditBulkAdminAction("custom_date"),
  bulkCreateCustomDates
);
router.put(
  "/availability/custom-dates/bulk",
  validateAdminRequest("adminBulkUpdateCustomDates"),
  auditBulkAdminAction("custom_date"),
  bulkUpdateCustomDates
);
router.delete(
  "/availability/custom-dates/bulk",
  validateAdminRequest("adminBulkDeleteCustomDates"),
  auditBulkAdminAction("custom_date"),
  bulkDeleteCustomDates
);
router.get(
  "/availability/custom-dates/:id",
  auditAdminAction("custom_date", "view"),
  getCustomDateById
);
router.put(
  "/availability/custom-dates/:id",
  validateAdminRequest("adminUpdateCustomDate"),
  auditAdminAction("custom_date", "update"),
  updateCustomDate
);
router.delete(
  "/availability/custom-dates/:id",
  auditAdminAction("custom_date", "delete"),
  deleteCustomDate
);

// Custom templates management routes
router.get(
  "/custom-templates",
  auditAdminAction("custom_template", "view"),
  getCustomTemplates
);
router.post(
  "/custom-templates",
  auditAdminAction("custom_template", "create"),
  createCustomTemplate
);
router.post(
  "/custom-templates/bulk",
  auditBulkAdminAction("custom_template"),
  bulkUpdateCustomTemplates
);
router.post(
  "/custom-templates/preview",
  auditAdminAction("custom_template", "view"),
  previewTemplateSlots
);
router.get(
  "/custom-templates/applicable/:date",
  auditAdminAction("custom_template", "view"),
  getApplicableTemplates
);
router.get(
  "/custom-templates/:id",
  auditAdminAction("custom_template", "view"),
  getCustomTemplate
);
router.put(
  "/custom-templates/:id",
  auditAdminAction("custom_template", "update"),
  updateCustomTemplate
);
router.delete(
  "/custom-templates/:id",
  auditAdminAction("custom_template", "delete"),
  deleteCustomTemplate
);
router.post(
  "/custom-templates/:id/copy",
  auditAdminAction("custom_template", "create"),
  copyCustomTemplate
);

router.put(
  "/availability/:id",
  validateAdminRequest("updateAvailability"),
  auditAdminAction("availability", "update"),
  updateAvailability
);
router.delete(
  "/availability/:id",
  auditAdminAction("availability", "delete"),
  deleteAvailability
);

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
router.post(
  "/settings/reset",
  auditAdminAction("settings", "reset"),
  resetSettingsToDefault
);

export default router;
