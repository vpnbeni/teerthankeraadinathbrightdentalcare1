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
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const socketRef = React.useRef(null);
  const isConnecting = React.useRef(false);

  // Fetch notifications from API on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const formattedNotifications = data.data.notifications.map((notif) => ({
            id: notif._id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            priority: notif.priority,
            read: notif.read,
            timestamp: notif.createdAt,
            metadata: notif.metadata,
          }));
          setNotifications(formattedNotifications);
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user]);

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
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.log("⚠️ No admin token found in localStorage");
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

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  const clearNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
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
