# 🔔 Real-Time Notification System

## Overview

A premium, real-time notification system with WebSocket integration for both client and admin dashboards. Features a visually stunning, intuitive notification bell with smooth animations and elegant design.

## ✨ Features

### Visual Design
- **Premium Glass Morphism**: Backdrop blur effects with subtle transparency
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Gradient Accents**: Beautiful color gradients matching notification types
- **Pulse Effects**: Animated indicators for new notifications
- **Responsive Design**: Optimized for mobile and desktop

### Functionality
- **Real-Time Updates**: Instant notifications via WebSocket
- **Unread Counter**: Badge showing unread notification count
- **Mark as Read**: Individual and bulk mark as read
- **Delete Notifications**: Remove individual notifications
- **Auto-Reconnect**: Automatic reconnection on connection loss
- **Sound Alerts**: Optional notification sound (can be customized)
- **Priority Levels**: High-priority notifications with special styling

## 🏗️ Architecture

### Server-Side (WebSocket)

**File**: `server/src/services/socketService.js`

```javascript
// Initialize Socket.IO with authentication
initializeSocket(server)

// Send notification to specific user
sendNotificationToUser(userId, notification)

// Send notification to all admins
sendNotificationToAdmins(notification)

// Broadcast to all users
broadcastNotification(notification)
```

### Client-Side

**Context**: `client/src/contexts/NotificationContext.jsx`
- Manages WebSocket connection
- Stores notifications state
- Provides notification actions

**Component**: `client/src/components/common/NotificationBell.jsx`
- Premium UI with animations
- Dropdown notification list
- Interactive notification cards

### Admin-Side

**Context**: `admin/src/contexts/NotificationContext.jsx`
**Component**: `admin/src/components/common/NotificationBell.jsx`

## 🚀 Usage

### Sending Notifications from Server

```javascript
import { sendNotificationToUser, sendNotificationToAdmins } from "../services/socketService.js";

// Notify a specific user
sendNotificationToUser(userId, {
  type: "appointment_created",
  title: "Appointment Confirmed",
  message: "Your appointment has been scheduled",
  icon: "calendar",
  priority: "high",
  appointmentId: "123"
});

// Notify all admins
sendNotificationToAdmins({
  type: "new_appointment",
  title: "New Appointment Booked",
  message: "John Doe booked an appointment",
  icon: "calendar",
  priority: "high",
  userId: "456",
  userName: "John Doe"
});
```

### Using Notifications in Components

```javascript
import { useNotifications } from "../contexts/NotificationContext";

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    clearNotification 
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

## 📋 Notification Types

### Appointment Notifications
- `appointment_created` - User's appointment confirmed
- `new_appointment` - Admin notification for new booking
- `appointment_cancelled` - Appointment cancellation
- `appointment_reminder` - Upcoming appointment reminder

### Color Schemes
- **Appointment Created**: Teal gradient (`#346870` to `#5fa8b5`)
- **High Priority**: Red to pink gradient
- **Cancelled**: Red to pink gradient
- **Reminder**: Amber to orange gradient

## 🎨 Design Specifications

### Notification Bell
- **Size**: 40px × 40px button
- **Badge**: Red gradient with white text
- **Hover**: Scale 1.05, shadow increase
- **Active**: Scale 0.95

### Dropdown
- **Width**: 384px (96 in Tailwind)
- **Max Height**: 480px (scrollable)
- **Border Radius**: 16px (rounded-2xl)
- **Shadow**: 2xl with gray-900/10 opacity
- **Backdrop**: Blur-xl with white/95 opacity

### Notification Cards
- **Icon Size**: 40px × 40px with gradient background
- **Spacing**: 20px padding
- **Hover**: Gray-50 background
- **Unread**: Blue-50/30 background
- **Animation**: Fade in from left with stagger

## 🔧 Configuration

### Environment Variables

```env
# Server
VITE_API_URL=http://localhost:5000

# Client (automatically uses VITE_API_URL)
```

### WebSocket Authentication

The system uses JWT tokens for authentication:
- **Client**: Token from `localStorage.getItem("token")`
- **Admin**: Token from `localStorage.getItem("adminToken")`

## 📱 Responsive Behavior

### Mobile (< 1024px)
- Dropdown width: `calc(100vw - 2rem)`
- Compact spacing
- Touch-optimized tap targets

### Desktop (≥ 1024px)
- Fixed 384px width
- Hover effects enabled
- Keyboard navigation support

## 🎯 Integration Points

### Current Integrations

1. **Appointment Creation** (`server/src/controllers/appointmentController.js`)
   - Notifies user on successful booking
   - Notifies admins of new appointment

### Future Integration Points

2. **Appointment Cancellation**
3. **Appointment Reminders** (24h before)
4. **Payment Confirmations**
5. **Subscription Updates**
6. **System Announcements**

## 🔐 Security

- **Authentication**: JWT token validation on WebSocket connection
- **Authorization**: Room-based access control (user-specific, admin-only)
- **Data Validation**: All notification data sanitized
- **Rate Limiting**: Can be added to prevent spam

## 🎭 Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Announcements**: Screen reader announcements for new notifications

## 🐛 Troubleshooting

### Notifications Not Appearing

1. Check WebSocket connection in browser console
2. Verify token is stored in localStorage
3. Check server logs for Socket.IO initialization
4. Ensure CORS is properly configured

### Connection Issues

```javascript
// Check connection status
socket.on("connect", () => console.log("Connected"));
socket.on("disconnect", () => console.log("Disconnected"));
socket.on("connect_error", (error) => console.error(error));
```

## 📦 Dependencies

### Server
- `socket.io`: ^4.x

### Client/Admin
- `socket.io-client`: ^4.x
- `framer-motion`: ^12.x
- `@heroicons/react`: ^2.x

## 🚀 Future Enhancements

- [ ] Notification persistence (database storage)
- [ ] Notification preferences/settings
- [ ] Email digest for missed notifications
- [ ] Push notifications (PWA)
- [ ] Notification categories/filters
- [ ] Search functionality
- [ ] Notification history page
- [ ] Custom notification sounds per type
- [ ] Do Not Disturb mode
- [ ] Notification scheduling

## 📄 License

Part of Teerthanker Dental Care Management System
