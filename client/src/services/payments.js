import api from "./api";

const debugLog = (message, data = {}) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Payment Service] ${message}`, data);
  }
};

const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(true);
      } else {
        reject(new Error("Razorpay object not available"));
      }
    };
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
};

const paymentService = {
  createOrder: async (planId, isUpgrade = false) => {
    try {
      debugLog("Creating payment order", { planId, isUpgrade });
      const response = await api.post("/payments/create-order", { planId, isUpgrade });
      debugLog("Order created successfully", response.data);
      return response.data;
    } catch (error) {
      debugLog("Order creation failed", { error });
      throw error;
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      debugLog("Verifying payment", paymentData);
      const response = await api.post("/payments/verify-payment", paymentData);
      debugLog("Payment verified successfully", response.data);
      return response.data;
    } catch (error) {
      debugLog("Payment verification failed", { error });
      throw error;
    }
  },

  initializePayment: async (planId, userData, isUpgrade = false) => {
    try {
      // Load Razorpay script if not already loaded
      await loadRazorpayScript();

      // Create order
      const { data } = await paymentService.createOrder(planId, isUpgrade);
      const { order, key, planDetails } = data;

      return new Promise((resolve, reject) => {
        const options = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: "Teerthanker Dental Care",
          description: isUpgrade 
            ? `Upgrade to ${planDetails.name} - ${planDetails.sessions} sessions`
            : `${planDetails.name} - ${planDetails.sessions} sessions`,
          order_id: order.id,
          prefill: {
            name: userData.name,
            email: userData.email || "",
            contact: userData.phone || userData.email || "",
          },
          handler: async function (response) {
            try {
              // Verify payment on success
              const verificationData = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: "card", // Or detect from response
                isUpgrade,
              };

              const result = await paymentService.verifyPayment(
                verificationData
              );
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("PAYMENT_CANCELLED"));
            },
          },
          theme: {
            color: "#346870",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (error) {
      debugLog("Payment initialization failed", { error });
      throw error;
    }
  },

  getPaymentHistory: async () => {
    try {
      debugLog("Fetching payment history");
      const response = await api.get("/payments/history");
      debugLog("Payment history fetched successfully", response.data);
      return response.data;
    } catch (error) {
      debugLog("Payment history fetch failed", { error });
      throw error;
    }
  },
};

export default paymentService;
