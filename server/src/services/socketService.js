import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/environment.js";

let io = null;

// Initialize Socket.IO (only for local development)
export const initializeSocket = (server) => {
  // Skip Socket.IO initialization in production (Vercel doesn't support WebSockets)
  if (config.NODE_ENV === "production") {
    console.log("⚠️ Socket.IO disabled in production - using database polling instead");
    return null;
  }

  const allowedOrigins = config.NODE_ENV === "production"
    ? config.CORS_ORIGINS.production
    : config.CORS_ORIGINS.development;

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      
      // Fetch user from database to get the role (in case old tokens don't have role)
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error("User not found"));
      }
      
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId} (Role: ${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    console.log(`📍 User ${socket.userId} joined room: user:${socket.userId}`);

    // Join role-specific room
    if (socket.userRole === "admin") {
      socket.join("admin");
      console.log(`👑 Admin ${socket.userId} joined admin room`);
      
      // Log all rooms this socket is in
      console.log(`🔍 Socket ${socket.id} is in rooms:`, Array.from(socket.rooms));
    } else {
      console.log(`👤 Regular user ${socket.userId} connected`);
    }

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId} (Role: ${socket.userRole})`);
    });
  });

  console.log("✅ Socket.IO initialized");
  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    return null; // Return null instead of throwing error
  }
  return io;
};

// Send notification to specific user
export const sendNotificationToUser = async (userId, notification) => {
  try {
    // Save notification to database
    const Notification = (await import("../models/Notification.js")).default;
    const savedNotification = await Notification.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority || "medium",
      metadata: notification.metadata || {},
    });

    console.log(`💾 Notification saved to database for user: ${userId}`);

    const notificationData = {
      id: savedNotification._id.toString(),
      userId: savedNotification.userId.toString(),
      type: savedNotification.type,
      title: savedNotification.title,
      message: savedNotification.message,
      priority: savedNotification.priority,
      read: savedNotification.read,
      timestamp: savedNotification.createdAt.toISOString(),
      metadata: savedNotification.metadata,
    };

    // Send via Socket.IO if available (development only)
    if (io) {
      console.log(`📤 Sending notification to user room: user:${userId}`, notificationData);
      io.to(`user:${userId}`).emit("notification", notificationData);
      console.log(`✅ Notification sent to user room: user:${userId}`);
    } else {
      console.log(`📬 Notification saved to DB - will be fetched on next poll`);
    }

    return savedNotification;
  } catch (error) {
    console.error("Error sending notification to user:", error);
    throw error;
  }
};

// Send notification to all admins
export const sendNotificationToAdmins = async (notification) => {
  try {
    // Get all admin users
    const User = (await import("../models/User.js")).default;
    const Notification = (await import("../models/Notification.js")).default;
    
    const admins = await User.find({ role: "admin" }).select("_id");
    
    if (admins.length === 0) {
      console.log("⚠️ No admin users found in database");
      return;
    }

    // Save notification for each admin
    const notificationPromises = admins.map(async (admin) => {
      return await Notification.create({
        userId: admin._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || "medium",
        metadata: notification.metadata || {},
      });
    });

    const savedNotifications = await Promise.all(notificationPromises);
    console.log(`💾 Saved ${savedNotifications.length} notifications for admins`);

    // Send via Socket.IO to connected admins (development only)
    if (io) {
      const notificationData = {
        id: savedNotifications[0]._id.toString(),
        type: savedNotifications[0].type,
        title: savedNotifications[0].title,
        message: savedNotifications[0].message,
        priority: savedNotifications[0].priority,
        read: false,
        timestamp: savedNotifications[0].createdAt.toISOString(),
        metadata: savedNotifications[0].metadata,
      };

      console.log("📤 Sending notification to admin room:", notificationData);
      
      // Get all sockets in the admin room
      const adminRoom = io.sockets.adapter.rooms.get("admin");
      if (adminRoom) {
        console.log(`🔍 Admin room has ${adminRoom.size} connected socket(s):`, Array.from(adminRoom));
      } else {
        console.log("⚠️ Admin room is empty - notifications saved to DB for later");
      }
      
      io.to("admin").emit("notification", notificationData);
      console.log("✅ Notification sent to admin room");
    } else {
      console.log(`📬 ${savedNotifications.length} notifications saved to DB - will be fetched on next poll`);
    }

    return savedNotifications;
  } catch (error) {
    console.error("Error sending notification to admins:", error);
    throw error;
  }
};

// Send notification to all users
export const broadcastNotification = (notification) => {
  if (!io) return;
  
  io.emit("notification", {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification,
  });
};
