import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "netbanking", "upi", "wallet", "unknown"],
      default: "unknown",
    },
    transactionDate: {
      type: Date,
    },
    description: {
      type: String,
    },
    requestId: {
      type: String,
      default: () =>
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for better querying
paymentSchema.index({ userId: 1, status: 1 });

// Drop the old requestId index if it exists (this is safe to run multiple times)
mongoose.connection.on("connected", async () => {
  try {
    await mongoose.connection.db
      .collection("payments")
      .dropIndex("requestId_1");
    console.log("Successfully dropped old requestId index");
  } catch (error) {
    // Index might not exist, which is fine
    if (error.code !== 27) {
      // 27 is the error code for index not found
      console.error("Error dropping index:", error);
    }
  }
});

export default mongoose.model("Payment", paymentSchema);
