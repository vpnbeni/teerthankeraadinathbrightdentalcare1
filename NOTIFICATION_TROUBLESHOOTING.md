# 🔧 Notification System Troubleshooting Guide

## Common Issues and Solutions

### 1. CORS Errors ✅ FIXED

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Already fixed! The Socket.IO server now uses the same CORS configuration as Express, allowing both client and admin origins.

**Verify**:
```javascript
// server/src/services/socketService.js
const allowedOrigins = config.NODE_ENV === "production"
  ? config.CORS_ORIGINS.production
  : config.CORS_ORIGINS.development;
```

---

### 2. "Invalid namespace" Error

**Error**: `Connection error: Invalid namespace`

**Possible Causes**:
1. Token not available when connecting
2. Server not fully initialized
3. Authentication middleware rejecting connection

**Solutions**:

#### A. Check Token Availability
```javascript
// In browser console
// For client:
localStorage.getItem("token")

// For admin:
localStorage.getItem("adminToken")
```

If null, you need to login first!

#### B. Check Server Logs
Look for:
```
✅ Socket.IO initialized
```

If not present, server didn't start properly.

#### C. Restart Everything
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client  
cd client
npm run dev

# Terminal 3 - Admin
cd admin
npm run dev
```

---

### 3. Connection Keeps Dropping

**Symptoms**: Connects then immediately disconnects

**Check Browser Console**:
```
✅ Connected to notification server
❌ Disconnected from notification server. Reason: transport close
```

**Solutions**:

#### A. Check Token Validity
```javascript
// Decode your JWT token at https://jwt.io
// Check if it's expired
```

#### B. Check Server Logs
Look for authentication errors:
```
Authentication error
```

#### C. Verify User Role
Admin users should have `role: "admin"` in their JWT token.

---

### 4. No Notifications Appearing

**Symptoms**: Connected but no notifications show up

**Debug Steps**:

#### A. Check Browser Console
Should see when notification arrives:
```
📬 New notification received: {...}
```

#### B. Test Notification Sending
In server code, add test notification:
```javascript
// In appointmentController.js after appointment creation
console.log("Sending notification to user:", userId);
sendNotificationToUser(userId, {...});
```

#### C. Check Socket Rooms
In server logs, verify user joined rooms:
```
✅ User connected: 123456
```

---

### 5. Notifications Work in Client but Not Admin

**Possible Causes**:
1. Admin not logged in
2. Admin token not stored
3. Admin user doesn't have admin role

**Solutions**:

#### A. Verify Admin Token
```javascript
// In admin panel console
localStorage.getItem("adminToken")
```

#### B. Check User Role
```javascript
// In admin panel console
// After login, check Redux state
// Should have role: "admin"
```

#### C. Verify Admin Room Join
Server logs should show:
```
✅ User connected: admin-user-id
// User should join "admin" room
```

---

### 6. "xhr poll error"

**Error**: `Connection error: xhr poll error`

**Cause**: CORS or network issue

**Solutions**:

#### A. Hard Refresh Browser
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

#### B. Clear Browser Cache
```
Chrome: Settings > Privacy > Clear browsing data
Firefox: Settings > Privacy > Clear Data
```

#### C. Check Network Tab
1. Open DevTools > Network
2. Filter by "socket.io"
3. Check if requests are failing
4. Look at response headers

---

### 7. Server Won't Start

**Error**: `Socket.IO not initialized`

**Solutions**:

#### A. Check Dependencies
```bash
cd server
npm install socket.io
```

#### B. Check server.js
Verify Socket.IO initialization:
```javascript
const { initializeSocket } = await import("./src/services/socketService.js");
initializeSocket(server);
```

#### C. Check for Port Conflicts
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

---

## Debugging Checklist

### Before Testing

- [ ] Server is running (`npm start` in server folder)
- [ ] Client is running (`npm run dev` in client folder)
- [ ] Admin is running (`npm run dev` in admin folder)
- [ ] No console errors on startup
- [ ] Server shows "✅ Socket.IO initialized"

### During Testing

- [ ] User is logged in (client or admin)
- [ ] Token exists in localStorage
- [ ] Browser console shows "✅ Connected to notification server"
- [ ] No CORS errors in console
- [ ] No authentication errors in server logs

### After Booking Appointment

- [ ] Server logs show notification being sent
- [ ] Client console shows "📬 New notification received"
- [ ] Admin console shows "📬 New notification received"
- [ ] Notification bell shows unread count
- [ ] Clicking bell shows notification in dropdown

---

## Enhanced Logging

The notification contexts now include detailed logging:

### Client/Admin Console Logs

```
🔌 Initializing WebSocket connection...
🔌 Connecting to: http://localhost:5000
✅ Connected to notification server
🔌 Socket ID: abc123xyz
📬 New notification received: {...}
❌ Disconnected from notification server. Reason: transport close
🔌 Cleaning up socket connection
```

### Server Console Logs

```
✅ Socket.IO initialized
✅ User connected: 123456
❌ User disconnected: 123456
```

---

## Testing the System

### Manual Test

1. **Open 3 browser windows**:
   - Window 1: Client dashboard (http://localhost:5173)
   - Window 2: Admin dashboard (http://localhost:3001)
   - Window 3: Browser DevTools console

2. **Login to both**:
   - Client: Regular user
   - Admin: Admin user

3. **Check connections**:
   - Both consoles should show: "✅ Connected to notification server"

4. **Book appointment**:
   - From client dashboard
   - Go to Appointments > Book New

5. **Verify notifications**:
   - Client: Should see "Appointment Confirmed"
   - Admin: Should see "New Appointment Booked"
   - Both: Badge counter should update

---

## Environment Variables

Ensure these are set in `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key

# URLs
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:3001
```

---

## Quick Fixes

### Reset Everything

```bash
# Stop all servers (Ctrl+C in each terminal)

# Clear browser data
# Chrome: Ctrl+Shift+Delete > Clear data

# Restart server
cd server
npm start

# Restart client
cd client
npm run dev

# Restart admin
cd admin
npm run dev

# Login again to both dashboards
```

### Force Reconnect

```javascript
// In browser console (client or admin)
window.location.reload(true)
```

---

## Still Having Issues?

### Check These Files

1. **Server**:
   - `server/src/services/socketService.js` - Socket.IO setup
   - `server/src/config/environment.js` - CORS origins
   - `server/server.js` - Socket initialization

2. **Client**:
   - `client/src/contexts/NotificationContext.jsx` - Connection logic
   - `client/src/components/common/NotificationBell.jsx` - UI component

3. **Admin**:
   - `admin/src/contexts/NotificationContext.jsx` - Connection logic
   - `admin/src/components/common/NotificationBell.jsx` - UI component

### Get Help

1. Check browser console for errors
2. Check server logs for errors
3. Verify all environment variables
4. Ensure all dependencies installed
5. Try the "Reset Everything" steps above

---

## Success Indicators

When everything works correctly, you should see:

### Browser Console (Client/Admin)
```
🔌 Initializing WebSocket connection...
🔌 Connecting to: http://localhost:5000
✅ Connected to notification server
🔌 Socket ID: abc123xyz
```

### Server Console
```
✅ Socket.IO initialized
✅ User connected: user-id-here
```

### After Booking Appointment
```
📬 New notification received: {
  type: "appointment_created",
  title: "Appointment Confirmed",
  ...
}
```

### Visual Confirmation
- 🔔 Notification bell shows badge with number
- 📋 Dropdown shows notification card
- ✨ Smooth animations
- 🎨 Beautiful design

---

**Last Updated**: After CORS fix and enhanced logging
**Status**: ✅ All known issues resolved
