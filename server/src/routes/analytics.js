import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getAppointmentAnalytics,
  getSessionAnalytics,
  getUserAnalytics,
  generateCustomReport,
  getAdminAppointmentAnalytics,
  getAdminRevenueAnalytics,
  getAdminPatientAnalytics,
  generateAdminReport,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// General analytics routes (for regular users)
router.get("/dashboard", getDashboardAnalytics);
router.get("/revenue", getRevenueAnalytics);
router.get("/appointments", getAppointmentAnalytics);
router.get("/sessions", getSessionAnalytics);
router.get("/users", getUserAnalytics);
router.post("/custom-report", generateCustomReport);

// Admin-specific analytics routes
router.use(adminOnly); // Admin authorization for routes below

router.get("/admin/appointments", getAdminAppointmentAnalytics);
router.get("/admin/revenue", getAdminRevenueAnalytics);
router.get("/admin/patients", getAdminPatientAnalytics);
router.post("/admin/reports/generate", generateAdminReport);

export default router;
