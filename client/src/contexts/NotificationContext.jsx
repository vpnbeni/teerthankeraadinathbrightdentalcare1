import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const socketRef = React.useRef(null);
  const isConnecting = React.useRef(false);

  // Initialize socket connection
  useEffect(() => {
    // Only proceed if authenticated
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket - user not authenticated");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        isConnecting.current = false;
      }
      return;
    }

    // Don't reconnect if we already have a socket or are currently connecting
    if (socketRef.current || isConnecting.current) {
      console.log("🔌 Socket already exists or connecting, skipping");
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("⚠️ No token found in localStorage");
      return;
    }

    isConnecting.current = true;
    console.log("🔌 Initializing WebSocket connection...");
    // Remove /api suffix if present for Socket.IO connection
    let serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    serverUrl = serverUrl.replace(/\/api$/, ""); // Remove trailing /api
    console.log("🔌 Connecting to:", serverUrl);
    
    const newSocket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to notification server");
      console.log("🔌 Socket ID:", newSocket.id);
      isConnecting.current = false;
    });

    newSocket.on("notification", (notification) => {
      console.log("📬 New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Play notification sound (optional)
      playNotificationSound();
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from notification server. Reason:", reason);
      isConnecting.current = false;
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      console.error("Error details:", error);
      isConnecting.current = false;
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [isAuthenticated, user?._id]); // Depend on user ID, not the whole user object
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("🔌 Component unmounting - disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnecting.current = false;
      }
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if sound can't play
      });
    } catch (error) {
      // Ignore sound errors
    }
  };

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    setUnreadCount((prev) => {
      const notification = notifications.find((n) => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
