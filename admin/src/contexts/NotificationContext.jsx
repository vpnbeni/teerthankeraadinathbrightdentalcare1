import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";

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
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const pollingIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showNewNotification = false) => {
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

        // Check for new notifications
        if (showNewNotification && notifications.length > 0) {
          const newNotifs = formattedNotifications.filter(
            (notif) => !notifications.some((n) => n.id === notif.id)
          );
          if (newNotifs.length > 0) {
            console.log(`📬 ${newNotifs.length} new notification(s) received`);
            playNotificationSound();
          }
        }

        setNotifications(formattedNotifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, notifications]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications(false);
  }, [isAuthenticated, user]);

  // Poll for new notifications when window gets focus
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Window focused - checking for new notifications");
        fetchNotifications(true);
      }
    };

    const handleFocus = () => {
      console.log("👁️ Window focused - checking for new notifications");
      fetchNotifications(true);
    };

    // Poll every 30 seconds when tab is active
    const startPolling = () => {
      if (pollingIntervalRef.current) return;
      
      pollingIntervalRef.current = setInterval(() => {
        if (!document.hidden) {
          console.log("🔄 Polling for new notifications");
          fetchNotifications(true);
        }
      }, 30000); // 30 seconds
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      stopPolling();
    };
  }, [isAuthenticated, user, fetchNotifications]);

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
