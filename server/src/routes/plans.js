import express from "express";
import { getPlans, getPlan } from "../controllers/planController.js";

const router = express.Router();

router.get("/", getPlans);
router.get("/:id", getPlan);

export default router;
