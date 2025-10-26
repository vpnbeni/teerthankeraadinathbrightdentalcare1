import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all notifications for the authenticated user
router.get("/", getUserNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", markAllAsRead);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

// Delete all notifications
router.delete("/", deleteAllNotifications);

export default router;
