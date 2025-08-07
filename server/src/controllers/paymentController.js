import { paymentService } from "../services/paymentService.js";


export const createPaymentOrder = async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  try {
    const orderData = await paymentService.createOrder(userId, planId);

    res.status(200).json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    console.error("Payment order creation error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create payment order",
      code: error.code || "ORDER_CREATION_FAILED",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    } = req.body;

    const result = await paymentService.processSuccessfulPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const history = await paymentService.getPaymentHistory(userId);
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to get payment history",
      code: error.code || "PAYMENT_HISTORY_FAILED",
    });
  }
};
