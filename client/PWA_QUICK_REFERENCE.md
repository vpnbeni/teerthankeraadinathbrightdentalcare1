# PWA Quick Reference Card

## 🚀 Quick Commands

```bash
# Install dependencies (already done)
npm install

# Generate icons
start generate-pwa-icons.html

# Build and test PWA
npm run build:pwa

# Build for production
npm run build

# Preview build
npm run preview
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `vite.config.js` | PWA configuration |
| `src/App.jsx` | PWA components integration |
| `src/components/PWAInstallPrompt.jsx` | Install UI |
| `src/components/PWAUpdatePrompt.jsx` | Update UI |
| `src/components/OfflineIndicator.jsx` | Offline banner |
| `src/hooks/usePWA.js` | PWA React hooks |
| `public/offline.html` | Offline fallback |
| `generate-pwa-icons.html` | Icon generator |

## 🎨 Required Icons

Place in `client/public/`:
- `pwa-64x64.png` (64x64)
- `pwa-192x192.png` (192x192)
- `pwa-512x512.png` (512x512)
- `maskable-icon-512x512.png` (512x512)
- `apple-touch-icon.png` (180x180)
- `favicon.ico` (32x32)

## 🧪 Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Service worker registers (DevTools > Application)
- [ ] Manifest loads (DevTools > Application > Manifest)
- [ ] Cache works (DevTools > Application > Cache Storage)
- [ ] Install prompt appears
- [ ] Offline mode works (DevTools > Network > Offline)
- [ ] Update prompt works
- [ ] Lighthouse PWA score > 90

## 🎯 Configuration

### Change Theme Color
```javascript
// vite.config.js
theme_color: '#0ea5e9'
```

### Change App Name
```javascript
// vite.config.js
manifest: {
  name: 'Your App Name',
  short_name: 'Short'
}
```

### Modify Caching
```javascript
// vite.config.js
workbox: {
  runtimeCaching: [
    // Add custom rules
  ]
}
```

## 🔧 React Hooks

```javascript
import { usePWA, useOnlineStatus } from './hooks/usePWA';

function MyComponent() {
  const { isInstalled, isStandalone, canInstall } = usePWA();
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {isInstalled && <p>App is installed!</p>}
      {!isOnline && <p>You're offline</p>}
    </div>
  );
}
```

## 📊 Caching Strategies

| Resource | Strategy | Cache Time |
|----------|----------|------------|
| Static Assets | Cache First | Permanent |
| API Calls | Network First | 24 hours |
| Fonts | Cache First | 1 year |

## 🐛 Troubleshooting

### Service Worker Not Working
```bash
# Clear and rebuild
rm -rf dist .vite
npm run build
```

### Install Prompt Not Showing
- Requires HTTPS (or localhost)
- Visit site 2-3 times
- Not supported in Safari

### Cache Not Updating
1. DevTools > Application > Service Workers
2. Click "Unregister"
3. Clear cache storage
4. Hard reload (Ctrl+Shift+R)

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Safari | ⚠️ Partial |
| Firefox | ⚠️ Partial |
| Mobile | ✅ Full |

## 🎉 Success Indicators

✅ Lighthouse PWA score > 90
✅ App installs on desktop/mobile
✅ Works offline after first visit
✅ Fast load times (< 2s)
✅ Update prompts appear
✅ Offline indicator shows

## 📚 Documentation

- `PWA_SETUP.md` - Quick start
- `PWA_README.md` - Complete docs
- `PWA_CHECKLIST.md` - Implementation checklist
- `PWA_ARCHITECTURE.md` - System architecture
- `PWA_IMPLEMENTATION_SUMMARY.md` - What was done

## 🔗 Useful Links

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Maskable Icon Editor](https://maskable.app/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## ⚡ Performance Tips

1. **Preload Critical Assets**: Add to manifest
2. **Lazy Load Routes**: Use React.lazy()
3. **Optimize Images**: Use WebP format
4. **Minimize Bundle**: Code splitting
5. **Cache Strategically**: Balance freshness vs speed

## 🔒 Security Notes

- HTTPS required for service workers
- Only cache successful responses (200)
- Validate responses before caching
- Clear old caches on update
- User controls update timing

## 📈 Monitoring

Track these metrics:
- Installation rate
- Offline usage
- Cache hit rate
- Update adoption
- Load performance

## 💡 Pro Tips

1. Test on real devices, not just emulators
2. Monitor service worker updates in production
3. Keep documentation updated
4. Use Lighthouse regularly
5. Gather user feedback on PWA features

---

**Need Help?** See `PWA_SETUP.md` for detailed instructions.
