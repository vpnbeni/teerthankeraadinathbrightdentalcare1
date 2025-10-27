# Notification System - Quick Reference Guide

## System Overview

The notification system uses a **polling-based approach** where notifications are:
1. Saved to the database when events occur
2. Automatically fetched when users refocus the browser tab
3. Polled every 30 seconds when the tab is active

This provides an almost real-time experience without the complexity of WebSockets.

## For Developers

### Sending Notifications

#### Send to Specific User

```javascript
import { sendNotificationToUser } from "../services/notificationService.js";

await sendNotificationToUser(userId, {
  type: "appointment_confirmed",
  title: "Appointment Confirmed",
  message: "Your appointment has been confirmed for Dec 25 at 10:00 AM",
  priority: "high", // "low", "medium", "high"
  metadata: {
    appointmentId: "123",
    date: "2024-12-25",
    timeSlot: "10:00 AM"
  }
});
```

#### Send to All Admins

```javascript
import { sendNotificationToAdmins } from "../services/notificationService.js";

await sendNotificationToAdmins({
  type: "appointment_booked",
  title: "New Appointment",
  message: "John Doe booked an appointment for Dec 25",
  priority: "medium",
  metadata: {
    userId: "user123",
    appointmentId: "appt456"
  }
});
```

#### Broadcast to All Users

```javascript
import { broadcastNotification } from "../services/notificationService.js";

await broadcastNotification({
  type: "system_announcement",
  title: "System Maintenance",
  message: "The system will be under maintenance on Dec 31",
  priority: "high",
  metadata: {
    maintenanceDate: "2024-12-31"
  }
});
```

### Notification Types

Common notification types used in the system:

- `appointment_booked` - New appointment created
- `appointment_confirmed` - Admin confirmed appointment
- `appointment_cancelled` - Appointment cancelled
- `appointment_rescheduled` - Appointment time changed
- `appointment_completed` - Appointment marked complete
- `appointment_auto_cancelled` - Auto-cancelled by system
- `payment_received` - Payment successful
- `subscription_expiring` - Subscription about to expire
- `system_announcement` - General system message

### Priority Levels

- `low` - General information, no urgency
- `medium` - Standard notifications (default)
- `high` - Important, requires attention

## How It Works

### Client/Admin Side

Both panels automatically:

1. **Fetch on Load**
   - Initial notification fetch when dashboard loads
   - Displays unread count in bell icon

2. **Fetch on Refocus**
   - When user switches back to the tab
   - When browser window regains focus
   - Plays sound for new notifications

3. **Background Polling**
   - Checks every 30 seconds when tab is active
   - Pauses when tab is hidden/inactive
   - Efficient and battery-friendly

4. **User Actions**
   - Mark individual notification as read
   - Mark all notifications as read
   - Delete individual notification
   - Clear all notifications

### Server Side

1. **Event Occurs**
   - User books appointment
   - Admin confirms appointment
   - Payment is processed
   - etc.

2. **Notification Created**
   - Saved to MongoDB
   - Includes all metadata
   - Timestamped automatically

3. **User Retrieves**
   - Client polls API endpoint
   - Receives new notifications
   - Updates UI automatically

## API Endpoints

### Get User Notifications
```
GET /api/notifications
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

### Mark as Read
```
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```
PUT /api/notifications/mark-all-read
Authorization: Bearer <token>
```

### Delete Notification
```
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### Clear All Notifications
```
DELETE /api/notifications
Authorization: Bearer <token>
```

## Configuration

### Adjust Polling Interval

In `client/src/contexts/NotificationContext.jsx` and `admin/src/contexts/NotificationContext.jsx`:

```javascript
// Current: 30 seconds
pollingIntervalRef.current = setInterval(() => {
  if (!document.hidden) {
    fetchNotifications(true);
  }
}, 30000); // Change this value (in milliseconds)
```

Recommended values:
- **15000** (15 sec) - More responsive, higher server load
- **30000** (30 sec) - Balanced (current)
- **60000** (60 sec) - Less server load, slower updates

### Disable Notification Sound

In the NotificationContext files:

```javascript
const playNotificationSound = () => {
  return; // Add this line to disable sound
  
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (error) {}
};
```

## Testing

### Test Notification Flow

1. **Open two browser windows**
   - Window 1: Client dashboard
   - Window 2: Admin dashboard

2. **Create an event**
   - Book appointment in client
   - Switch to another tab

3. **Verify notification**
   - Switch back to admin dashboard
   - Notification should appear within 1 second
   - Bell icon shows unread count
   - Sound plays (if enabled)

4. **Test polling**
   - Keep dashboard active
   - Wait 30 seconds
   - New notifications appear automatically

### Debug Mode

Check browser console for logs:

```
👁️ Window focused - checking for new notifications
📬 3 new notification(s) received
🔄 Polling for new notifications
```

Check server logs:

```
💾 Notification saved to database for user: 123
📬 Notification will be fetched when user refocuses the dashboard
💾 Saved 2 notifications for admins
```

## Best Practices

### 1. Use Appropriate Priority

```javascript
// High priority - requires immediate attention
priority: "high" // Payment failures, urgent appointments

