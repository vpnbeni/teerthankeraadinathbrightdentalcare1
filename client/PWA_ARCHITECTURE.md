# PWA Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    React App                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  App.jsx                                        │  │  │
│  │  │  ├─ PWAInstallPrompt                           │  │  │
│  │  │  ├─ PWAUpdatePrompt                            │  │  │
│  │  │  └─ OfflineIndicator                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Custom Hooks                                   │  │  │
│  │  │  ├─ usePWA()                                    │  │  │
│  │  │  └─ useOnlineStatus()                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Worker (SW)                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Workbox Strategies                             │  │  │
│  │  │  ├─ NetworkFirst (API calls)                   │  │  │
│  │  │  ├─ CacheFirst (Static assets)                 │  │  │
│  │  │  └─ StaleWhileRevalidate (Images)              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cache Storage                            │  │
│  │  ├─ Static Assets Cache                              │  │
│  │  ├─ API Response Cache                               │  │
│  │  └─ Font Cache                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                      Network                                 │
│  ├─ API Server (teerthanker-server.vercel.app)             │
│  ├─ CDN (Static Assets)                                     │
│  └─ External Resources (Fonts, etc.)                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Flow

### 1. App Installation Flow

```
User Visits Site
      ↓
Service Worker Installs
      ↓
Assets Cached
      ↓
beforeinstallprompt Event Fires
      ↓
PWAInstallPrompt Shows
      ↓
User Clicks "Install"
      ↓
App Installed
      ↓
appinstalled Event Fires
      ↓
Prompt Dismissed
```

### 2. Update Flow

```
New Version Deployed
      ↓
Service Worker Detects Update
      ↓
New SW Waits in Background
      ↓
PWAUpdatePrompt Shows
      ↓
User Clicks "Reload"
      ↓
updateServiceWorker() Called
      ↓
New SW Activates
      ↓
Page Reloads
      ↓
New Version Active
```

### 3. Offline Flow

```
User Goes Offline
      ↓
offline Event Fires
      ↓
useOnlineStatus() Updates
      ↓
OfflineIndicator Shows
      ↓
User Navigates App
      ↓
Service Worker Serves from Cache
      ↓
API Calls Return Cached Data
      ↓
User Goes Online
      ↓
online Event Fires
      ↓
OfflineIndicator Hides
      ↓
Fresh Data Fetched
```

## Caching Strategy Details

### Static Assets (Cache First)
```
Request → Check Cache → Found? → Return from Cache
                      → Not Found? → Fetch from Network
                                   → Store in Cache
                                   → Return to App
```

### API Calls (Network First)
```
Request → Try Network → Success? → Update Cache
                                 → Return to App
                     → Failed? → Check Cache
                              → Found? → Return from Cache
                              → Not Found? → Return Error
```

### Fonts (Cache First, Long-term)
```
Request → Check Cache → Found? → Return from Cache
                      → Not Found? → Fetch from Network
                                   → Store in Cache (1 year)
                                   → Return to App
```

## File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── PWAInstallPrompt.jsx    ← Install UI
│   │   ├── PWAUpdatePrompt.jsx     ← Update UI
│   │   └── OfflineIndicator.jsx    ← Offline Banner
│   ├── hooks/
│   │   └── usePWA.js               ← PWA Hooks
│   └── App.jsx                     ← Main App (integrates PWA)
├── public/
│   ├── offline.html                ← Offline Fallback
│   ├── pwa-64x64.png              ← Icons
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── maskable-icon-512x512.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── vite.config.js                  ← PWA Configuration
├── index.html                      ← PWA Meta Tags
└── package.json                    ← Dependencies

Generated at Build:
├── dist/
│   ├── sw.js                       ← Service Worker
│   ├── manifest.webmanifest        ← Web Manifest
│   └── workbox-*.js               ← Workbox Runtime
```

## Event Lifecycle

### Service Worker Events

```javascript
// Install
self.addEventListener('install', (event) => {
  // Cache static assets
  // Skip waiting to activate immediately
});

