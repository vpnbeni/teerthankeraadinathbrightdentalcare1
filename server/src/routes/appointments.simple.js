import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getAvailableTimeSlots,
  getAvailableDates,
  validateSlotBooking,
  bulkUpdateAppointments,
  getAppointmentStatistics,
} from "../controllers/appointmentController.simple.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Public appointment routes (for authenticated users)
router.get("/available-dates", getAvailableDates);
router.get("/available-slots/:date", getAvailableTimeSlots);
router.post("/validate-slot", validateSlotBooking);
router.get("/:appointmentId", getAppointmentById);

// Admin-only routes
router.use(adminOnly); // All routes below require admin access

// Main appointment management routes
router.get("/admin/all", getAllAppointments);
router.get("/admin/statistics", getAppointmentStatistics);
router.post("/", createAppointment);
router.put("/:appointmentId", updateAppointment);
router.put("/admin/:appointmentId/reschedule", rescheduleAppointment);
router.post("/admin/:appointmentId/cancel", cancelAppointment);
router.put("/admin/:appointmentId/complete", completeAppointment);

// Bulk operations
router.post("/admin/bulk-update", bulkUpdateAppointments);

export default router;
