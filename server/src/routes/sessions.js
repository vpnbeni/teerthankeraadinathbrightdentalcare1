import express from "express";
import { auth } from "../middleware/auth.js";
import { getSessions } from "../controllers/sessionController.js";

const router = express.Router();

router.use(auth); // All routes require authentication
router.get("/", getSessions);

export default router;
