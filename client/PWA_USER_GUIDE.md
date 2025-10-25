# PWA User Guide

## What is a Progressive Web App?

A Progressive Web App (PWA) is a website that works like a native mobile or desktop app. Users can:
- Install it on their device
- Use it offline
- Get a native app-like experience
- Receive updates automatically

## For End Users

### How to Install the App

#### On Desktop (Chrome/Edge)

1. **Visit the website**
2. **Look for the install icon** in the address bar (⊕ or install icon)
3. **Click the icon** or use the custom install prompt
4. **Click "Install"** in the dialog
5. **App opens in its own window** - no browser UI!

#### On Mobile (Android)

1. **Visit the website** in Chrome
2. **Tap the menu** (three dots)
3. **Select "Add to Home Screen"** or "Install App"
4. **Confirm installation**
5. **App icon appears** on your home screen

#### On Mobile (iOS/Safari)

1. **Visit the website** in Safari
2. **Tap the Share button** (square with arrow)
3. **Scroll and tap "Add to Home Screen"**
4. **Name the app** and tap "Add"
5. **App icon appears** on your home screen

### Using the Installed App

Once installed:
- **Opens in standalone mode** - looks like a native app
- **No browser UI** - clean, focused experience
- **Works offline** - access your data anytime
- **Fast loading** - instant startup from cache
- **Auto-updates** - always get the latest version

### Offline Features

When you lose internet connection:
- **Yellow banner appears** at the top
- **App continues to work** with cached data
- **Recent data available** from cache
- **Reconnects automatically** when online

### Getting Updates

When a new version is available:
- **Notification appears** at the bottom
- **Click "Reload"** to get the update
- **Or click "Later"** to update next time
- **No data loss** - seamless update

### Uninstalling the App

#### Desktop
1. **Right-click the app icon** in taskbar/dock
2. **Select "Uninstall"** or "Remove"
3. Or go to **Settings > Apps** and uninstall

#### Mobile (Android)
1. **Long-press the app icon**
2. **Drag to "Uninstall"** or tap app info
3. **Confirm uninstallation**

#### Mobile (iOS)
1. **Long-press the app icon**
2. **Tap "Remove App"**
3. **Confirm deletion**

## For Developers

### Installation Flow

```
User visits site
    ↓
Service worker installs (background)
    ↓
Assets cached
    ↓
Install prompt appears (after 2-3 visits)
    ↓
User clicks "Install"
    ↓
App installed
    ↓
Opens in standalone mode
```

### Update Flow

```
New version deployed
    ↓
Service worker detects update
    ↓
Update prompt appears
    ↓
User clicks "Reload"
    ↓
New version activates
    ↓
Page reloads with new version
```

### Offline Flow

```
User goes offline
    ↓
Offline indicator shows
    ↓
App serves from cache
    ↓
User continues working
    ↓
User goes online
    ↓
Indicator hides
    ↓
Fresh data syncs
```

## Features Overview

### ✅ What Works Offline

- **View cached pages** - All visited pages
- **View appointments** - Recently loaded data
- **View profile** - Cached user data
- **Navigate the app** - All routes work
- **View payments** - Recent payment history

### ❌ What Requires Internet

- **Book new appointments** - Needs server
- **Make payments** - Requires payment gateway
- **Update profile** - Needs to sync with server
- **Real-time data** - Latest appointments/updates
- **Login/Logout** - Authentication requires server

## User Experience

### First Visit
- Normal website experience
- Service worker installs silently
- Assets cached in background
- No visible changes

### Second Visit
- **Faster loading** - from cache
- Install prompt may appear
- Can add to home screen
- Offline support active

### Installed App
- **Standalone window** - no browser UI
- **App icon** on desktop/home screen
- **Native feel** - smooth animations
- **Offline capable** - works without internet

### Offline Usage
- **Yellow banner** shows status
- **Cached data** available
- **Limited features** - read-only mostly
- **Auto-reconnect** when online

### Updates
- **Automatic detection** - no manual checks
- **User control** - choose when to update
- **No interruption** - current session continues
- **Seamless** - no data loss

## Benefits for Users

### Speed
- ⚡ **Instant loading** from cache
- ⚡ **Fast navigation** - no page reloads
- ⚡ **Quick startup** - cached assets

### Reliability
- 🔒 **Works offline** - always accessible
- 🔒 **Cached data** - recent info available
- 🔒 **Auto-reconnect** - seamless online/offline

### Engagement
- 📱 **Native feel** - app-like experience
- 📱 **Home screen icon** - easy access
- 📱 **Standalone mode** - focused experience

### Convenience
- 🎯 **No app store** - install from browser
- 🎯 **Auto-updates** - always latest version
- 🎯 **Cross-platform** - works everywhere

## FAQ

### Q: Do I need to download anything?
**A:** No! Just visit the website and click "Install" when prompted.

### Q: How much space does it take?
**A:** Very little - typically 5-10 MB for cached assets.

### Q: Will it work without internet?
**A:** Yes! After first visit, most features work offline.

### Q: How do I update the app?
**A:** Updates happen automatically. Just click "Reload" when prompted.

### Q: Can I use it on multiple devices?
**A:** Yes! Install on all your devices - phone, tablet, desktop.

### Q: Is it secure?
**A:** Yes! Uses HTTPS and same security as the website.

### Q: What if I uninstall it?
**A:** No problem! Just visit the website again to reinstall.

### Q: Does it use mobile data?
**A:** Only for new data. Cached content loads without data.

## Tips for Best Experience

1. **Install the app** - for fastest access
2. **Visit regularly** - keeps cache fresh
3. **Update when prompted** - get latest features
4. **Use offline** - access data anytime
5. **Add to home screen** - quick access

## Troubleshooting

### Install prompt not showing?
- Visit the site 2-3 times
- Make sure you're on HTTPS
- Try a different browser (Chrome/Edge)

### App not working offline?
- Visit the site once while online
- Wait for "offline ready" message
- Check your browser supports PWAs

### Updates not applying?
- Click "Reload" when prompted
- Or close and reopen the app
- Clear browser cache if needed

### App running slow?
- Clear app cache in settings
- Reinstall the app
- Check internet connection

## Support

For issues or questions:
- Check the FAQ above
- Contact support through the app
- Visit the website for help

---

**Enjoy your Progressive Web App experience!** 🎉
