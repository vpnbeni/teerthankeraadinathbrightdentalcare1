# Logo Loader - Quick Reference Card

## 🚀 Quick Start

### Use the New Loader (Recommended)
```jsx
import { PageSpinner } from '../shared/components';

<PageSpinner message="Loading..." />
```

### Custom Implementation
```jsx
import LoadingSpinner from '../shared/components/LoadingSpinner';

<LoadingSpinner 
  variant="logo-wave"
  message="Loading your data..."
/>
```

## 📋 Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `"circle"` | Use `"logo-wave"` for new loader |
| `size` | string | `"md"` | `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"` |
| `message` | string | - | Optional loading message |
| `fullScreen` | boolean | `false` | Cover entire screen |
| `overlay` | boolean | `false` | Overlay on content |
| `ariaLabel` | string | `"Loading"` | Accessibility label |

## 🎨 Design Specs

```
Size:        240px × 240px
Logo:        80px × 80px
Color:       #346870 (primary)
Waves:       4 layers
Animation:   2.5s per cycle
```

## 📍 Where It's Used

✅ App initialization (`App.jsx`)
✅ Page loading (`PageSpinner`)
✅ Full-screen states
✅ All major loading scenarios

## 🎯 Common Patterns

### Full Page Loading
```jsx
<PageSpinner message="Loading dashboard..." />
```

### Conditional Loading
```jsx
{loading ? (
  <LoadingSpinner variant="logo-wave" />
) : (
  <YourContent />
)}
```

### With Overlay
```jsx
<LoadingSpinner 
  variant="logo-wave"
  overlay
  message="Saving..."
/>
```

## 🔧 Customization

### Change Message
```jsx
<PageSpinner message="Please wait..." />
```

### Full Screen
```jsx
<LoadingSpinner 
  variant="logo-wave"
  fullScreen
/>
```

### Custom Styling
```jsx
<LoadingSpinner 
  variant="logo-wave"
  className="my-custom-class"
/>
```

## ⚡ Performance Tips

✅ Use `PageSpinner` for full-page loads
✅ Use `CIRCLE` variant for small inline loaders
✅ Avoid nesting multiple logo loaders
✅ Let CSS handle animations (GPU accelerated)

## 🐛 Troubleshooting

### Loader not showing?
- Check if `variant="logo-wave"` is set
- Verify logo URL is accessible
- Check container has sufficient height

### Animation not smooth?
- Ensure Tailwind config is compiled
- Check browser supports CSS animations
- Verify no conflicting CSS

### Logo not loading?
- Check Cloudinary URL is accessible
- Verify network connection
- Check browser console for errors

## 📚 Related Files

- `admin/src/shared/components/LoadingSpinner.jsx` - Main component
- `admin/tailwind.config.js` - Animation config
- `admin/src/App.jsx` - Usage example
- `admin/LOADER_IMPLEMENTATION_SUMMARY.md` - Full docs

## 🎉 Quick Tips

💡 Use `PageSpinner` for consistency
💡 Logo loader is best for full-page loads
💡 Use smaller variants for inline loading
💡 Message prop is optional but helpful
💡 Respects user's motion preferences

---

**Need help?** Check `LOADER_IMPLEMENTATION_SUMMARY.md` for detailed documentation.
