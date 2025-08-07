import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    duration: {
      type: Number, // Duration in months
      required: true,
      min: 1,
    },
    sessions: {
      type: Number,
      required: true,
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get active plans
planSchema.statics.getActivePlans = function () {
  return this.find({ isActive: true }).sort({ price: 1 });
};

// Method to calculate plan end date based on duration
planSchema.methods.calculateEndDate = function (startDate) {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + this.duration);
  return endDate;
};

export default mongoose.model("Plan", planSchema);
