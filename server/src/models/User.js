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
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
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
    profilePhoto: {
      type: String,
      trim: true,
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
    // Phone verification fields
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    // Email verification fields
    emailVerified: {
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
      // Number of sessions remaining for the current subscription period
      sessionsRemaining: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Optional: total sessions allocated for the subscription period
      totalSessions: {
        type: Number,
        default: 0,
        min: 0,
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
    this.subscription.status === "active" && this.subscription.endDate > now
  );
};

// Method to consume a session
userSchema.methods.consumeSession = async function () {
  if (!this.subscription || this.subscription.sessionsRemaining <= 0) {
    throw new Error("No sessions remaining");
  }

  this.subscription.sessionsRemaining -= 1;

  // If no sessions remaining, mark subscription as expired
  if (this.subscription.sessionsRemaining === 0) {
    this.subscription.status = "expired";
  }

  return await this.save();
};

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Validation middleware to ensure either phone or email is provided
userSchema.pre("save", function (next) {
  // Check if both phone and email are empty/null/undefined
  const hasPhone = this.phone && this.phone.trim();
  const hasEmail = this.email && this.email.trim();

  if (!hasPhone && !hasEmail) {
    return next(new Error("Either phone number or email is required"));
  }
  next();
});

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
