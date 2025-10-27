# PWA Quick Reference - Admin Panel

## Installation Status
✅ PWA Configured and Functional

## Key Files

### Configuration
- `vite.config.js` - PWA plugin configuration
- `index.html` - PWA meta tags
- `package.json` - Dependencies and scripts

### Generated Files (in dist/)
- `manifest.webmanifest` - App manifest
- `sw.js` - Service worker
- `registerSW.js` - SW registration
- `workbox-*.js` - Workbox runtime

### Assets
- `public/pwa-64x64.png`
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/maskable-icon-512x512.png`
- `public/apple-touch-icon.png`
- `public/favicon.ico`
- `public/offline.html`

## Commands

```bash
# Development (PWA disabled for speed)
npm run dev

# Production build with PWA
npm run build

# Build and preview PWA
npm run build:pwa

# Preview built app
npm run preview
```

## App Details

| Property | Value |
|----------|-------|
| Name | Teerthanker Dental Care - Admin |
| Short Name | Admin Panel |
| Theme Color | #346870 (Teal) |
| Background | #ffffff (White) |
| Display Mode | Standalone |
| Orientation | Portrait |

## Caching Strategy

### API Calls
- Strategy: NetworkFirst
- Cache Duration: 24 hours
- Max Entries: 50

### Google Fonts
- Strategy: CacheFirst
- Cache Duration: 1 year
- Max Entries: 10

### Static Assets
- Strategy: Precache
- Files: JS, CSS, HTML, images, fonts

## Testing PWA

### Chrome DevTools
1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open DevTools (F12)
4. Go to Application tab
5. Check:
   - Manifest
   - Service Workers
   - Cache Storage

### Lighthouse
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"

### Install Test
1. Open app in Chrome/Edge
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

## Offline Test
1. Install the app
2. Open DevTools > Network
3. Select "Offline" throttling
4. Refresh the app
5. Verify cached content loads

## Update Process
1. Deploy new version
2. Service worker detects update
3. Downloads new assets in background
4. User gets update on next visit
5. No manual refresh needed

## Browser Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ⚠️ Requires HTTPS in production

## Common Issues

### Not installable?
- Check HTTPS is enabled
- Verify manifest is accessible
- Ensure icons are correct size

### Service worker not registering?
- Check browser console
- Verify HTTPS (required)
- Clear cache and retry

### Updates not applying?
- Hard refresh (Ctrl+Shift+R)
- Clear service workers in DevTools
- Uninstall and reinstall app

## Production Checklist
- [x] PWA plugin installed
- [x] Manifest configured
- [x] Icons generated (all sizes)
- [x] Service worker enabled
- [x] Offline page created
- [x] Meta tags added
- [x] Build script working
- [x] HTTPS enabled (required for production)

## Next Steps
1. Deploy to production with HTTPS
2. Test installation on various devices
3. Monitor service worker updates
4. Check PWA analytics
5. Gather user feedback on offline experience
