import mongoose from "mongoose";

/**
 * Authentication Session Schema for secure session management
 */
const authSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sessionToken: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
authSessionSchema.index({ userId: 1, isActive: 1 });
authSessionSchema.index({ sessionToken: 1 }, { unique: true });

const AuthSession = mongoose.model("AuthSession", authSessionSchema);

export default AuthSession;
