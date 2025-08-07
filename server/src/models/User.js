import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    alternativePhone: {
      type: String,
      trim: true,
    },
    medicalInfo: {
      systemicDiseases: [String],
      drugAllergies: [String],
      isPregnant: Boolean,
      pastTreatments: [String],
      previousExperiences: [String],
    },
    documents: [
      {
        type: {
          type: String,
          required: true,
          enum: ["id_proof", "medical_record", "insurance"],
        },
        fileUrl: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Authentication fields
    passwordHash: {
      type: String,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    subscription: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
      },
      startDate: Date,
      endDate: Date,
      sessionsRemaining: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["active", "expired", "cancelled", "suspended"],
        default: "active",
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if subscription is active
userSchema.methods.isSubscriptionActive = function () {
  // Admin users always have active subscription privileges
  if (this.role === "admin") {
    return true;
  }

  if (!this.subscription) return false;

  const now = new Date();
  return (
    this.subscription.status === "active" &&
    this.subscription.endDate > now &&
    this.subscription.sessionsRemaining > 0
  );
};

// Method to consume a session
userSchema.methods.consumeSession = async function () {
  if (!this.subscription || this.subscription.sessionsRemaining <= 0) {
    throw new Error("No sessions available");
  }

  this.subscription.sessionsRemaining--;
  if (this.subscription.sessionsRemaining === 0) {
    this.subscription.status = "expired";
  }

  await this.save();
  return this.subscription.sessionsRemaining;
};

// Method to restore a session (for cancellations)
userSchema.methods.restoreSession = async function () {
  if (!this.subscription) {
    throw new Error("No subscription found");
  }

  this.subscription.sessionsRemaining++;

  // If subscription was expired due to no sessions, reactivate it
  if (
    this.subscription.status === "expired" &&
    this.subscription.endDate > new Date()
  ) {
    this.subscription.status = "active";
  }

  await this.save();
  return this.subscription.sessionsRemaining;
};

// Password hashing middleware
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("passwordHash")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