// Activate
self.addEventListener('activate', (event) => {
  // Clean up old caches
  // Claim clients
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Intercept network requests
  // Apply caching strategy
  // Return cached or network response
});

// Message
self.addEventListener('message', (event) => {
  // Handle messages from app
  // Skip waiting on update
});
```

### App Events

```javascript
// Before Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default prompt
  // Store event for custom prompt
  // Show custom install UI
});

// App Installed
window.addEventListener('appinstalled', () => {
  // Track installation
  // Hide install prompt
  // Show success message
});

// Online/Offline
window.addEventListener('online', () => {
  // Update UI
  // Sync pending data
});

window.addEventListener('offline', () => {
  // Update UI
  // Show offline indicator
});
```

## Data Flow

### First Load (Online)
```
User → App → Service Worker → Network → API
                    ↓
              Cache Storage
                    ↓
                  User
```

### Subsequent Load (Online)
```
User → App → Service Worker → Cache (instant)
                    ↓
                 Network (background)
                    ↓
              Update Cache
                    ↓
              Update UI (if changed)
```

### Offline Load
```
User → App → Service Worker → Cache → User
                    ↓
              (Network unavailable)
```

## Performance Optimization

### Load Time Optimization
1. **First Load**: Service worker installs in background
2. **Second Load**: Instant load from cache
3. **Subsequent Loads**: Cache-first for static assets

### Network Optimization
1. **API Calls**: Network-first with cache fallback
2. **Static Assets**: Cache-first (no network delay)
3. **Fonts**: Long-term cache (1 year)

### Update Strategy
1. **Background Updates**: New SW waits in background
2. **User Control**: User decides when to update
3. **No Interruption**: Current session continues

## Security Considerations

### HTTPS Required
- Service workers only work on HTTPS
- Localhost exception for development
- Ensures secure communication

### Cache Security
- Only caches successful responses (200 status)
- Validates response before caching
- Clears old caches on update

### Update Security
- Automatic update checks
- Validates new service worker
- User confirmation before reload

## Browser Compatibility

| Feature              | Chrome | Edge | Safari | Firefox |
|---------------------|--------|------|--------|---------|
| Service Worker      | ✅     | ✅   | ✅     | ✅      |
| Web Manifest        | ✅     | ✅   | ✅     | ✅      |
| Install Prompt      | ✅     | ✅   | ⚠️     | ⚠️      |
| Push Notifications  | ✅     | ✅   | ❌     | ✅      |
| Background Sync     | ✅     | ✅   | ❌     | ❌      |
| Offline Support     | ✅     | ✅   | ✅     | ✅      |

✅ Full Support | ⚠️ Partial Support | ❌ No Support

## Monitoring & Analytics

### Key Metrics to Track
1. **Installation Rate**: % of users who install
2. **Offline Usage**: % of sessions offline
3. **Cache Hit Rate**: % of requests from cache
4. **Update Adoption**: Time to update
5. **Load Performance**: Time to interactive

### Implementation
```javascript
// Track installation
window.addEventListener('appinstalled', () => {
  analytics.track('PWA Installed');
});

// Track offline usage
if (!navigator.onLine) {
  analytics.track('Offline Session');
}

// Track cache hits
// (Implement in service worker)
```

## Troubleshooting Guide

### Service Worker Not Registering
- Check HTTPS (required)
- Check browser console for errors
- Verify vite.config.js configuration

### Install Prompt Not Showing
- Requires HTTPS
- User must visit site 2-3 times
- Not supported in all browsers

### Cache Not Working
- Check service worker is active
- Verify cache storage in DevTools
- Check network requests in DevTools

### Updates Not Applying
- Unregister old service worker
- Clear cache storage
- Hard reload (Ctrl+Shift+R)

---

This architecture provides a robust, performant, and user-friendly PWA experience.
