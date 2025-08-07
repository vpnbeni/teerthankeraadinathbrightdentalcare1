import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getSessionLimits,
  canBookAppointment,
} from "../controllers/sessionLimitController.js";

const router = express.Router();

router.use(auth);
router.get("/", getSessionLimits);
router.get("/can-book", canBookAppointment);

export default router;
