// Notification Service - Database-based notification system
// Notifications are fetched via polling when users refocus the dashboard
// This provides a simpler, more reliable notification system that works in all environments

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
    console.log(`📬 Notification will be fetched when user refocuses the dashboard`);

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
    console.log(`📬 Notifications will be fetched when admins refocus the dashboard`);

    return savedNotifications;
  } catch (error) {
    console.error("Error sending notification to admins:", error);
    throw error;
  }
};

// Broadcast notification to all users (saves to DB for all users)
export const broadcastNotification = async (notification) => {
  try {
    const User = (await import("../models/User.js")).default;
    const Notification = (await import("../models/Notification.js")).default;
    
    const allUsers = await User.find({}).select("_id");
    
    if (allUsers.length === 0) {
      console.log("⚠️ No users found in database");
      return;
    }

    // Save notification for each user
    const notificationPromises = allUsers.map(async (user) => {
      return await Notification.create({
        userId: user._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || "medium",
        metadata: notification.metadata || {},
      });
    });

    const savedNotifications = await Promise.all(notificationPromises);
    console.log(`💾 Broadcast: Saved ${savedNotifications.length} notifications for all users`);
    console.log(`📬 Notifications will be fetched when users refocus the dashboard`);

    return savedNotifications;
  } catch (error) {
    console.error("Error broadcasting notification:", error);
    throw error;
  }
};
