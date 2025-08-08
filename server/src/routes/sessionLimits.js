import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getSessionLimits,
  canBookAppointment,
} from "../controllers/sessionLimitController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

/**
 * @desc    Get user's session limit information
 * @route   GET /api/session-limits
 * @access  Private
 */
router.get("/", getSessionLimits);

/**
 * @desc    Check if user can book appointments
 * @route   GET /api/session-limits/can-book
 * @access  Private
 */
router.get("/can-book", canBookAppointment);

export default router;