// Medium priority - standard notifications
priority: "medium" // Appointment confirmations, updates

// Low priority - informational
priority: "low" // System announcements, tips
```

### 2. Include Useful Metadata

```javascript
metadata: {
  appointmentId: "123",
  userId: "456",
  actionUrl: "/appointments/123", // For navigation
  date: "2024-12-25",
  timeSlot: "10:00 AM"
}
```

### 3. Clear, Concise Messages

```javascript
// Good
title: "Appointment Confirmed"
message: "Your appointment for Dec 25 at 10:00 AM is confirmed"

// Avoid
title: "Update"
message: "There has been an update to your appointment"
```

### 4. Handle Errors Gracefully

```javascript
try {
  await sendNotificationToUser(userId, notification);
} catch (error) {
  console.error("Failed to send notification:", error);
  // Don't fail the main operation if notification fails
}
```

## Troubleshooting

### Notifications Not Appearing

1. **Check browser console**
   - Look for fetch errors
   - Verify token is present

2. **Check server logs**
   - Confirm notification was saved
   - Look for database errors

3. **Test API endpoint**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:5000/api/notifications
   ```

### Polling Not Working

1. **Verify tab is active**
   - Polling pauses when tab is hidden
   - Check `document.hidden` in console

2. **Check interval**
   - Confirm interval is set correctly
   - Look for interval cleanup issues

### Sound Not Playing

1. **Check browser permissions**
   - Some browsers block autoplay
   - User interaction may be required first

2. **Verify audio file**
   - Ensure `/notification.mp3` exists
   - Check file path in public folder

## Performance Considerations

### Database Indexes

Ensure these indexes exist on the Notification collection:

```javascript
// In Notification model
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
```

### Cleanup Old Notifications

Consider adding a cron job to delete old read notifications:

```javascript
// Delete read notifications older than 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await Notification.deleteMany({
  read: true,
  createdAt: { $lt: thirtyDaysAgo }
});
```

### Rate Limiting

The polling system is efficient, but consider rate limiting the API endpoint:

```javascript
// In notification routes
import rateLimit from "express-rate-limit";

const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

router.get("/", notificationLimiter, getNotifications);
```

## Future Enhancements

### 1. Browser Push Notifications

Add service worker for notifications even when tab is closed:

```javascript
// Request permission
const permission = await Notification.requestPermission();

// Send push notification
if (permission === "granted") {
  new Notification("New Appointment", {
    body: "John Doe booked an appointment",
    icon: "/icon.png"
  });
}
```

### 2. Email Notifications

For critical notifications, send email as backup:

```javascript
await sendNotificationToUser(userId, notification);

if (notification.priority === "high") {
  await emailService.sendNotificationEmail(user.email, notification);
}
```

### 3. SMS Notifications

For urgent notifications:

```javascript
if (notification.priority === "high" && user.phone) {
  await smsService.sendNotificationSMS(user.phone, notification);
}
```

### 4. Notification Preferences

Let users control what notifications they receive:

```javascript
// User preferences
{
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  notificationTypes: {
    appointment_booked: true,
    appointment_cancelled: true,
    system_announcement: false
  }
}
```

## Summary

The polling-based notification system provides:
- ✅ Simple, reliable architecture
- ✅ Almost real-time experience
- ✅ Works in all environments
- ✅ No complex WebSocket management
- ✅ Persistent notifications
- ✅ Efficient resource usage

For most use cases, this system provides the perfect balance of simplicity and functionality.
