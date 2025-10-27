# Production Deployment Guide

## Changes Made for Vercel Compatibility

### Problem
Vercel's serverless functions don't support WebSocket connections (Socket.IO), causing connection errors in production.

### Solution
Replaced real-time WebSocket notifications with database-backed polling system.

---

## How It Works Now

### Server Side
- **Notifications are always saved to MongoDB** (no change)
- **Socket.IO is disabled in production** (only runs in development)
- All notification functions continue to work, just without real-time push

### Client & Admin Side
- **Removed Socket.IO dependency** for production
- **Polling system** checks for new notifications:
  - Every 30 seconds when tab is active
  - Immediately when window/tab gets focus
  - On initial page load
- **Sound notifications** still play when new notifications arrive
- **No code changes needed** - same API, same functionality

---

## Deployment Steps

### 1. Update Environment Files

**Client** (`client/.env.production`):
```env
VITE_RAZORPAY_KEY_ID=your-production-razorpay-key-id
```

**Admin** (`admin/.env.production`):
Already configured ✓

### 2. Build for Production

```bash
# Build Admin
cd admin
npm run build:prod

# Build Client
cd ../client
npm run build:prod
```

### 3. Deploy

- **Admin**: Deploy `admin/dist` folder
- **Client**: Deploy `client/dist` folder  
- **Server**: Already on Vercel (no changes needed)

### 4. Set Environment Variables on Vercel

Make sure your Vercel project has these environment variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NODE_ENV=production`
- All other vars from `server/.env`

---

## What Changed

### Files Modified

**Server:**
- `server/src/services/socketService.js` - Disabled Socket.IO in production

**Admin:**
- `admin/src/contexts/NotificationContext.jsx` - Replaced WebSocket with polling

**Client:**
- `client/src/contexts/NotificationContext.jsx` - Replaced WebSocket with polling

### Behavior Changes

| Feature | Before | After |
|---------|--------|-------|
| Development | Real-time WebSocket | Real-time WebSocket (unchanged) |
| Production | WebSocket (broken) | Polling every 30s + on focus |
| Notification Storage | Database | Database (unchanged) |
| API Endpoints | Same | Same (unchanged) |

---

## Testing

### Local Development
```bash
# Server
cd server
npm run dev

# Admin
cd admin
npm run dev

# Client
cd client
npm run dev
```
WebSockets will work normally in development.

### Production Testing
1. Deploy to Vercel
2. Open admin/client in browser
3. Create an appointment (triggers notification)
4. Switch to another tab, then back - notification should appear
5. Wait 30 seconds - new notifications should appear

---

## Performance Notes

- **Polling interval**: 30 seconds (configurable in NotificationContext.jsx)
- **Only polls when tab is active** (pauses when tab is hidden)
- **Immediate refresh on focus** (no waiting when you return to the tab)
- **Minimal server load** (one API call per user every 30s max)

---

## Future Improvements (Optional)

If you need true real-time notifications in production:

1. **Deploy server to Railway/Render** (supports WebSockets)
2. **Use Vercel Edge Functions** (limited WebSocket support)
3. **Use a third-party service** (Pusher, Ably, Firebase)
4. **Keep current setup** (works great for most use cases)

---

## Troubleshooting

### Notifications not appearing
- Check browser console for errors
- Verify user is authenticated
- Check notification API endpoint works: `GET /api/notifications`

### Old WebSocket errors in console
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Rebuild and redeploy client/admin

### Notifications delayed
- Normal behavior - up to 30 second delay
- Switch tabs to trigger immediate refresh
- Reduce polling interval if needed (line 91 in NotificationContext.jsx)
