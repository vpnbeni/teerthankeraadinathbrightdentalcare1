# PWA Setup - Admin Panel

## Overview
The admin panel is now configured as a Progressive Web App (PWA), allowing it to be installed on devices and work offline.

## Features
- **Installable**: Can be installed on desktop and mobile devices
- **Offline Support**: Service worker caches assets for offline access
- **App-like Experience**: Runs in standalone mode without browser UI
- **Auto-updates**: Service worker automatically updates when new versions are deployed

## Configuration

### Vite PWA Plugin
The PWA is configured in `vite.config.js` using `vite-plugin-pwa`:

- **Register Type**: `autoUpdate` - automatically updates the service worker
- **Manifest**: Defines app name, icons, theme colors, and display mode
- **Workbox**: Configures caching strategies for different resource types

### Caching Strategies
1. **API Calls**: NetworkFirst strategy with 24-hour cache
2. **Google Fonts**: CacheFirst strategy with 1-year cache
3. **Static Assets**: Precached during build (JS, CSS, HTML, images)

### Icons
PWA icons are located in `admin/public/`:
- `pwa-64x64.png` - Small icon
- `pwa-192x192.png` - Standard icon
- `pwa-512x512.png` - Large icon
- `maskable-icon-512x512.png` - Maskable icon for adaptive displays
- `apple-touch-icon.png` - iOS home screen icon
- `favicon.ico` - Browser favicon

## Building

### Development
```bash
npm run dev
```
Note: PWA features are disabled in development mode for faster builds.

### Production Build
```bash
npm run build
```
This generates:
- `dist/manifest.webmanifest` - PWA manifest
- `dist/sw.js` - Service worker
- `dist/registerSW.js` - Service worker registration script

### Preview PWA
```bash
npm run build:pwa
```
Builds and previews the PWA locally.

## Installation

### Desktop
1. Open the admin panel in Chrome/Edge
2. Look for the install icon in the address bar
3. Click "Install" to add to desktop

### Mobile
1. Open the admin panel in mobile browser
2. Tap the browser menu
3. Select "Add to Home Screen" or "Install App"

## Offline Functionality
When offline, the app will:
- Load cached pages and assets
- Show cached API responses (up to 24 hours old)
- Display an offline page if no cache is available

## Theme Color
The app uses `#346870` (teal) as the theme color, matching the brand identity.

## Manifest Details
- **Name**: Teerthanker Dental Care - Admin
- **Short Name**: Admin Panel
- **Display**: Standalone (full-screen app mode)
- **Orientation**: Portrait
- **Start URL**: `/` (root of the app)

## Service Worker Updates
The service worker automatically checks for updates and installs them in the background. Users will get the latest version on their next visit.

## Testing
To test PWA functionality:
1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools > Application > Manifest
4. Check "Service Workers" and "Cache Storage" tabs

## Troubleshooting

### PWA not installing
- Ensure you're using HTTPS (required for PWA)
- Check browser console for errors
- Verify manifest.webmanifest is accessible

### Service worker not updating
- Clear browser cache and service workers
- Hard refresh (Ctrl+Shift+R)
- Check DevTools > Application > Service Workers > Update

### Icons not showing
- Verify icons exist in `admin/public/`
- Check manifest.webmanifest has correct icon paths
- Clear cache and reinstall the app
