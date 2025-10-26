# Persistent Notifications System

## Overview
A complete notification system that stores notifications in MongoDB and displays them to users even when they're offline. Notifications persist until users explicitly clear them.

## Features
✅ **Persistent Storage** - All notifications saved to MongoDB
✅ **Offline Support** - Notifications appear when users log back in
✅ **Real-time Updates** - Socket.IO for instant notifications when online
✅ **User-specific** - Each user sees only their notifications
✅ **Admin Notifications** - All admins receive admin-targeted notifications
✅ **Read/Unread Status** - Track which notifications have been read
✅ **Clear Functionality** - Users can delete individual or all notifications
✅ **Priority Levels** - Low, medium, high priority notifications
✅ **Notification Types** - Different types for appointments, payments, etc.

## Architecture

### Backend (Server)

#### 1. Database Model
**File:** `server/src/models/Notification.js`

```javascript
{
  userId: ObjectId,           // User who receives the notification
  type: String,               // Type of notification
  title: String,              // Notification title
  message: String,            // Notification message
  priority: String,           // low, medium, high
  read: Boolean,              // Read status
  metadata: {                 // Additional data
    appointmentId: ObjectId,
    paymentId: ObjectId,
    additionalData: Mixed
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Notification Types:**
- `appointment_created`
- `new_appointment`
- `appointment_confirmed`
- `appointment_cancelled`
- `appointment_reminder`
- `appointment_rescheduled`
- `appointment_completed`
- `payment_success`
- `payment_failed`
- `subscription_expiring`
- `subscription_expired`
- `system_announcement`

#### 2. API Endpoints
**File:** `server/src/routes/notifications.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications for user |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark notification as read |
| PUT | `/api/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete a notification |
| DELETE | `/api/notifications` | Delete all notifications |

#### 3. Socket Service
**File:** `server/src/services/socketService.js`

**Functions:**
- `sendNotificationToUser(userId, notification)` - Send to specific user
- `sendNotificationToAdmins(notification)` - Send to all admins

Both functions:
1. Save notification to database
2. Send via Socket.IO if user is online
3. Return saved notification

### Frontend (Client & Admin)

#### 1. Notification Context
**Files:** 
- `client/src/contexts/NotificationContext.jsx`
- `admin/src/contexts/NotificationContext.jsx`

**Features:**
- Fetches notifications from API on mount
- Maintains Socket.IO connection for real-time updates
- Provides methods to mark as read/delete notifications
- Syncs with backend API

**Available Methods:**
```javascript
const {
  notifications,      // Array of notifications
  unreadCount,       // Number of unread notifications
  loading,           // Loading state
  markAsRead,        // Mark single notification as read
  markAllAsRead,     // Mark all as read
  clearNotification, // Delete single notification
  clearAllNotifications // Delete all notifications
} = useNotifications();
```

#### 2. Notifications Page
**Files:**
- `client/src/pages/Notifications.jsx`
- `admin/src/pages/Notifications.jsx`

**Features:**
- Display all notifications grouped by date
- Filter by read/unread status
- Search notifications
- Filter by notification type
- Mark as read on click
- Delete individual notifications
- Clear all notifications button
- Statistics cards (total, unread, read)

## Usage Examples

### Sending Notifications

#### Example 1: Send to Specific User
```javascript
import { sendNotificationToUser } from "./services/socketService.js";

await sendNotificationToUser(userId, {
  type: "appointment_confirmed",
  title: "Appointment Confirmed",
  message: "Your appointment has been confirmed for tomorrow at 10:00 AM",
  priority: "high",
  metadata: {
    appointmentId: appointment._id
  }
});
```

#### Example 2: Send to All Admins
```javascript
import { sendNotificationToAdmins } from "./services/socketService.js";

await sendNotificationToAdmins({
  type: "new_appointment",
  title: "New Appointment Booked",
  message: `${user.name} booked an appointment for ${date}`,
  priority: "medium",
  metadata: {
    appointmentId: appointment._id,
    userId: user._id
  }
});
```

### Using in Components

```javascript
import { useNotifications } from "../contexts/NotificationContext";

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## How It Works

### When User is Online
1. User books appointment
2. Server creates notification in database
3. Server sends notification via Socket.IO
4. Client receives and displays notification immediately
5. Notification appears under bell icon

### When User is Offline
1. User books appointment
2. Server creates notification in database
3. Socket.IO send fails (user offline) - notification still saved
4. User logs in later
5. Client fetches all notifications from API
6. Notification appears under bell icon

### Notification Flow

```
User Action (e.g., Book Appointment)
         ↓
Server Controller
         ↓
sendNotificationToUser() / sendNotificationToAdmins()
         ↓
    ┌────────────────────┐
    │  Save to MongoDB   │ ← Always happens
    └────────────────────┘
         ↓
    ┌────────────────────┐
    │ Send via Socket.IO │ ← Only if user online
    └────────────────────┘
         ↓
Client receives notification
         ↓
Display in UI + Bell icon
```

## Database Indexes

For optimal performance, the following indexes are created:
- `userId` (for user-specific queries)
- `type` (for filtering by type)
- `read` (for unread queries)
- Compound: `userId + read + createdAt` (for efficient pagination)

## Testing

### Test Notification Creation
```javascript
// In any controller where you want to send notifications
import { sendNotificationToUser } from "../services/socketService.js";

// Send test notification
await sendNotificationToUser("USER_ID_HERE", {
  type: "system_announcement",
  title: "Test Notification",
  message: "This is a test notification",
  priority: "low"
});
```

### Test Admin Notifications
```javascript
import { sendNotificationToAdmins } from "../services/socketService.js";

await sendNotificationToAdmins({
  type: "new_appointment",
  title: "Test Admin Notification",
  message: "This notification goes to all admins",
  priority: "high"
});
```

## Benefits

1. **Reliability** - Notifications never lost, even if user is offline
2. **Persistence** - Users can review old notifications
3. **Scalability** - Database-backed, can handle millions of notifications
4. **User Control** - Users can clear notifications when done
5. **Real-time** - Instant delivery when users are online
6. **Audit Trail** - All notifications stored with timestamps

## Future Enhancements

- [ ] Notification preferences (email, SMS, push)
- [ ] Notification scheduling
- [ ] Bulk operations
- [ ] Notification templates
- [ ] Read receipts
- [ ] Notification expiry
- [ ] Push notifications for mobile
