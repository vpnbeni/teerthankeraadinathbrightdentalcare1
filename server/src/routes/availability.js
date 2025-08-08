import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  // Template Management
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplateToDate,
  removeTemplateFromDates,
  
  // Holiday Management
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  
  // Availability Queries
  getAvailabilityForDate,
  getAvailabilityForDateRange,
  checkTimeSlotAvailability,
  getAvailableDates,
} from "../controllers/availabilityController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/availability/date/:date", getAvailabilityForDate);
router.get("/availability/range", getAvailabilityForDateRange);
router.get("/availability/dates", getAvailableDates);
router.post("/availability/check-slot", checkTimeSlotAvailability);

// Protected routes (authentication required)
router.use(auth);

// Admin-only routes for template management
router.get("/templates", adminOnly, getTemplates);
router.get("/templates/:templateId", adminOnly, getTemplate);
router.post("/templates", adminOnly, createTemplate);
router.put("/templates/:templateId", adminOnly, updateTemplate);
router.delete("/templates/:templateId", adminOnly, deleteTemplate);
router.post("/templates/:templateId/apply-dates", adminOnly, applyTemplateToDate);
router.post("/templates/:templateId/remove-dates", adminOnly, removeTemplateFromDates);

// Admin-only routes for holiday management
router.get("/holidays", adminOnly, getHolidays);
router.get("/holidays/:holidayId", adminOnly, getHoliday);
router.post("/holidays", adminOnly, createHoliday);
router.put("/holidays/:holidayId", adminOnly, updateHoliday);
router.delete("/holidays/:holidayId", adminOnly, deleteHoliday);

export default router;