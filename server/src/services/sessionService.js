import { config } from "../config/environment.js";
import { auditService } from "./auditService.js";
import AuthSession from "../models/AuthSession.js";

/**
 * Session Management Service for HIPAA Compliance
 * Handles secure session management with automatic timeout
 */
class SessionService {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.maxSessionsPerUser = 3; // Maximum concurrent sessions per user

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create new session
   */
  async createSession(userId, ipAddress, userAgent) {
    try {
      // Clean up old sessions for this user
      await this.cleanupUserSessions(userId);

      // Check if user has too many active sessions
      const activeSessions = await AuthSession.countDocuments({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (activeSessions >= this.maxSessionsPerUser) {
        // Deactivate oldest session
        await AuthSession.findOneAndUpdate(
          { userId, isActive: true },
          { isActive: false },
          { sort: { lastActivity: 1 } }
        );
      }

      // Generate secure session token
      const sessionToken = this.generateSessionToken();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + this.sessionTimeout);

      // Create session
      const session = new AuthSession({
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt,
        lastActivity: new Date(),
      });

      await session.save();

      // Log session creation
      await auditService.logAction({
        userId,
        userRole: "user",
        action: "LOGIN",
        resourceType: "System",
        resourceId: "session",
        ipAddress,
        userAgent,
        description: "User session created",
        hipaaCategory: "SYSTEM",
      });

      return {
        sessionToken,
        expiresAt,
      };
    } catch (error) {
      console.error("Session creation error:", error);
      throw new Error("Failed to create session");
    }
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionToken, ipAddress) {
    try {
      const session = await AuthSession.findOne({
        sessionToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).populate("userId");

      if (!session) {
        return null;
      }

      // Check IP address consistency (optional security measure)
      if (config.NODE_ENV === "production" && session.ipAddress !== ipAddress) {
        console.warn(`IP address mismatch for session ${sessionToken}`);
        // Could either reject or log as suspicious activity
      }

      // Update last activity and extend expiration
      const newExpiresAt = new Date(Date.now() + this.sessionTimeout);

      await AuthSession.updateOne(
        { _id: session._id },
        {
          lastActivity: new Date(),
          expiresAt: newExpiresAt,
        }
      );

      return {
        userId: session.userId._id,
        user: session.userId,
        expiresAt: newExpiresAt,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionToken, userId, ipAddress) {
    try {
      const session = await AuthSession.findOneAndUpdate(
        { sessionToken, isActive: true },
        { isActive: false },
        { new: true }
      );

      if (session) {
        // Log session termination
        await auditService.logAction({
          userId,
          userRole: "user",
          action: "LOGOUT",
          resourceType: "System",
          resourceId: "session",
          ipAddress,
          description: "User session terminated",
          hipaaCategory: "SYSTEM",
        });
      }

      return !!session;
    } catch (error) {
      console.error("Session invalidation error:", error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId, ipAddress, reason = "logout_all") {
    try {
      const result = await AuthSession.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      // Log mass session termination
      await auditService.logAction({
        userId,
        userRole: "user",
        action: "LOGOUT",
        resourceType: "System",
        resourceId: "all_sessions",
        ipAddress,
        description: `All user sessions terminated: ${reason}`,
        hipaaCategory: "SYSTEM",
      });

      return result.modifiedCount;
    } catch (error) {
      console.error("Mass session invalidation error:", error);
      return 0;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId) {
    try {
      const sessions = await AuthSession.find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).select("ipAddress userAgent lastActivity createdAt expiresAt");

      return sessions;
    } catch (error) {
      console.error("Get user sessions error:", error);
      return [];
    }
  }

  /**
   * Clean up expired and inactive sessions
   */
  async cleanupExpiredSessions() {
    try {
      const result = await AuthSession.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          {
            isActive: false,
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        ],
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error("Session cleanup error:", error);
      return 0;
    }
  }

  /**
   * Clean up old sessions for a specific user
   */
  async cleanupUserSessions(userId) {
    try {
      // Remove expired sessions
      await AuthSession.deleteMany({
        userId,
        expiresAt: { $lt: new Date() },
      });

      // Deactivate old inactive sessions
      await AuthSession.updateMany(
        {
          userId,
          isActive: false,
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        { $unset: { sessionToken: 1 } }
      );
    } catch (error) {
      console.error("User session cleanup error:", error);
    }
  }

  /**
   * Generate secure session token
   */
  generateSessionToken() {
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    // Clean up expired sessions every 15 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 15 * 60 * 1000);

    console.log("🔄 Session cleanup interval started");
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    try {
      const [totalActiveSessions, sessionsByUser, recentSessions] =
        await Promise.all([
          AuthSession.countDocuments({
            isActive: true,
            expiresAt: { $gt: new Date() },
          }),

          AuthSession.aggregate([
            {
              $match: {
                isActive: true,
                expiresAt: { $gt: new Date() },
              },
            },
            {
              $group: {
                _id: "$userId",
                sessionCount: { $sum: 1 },
                lastActivity: { $max: "$lastActivity" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $sort: { sessionCount: -1 } },
            { $limit: 10 },
          ]),

          AuthSession.find({
            isActive: true,
            expiresAt: { $gt: new Date() },
          })
            .populate("userId", "name phone role")
            .sort({ lastActivity: -1 })
            .limit(20),
        ]);

      return {
        totalActiveSessions,
        sessionsByUser,
        recentSessions,
      };
    } catch (error) {
      console.error("Session stats error:", error);
      return {
        totalActiveSessions: 0,
        sessionsByUser: [],
        recentSessions: [],
      };
    }
  }

  /**
   * Force logout user from all devices (admin function)
   */
  async forceLogoutUser(userId, adminId, reason) {
    try {
      const sessionsTerminated = await this.invalidateAllUserSessions(
        userId,
        "admin_action",
        `Force logout by admin: ${reason}`
      );

      // Log admin action
      await auditService.logAction({
        userId: adminId,
        userRole: "admin",
        action: "logout",
        resourceType: "System",
        resourceId: `force_logout_${userId}`,
        ipAddress: "admin_action",
        description: `Admin forced logout of user ${userId}: ${reason}`,
        hipaaCategory: "SYSTEM",
      });

      return sessionsTerminated;
    } catch (error) {
      console.error("Force logout error:", error);
      return 0;
    }
  }
}

export const sessionService = new SessionService();
export { AuthSession };
