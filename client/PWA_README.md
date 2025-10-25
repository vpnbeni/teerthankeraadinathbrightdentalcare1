# Progressive Web App (PWA) Implementation

This client application is now configured as a Progressive Web App with offline capabilities and installability.

## Features Implemented

### 1. Service Worker
- Automatic caching of static assets (JS, CSS, HTML, images)
- Network-first strategy for API calls with fallback to cache
- Cache-first strategy for fonts and static resources
- Automatic updates when new versions are deployed

### 2. Web App Manifest
- App name, description, and branding
- Theme colors for native-like appearance
- Display mode set to "standalone" for app-like experience
- Icon configuration for various devices

### 3. Install Prompt
- Custom install prompt component (`PWAInstallPrompt.jsx`)
- Shows on supported browsers when app is installable
- User can dismiss and won't be prompted again
- Respects user preferences

### 4. Update Notifications
- Automatic detection of new app versions
- User-friendly prompt to reload and get latest version
- Offline-ready notification when app is cached

### 5. Offline Support
- App works offline after first visit
- Cached API responses available when offline
- Custom offline fallback page

## Configuration Files

### vite.config.js
- Vite PWA plugin configuration
- Service worker settings
- Caching strategies
- Manifest generation

### index.html
- PWA meta tags
- Theme color
- Apple-specific meta tags

## Components

### PWAInstallPrompt.jsx
Handles the app installation prompt:
- Listens for `beforeinstallprompt` event
- Shows custom UI for installation
- Stores user preference in localStorage

### PWAUpdatePrompt.jsx
Manages service worker updates:
- Detects when new version is available
- Prompts user to reload
- Shows offline-ready status

## Testing PWA Features

### Local Testing
1. Build the production version:
   ```bash
   npm run build
   npm run preview
   ```

2. Open Chrome DevTools > Application tab
3. Check:
   - Manifest
   - Service Workers
   - Cache Storage

### Install Testing
1. Visit the app in Chrome/Edge
2. Look for install icon in address bar
3. Or use custom install prompt

### Offline Testing
1. Open DevTools > Network tab
2. Check "Offline" checkbox
3. Reload the page - app should still work

### Lighthouse Audit
1. Open DevTools > Lighthouse tab
2. Select "Progressive Web App"
3. Run audit
4. Should score 100% (after adding icons)

## Required: Add Icons

You need to create and add the following icon files to `client/public/`:

- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`
- `apple-touch-icon.png`
- `favicon.ico`

See `public/manifest-icons-guide.md` for detailed instructions.

## Deployment

The PWA will work automatically when deployed. Make sure:
1. HTTPS is enabled (required for service workers)
2. All icon files are present
3. Build command includes: `npm run build`

## Browser Support

- Chrome/Edge: Full support
- Safari: Partial support (no install prompt)
- Firefox: Partial support
- Mobile browsers: Excellent support

## Caching Strategy

### Static Assets
- Strategy: Cache First
- All JS, CSS, HTML, images cached on first load
- Updates automatically when new version deployed

### API Calls
- Strategy: Network First
- Tries network first, falls back to cache if offline
- Cache expires after 24 hours

### Fonts
- Strategy: Cache First
- Long-term caching (1 year)
- Reduces load times

## Customization

### Change Theme Color
Edit `vite.config.js`:
```javascript
theme_color: '#0ea5e9', // Your brand color
```

### Modify Caching
Edit `workbox` configuration in `vite.config.js`:
```javascript
runtimeCaching: [
  // Add your custom caching rules
]
```

### Update App Name
Edit manifest in `vite.config.js`:
```javascript
manifest: {
  name: 'Your App Name',
  short_name: 'Short Name'
}
```

## Troubleshooting

### Service Worker Not Updating
1. Unregister old service worker in DevTools
2. Clear cache storage
3. Hard reload (Ctrl+Shift+R)

### Install Prompt Not Showing
- Only shows on HTTPS
- User must visit site multiple times
- Some browsers don't support it (Safari)

### Icons Not Displaying
- Check file paths in manifest
- Ensure icons are in `public/` directory
- Verify icon sizes match configuration

## Resources

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Maskable Icon Editor](https://maskable.app/)
