import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/environment.js";

let io = null;

// Initialize Socket.IO
export const initializeSocket = (server) => {
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
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

// Send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.log("⚠️ Socket.IO not initialized, cannot send user notification");
    return;
  }
  
  const notificationData = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification,
  };
  
  console.log(`📤 Sending notification to user room: user:${userId}`, notificationData);
  io.to(`user:${userId}`).emit("notification", notificationData);
  console.log(`✅ Notification sent to user room: user:${userId}`);
};

// Send notification to all admins
export const sendNotificationToAdmins = (notification) => {
  if (!io) {
    console.log("⚠️ Socket.IO not initialized, cannot send notification");
    return;
  }
  
  const notificationData = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification,
  };
  
  console.log("📤 Sending notification to admin room:", notificationData);
  
  // Get all sockets in the admin room
  const adminRoom = io.sockets.adapter.rooms.get("admin");
  if (adminRoom) {
    console.log(`🔍 Admin room has ${adminRoom.size} connected socket(s):`, Array.from(adminRoom));
  } else {
    console.log("⚠️ Admin room is empty or doesn't exist!");
  }
  
  io.to("admin").emit("notification", notificationData);
  console.log("✅ Notification sent to admin room");
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
