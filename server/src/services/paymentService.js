import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../config/environment.js";
import { Payment, Plan, User } from "../models/index.js";
import { PaymentError } from "../utils/errors.js";
import emailService from "./emailService.js";

class PaymentService {
  constructor() {
    this.validateRazorpayConfig();
    this.razorpay = new Razorpay({
      key_id: config.RAZORPAY.KEY_ID,
      key_secret: config.RAZORPAY.KEY_SECRET,
    });
  }

  validateRazorpayConfig() {
    console.log(
      "Razorpay Key ID:",
      config.RAZORPAY.KEY_ID ? "Present" : "Missing"
    );
    console.log(
      "Razorpay Key Secret:",
      config.RAZORPAY.KEY_SECRET ? "Present" : "Missing"
    );

    if (!config.RAZORPAY.KEY_ID || !config.RAZORPAY.KEY_SECRET) {
      throw new PaymentError(
        "Razorpay configuration is missing",
        "RAZORPAY_CONFIG_ERROR",
        500
      );
    }

    // Test if keys are valid format
    if (!config.RAZORPAY.KEY_ID.startsWith("rzp_")) {
      console.warn("Warning: Razorpay Key ID should start with 'rzp_'");
    }
  }

  async createOrder(userId, planId) {
    try {
      // Get plan details
      const plan = await Plan.findById(planId);
      console.log("plan", plan);
      if (!plan) {
        throw new PaymentError("Plan not found", "INVALID_PLAN", 404);
      }

      // Get user details
      const user = await User.findById(userId);
      console.log("user", user);
      if (!user) {
        throw new PaymentError("User not found", "USER_NOT_FOUND", 404);
      }

      // Create Razorpay order
      const orderOptions = {
        amount: plan.price * 100, // Amount in paise
        currency: "INR",
        receipt: `ord_${userId.toString().slice(-8)}_${Date.now()
          .toString()
          .slice(-8)}`, // Max 40 chars
        notes: {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name,
          userPhone: user.phone,
          userName: user.name,
        },
      };
      console.log("orderOptions", orderOptions);

      // Add detailed logging for Razorpay call
      console.log("Attempting to create Razorpay order...");
      let razorpayOrder;

      try {
        razorpayOrder = await this.razorpay.orders.create(orderOptions);
        console.log("razorpayOrder created successfully:", razorpayOrder);
      } catch (razorpayError) {
        console.error("Razorpay order creation failed:", {
          error: razorpayError.message,
          statusCode: razorpayError.statusCode,
          description: razorpayError.error?.description,
          code: razorpayError.error?.code,
          source: razorpayError.error?.source,
          step: razorpayError.error?.step,
          reason: razorpayError.error?.reason,
          metadata: razorpayError.error?.metadata,
        });

        throw new PaymentError(
          `Razorpay order creation failed: ${razorpayError.message}`,
          "RAZORPAY_ORDER_FAILED",
          razorpayError.statusCode || 500
        );
      }

      try {
        // Create payment record with unique requestId
        const payment = await Payment.create({
          userId,
          planId,
          amount: plan.price,
          currency: "INR",
          status: "pending",
          razorpayOrderId: razorpayOrder.id,
          description: `Subscription payment for ${plan.name}`,
        });
        console.log("payment", payment);

        return {
          order: razorpayOrder,
          key: config.RAZORPAY.KEY_ID,
          paymentId: payment._id,
          planDetails: {
            name: plan.name,
            duration: plan.duration,
            price: plan.price,
          },
          userDetails: {
            name: user.name,
            phone: user.phone,
            email: user.email,
          },
        };
        ``;
      } catch (dbError) {
        // If payment record creation fails, log error and throw
        console.error("Payment record creation failed:", dbError);

        // Check if it's a duplicate key error
        if (dbError.code === 11000) {
          throw new PaymentError(
            "A payment record for this order already exists",
            "DUPLICATE_PAYMENT_RECORD",
            400
          );
        }

        throw new PaymentError(
          "Failed to create payment record",
          "PAYMENT_RECORD_CREATION_FAILED",
          500
        );
      }
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }

      // Log the original error for debugging
      console.error("Unexpected error in createOrder:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      throw new PaymentError(
        error.message || "Failed to create payment order",
        "ORDER_CREATION_FAILED",
        500
      );
    }
  }

  verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  ) {
    try {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", config.RAZORPAY.KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  async processSuccessfulPayment(paymentData) {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentMethod,
      } = paymentData;

      // Verify signature
      const isValidSignature = this.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValidSignature) {
        throw new PaymentError(
          "Payment signature verification failed",
          "INVALID_SIGNATURE",
          400
        );
      }

      // Find and update payment
      const payment = await Payment.findOne({ razorpayOrderId })
        .populate("userId")
        .populate("planId");

      if (!payment) {
        throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND", 404);
      }

      if (payment.status === "completed") {
        throw new PaymentError(
          "Payment already processed",
          "DUPLICATE_PAYMENT",
          409
        );
      }

      // Update payment status
      payment.status = "completed";
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paymentMethod = paymentMethod;
      payment.transactionDate = new Date();

      await payment.save();

      // Update user subscription
      const user = payment.userId;
      const plan = payment.planId;

      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + plan.duration * 30 * 24 * 60 * 60 * 1000
      );

      user.subscription = {
        planId: plan._id,
        startDate,
        endDate,
        totalSessions: plan.sessions,
        sessionsRemaining: plan.sessions,
        status: "active",
      };

      await user.save();

      // Send payment confirmation email
      if (user.email) {
        await emailService.sendPaymentConfirmationEmail(
          user.email,
          user.name,
          "",
          plan.name,
          payment.amount,
          razorpayOrderId
        );
      }

      return {
        success: true,
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          transactionDate: payment.transactionDate,
        },
        subscription: {
          planId: plan._id,
          planName: plan.name,
          startDate,
          endDate,
          status: "active",
        },
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(
        error.message || "Payment processing failed",
        "PAYMENT_PROCESSING_FAILED",
        500
      );
    }
  }

  async getPaymentHistory(userId) {
    try {
      const payments = await Payment.find({ userId })
        .populate("planId", "name price")
        .sort({ transactionDate: -1 });

      if (!payments) {
        return [];
      }

      return payments.map((p) => ({
        id: p._id,
        amount: p.amount,
        status: p.status,
        transactionDate: p.transactionDate,
        planName: p.planId ? p.planId.name : "N/A",
        paymentMethod: p.paymentMethod,
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw new PaymentError(
        "Failed to fetch payment history",
        "PAYMENT_HISTORY_FAILED",
        500
      );
    }
  }
}

export const paymentService = new PaymentService();
