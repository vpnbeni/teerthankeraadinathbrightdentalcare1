import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  getUserAppointments,
  createAppointment,
  getAvailableTimeSlots,
  getAvailableDates,
  validateSlotBooking,
  cancelAppointment,
  getAllAppointments,
  rescheduleAppointment,
  completeAppointment,
  adminCancelAppointment,
  bulkCancelAppointments,
  bulkUpdateAppointments,
  getAppointmentStatistics,
  getAppointmentDetails,
  updateAppointment,
  confirmAppointment,
  adminUpdateAppointment,
  addFollowUp,
  updateFollowUpStatus,
  getFollowUps,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.use(auth);

// Admin routes (protected with adminOnly middleware)
router.get("/admin/all", adminOnly, getAllAppointments);
router.get("/admin/statistics", adminOnly, getAppointmentStatistics);
router.put(
  "/admin/:appointmentId/reschedule",
  adminOnly,
  rescheduleAppointment
);
router.put("/admin/:appointmentId/confirm", adminOnly, confirmAppointment);
router.put("/admin/:appointmentId/complete", adminOnly, completeAppointment);
router.put("/admin/:appointmentId/update", adminOnly, adminUpdateAppointment);
router.post("/admin/:appointmentId/cancel", adminOnly, adminCancelAppointment);
router.post("/admin/bulk-cancel", adminOnly, bulkCancelAppointments);
router.post("/admin/bulk-update", adminOnly, bulkUpdateAppointments);

// Follow-up routes (admin only)
router.post("/:id/followup", adminOnly, addFollowUp);
router.put("/:id/followup/:followupId", adminOnly, updateFollowUpStatus);
router.get("/:id/followups", getFollowUps);

// User routes
router.get("/", getUserAppointments);
router.get("/available-dates", getAvailableDates);
router.get("/available-slots/:date", getAvailableTimeSlots);
router.post("/validate-slot", validateSlotBooking);
router.get("/:appointmentId", getAppointmentDetails);
router.post("/", createAppointment);
router.put("/:appointmentId", updateAppointment);
router.delete("/:appointmentId", cancelAppointment);

export default router;
