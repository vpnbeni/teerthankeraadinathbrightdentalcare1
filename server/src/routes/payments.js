import express from "express";
import { auth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} from "../controllers/paymentController.js";

const router = express.Router();

// Payment routes
router.post(
  "/create-order",
  auth,
  validateRequest("createOrder"),
  createPaymentOrder
);
router.post(
  "/verify-payment",
  auth,
  validateRequest("verifyPayment"),
  verifyPayment
);

router.get("/history", auth, getPaymentHistory);

export default router;
