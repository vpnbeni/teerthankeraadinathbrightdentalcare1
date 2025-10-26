# 🔧 CORS Fix for Notification System

## Issue

The admin panel was getting CORS errors when trying to connect to the WebSocket server:

```
Access to XMLHttpRequest at 'http://localhost:5000/socket.io/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 
'http://localhost:5173' that is not equal to the supplied origin.
```

## Root Cause

The Socket.IO server was only configured to allow connections from the client URL (`http://localhost:5173`) but not from the admin panel URL (`http://localhost:3001`).

## Solution Applied

Updated `server/src/services/socketService.js` to use the same CORS configuration as the main Express server, which already includes both client and admin URLs.

### Before:
```javascript
io = new Server(server, {
  cors: {
    origin: config.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});
```

### After:
```javascript
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
```

## Allowed Origins

### Development
- `http://localhost:3000` (Client default)
- `http://localhost:3001` (Admin default)
- `http://localhost:5173` (Vite default)
- `http://127.0.0.1:5173`

### Production
- Production client URL
- Production admin URL
- Vercel deployment URLs

## Testing the Fix

1. **Restart the server**:
   ```bash
   cd server
   npm start
   ```

2. **Open admin panel**: `http://localhost:3001`

3. **Check browser console**: Should see:
   ```
   ✅ Connected to notification server
   ```

4. **No more CORS errors!**

## Verification

After the fix, you should see in the browser console:
- ✅ No CORS errors
- ✅ "Connected to notification server" message
- ✅ WebSocket connection established

## Additional Notes

- The CORS configuration is centralized in `server/src/config/environment.js`
- Both Express and Socket.IO now use the same allowed origins
- The configuration automatically switches between development and production
- Credentials are enabled for cookie-based authentication

## If You Still See CORS Errors

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Restart the server** completely
3. **Check your .env file** has correct URLs:
   ```env
   CLIENT_URL=http://localhost:5173
   ADMIN_URL=http://localhost:3001
   ```
4. **Verify the port** your admin panel is running on matches the allowed origins

## Related Files

- `server/src/services/socketService.js` - Socket.IO initialization
- `server/src/config/environment.js` - CORS configuration
- `server/src/middleware/security.js` - Express CORS middleware

---

**Status**: ✅ **FIXED**

The notification system now works correctly for both client and admin dashboards!
