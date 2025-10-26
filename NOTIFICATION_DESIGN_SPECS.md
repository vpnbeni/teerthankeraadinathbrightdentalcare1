# 🎨 Notification System - Design Specifications

## Visual Design Philosophy

The notification system embodies a **premium, modern, and luxurious aesthetic** with:
- Refined glass morphism effects
- Smooth, purposeful animations
- Thoughtful color gradients
- Perfect spacing and balance
- Pixel-perfect attention to detail

---

## 🔔 Notification Bell Button

### Dimensions
```
Width: 44px
Height: 44px
Padding: 10px
Border Radius: 12px (rounded-xl)
```

### Colors
```css
Background: rgba(255, 255, 255, 0.6) /* white/60 */
Backdrop Filter: blur(12px)
Border: 1px solid rgba(229, 231, 235, 0.5) /* gray-200/50 */
Icon: #374151 /* gray-700 */
```

### Hover State
```css
Transform: scale(1.05)
Background: rgba(255, 255, 255, 0.8) /* white/80 */
Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
Transition: all 200ms ease
```

### Active State
```css
Transform: scale(0.95)
```

---

## 🔴 Unread Badge

### Dimensions
```
Min Width: 20px
Height: 20px
Padding: 0 6px
Border Radius: 9999px (full circle)
```

### Colors
```css
Background: linear-gradient(to right, #ef4444, #ec4899)
/* Red-500 to Pink-600 */
Text: #ffffff
Font Size: 10px
Font Weight: 700 (bold)
```

### Shadow
```css
Box Shadow: 0 4px 6px rgba(239, 68, 68, 0.3)
```

### Animation
```css
Initial: scale(0)
Animate: scale(1)
Exit: scale(0)
Transition: spring (stiffness: 200)
```

### Pulse Effect
```css
Position: absolute
Top: -4px
Right: -4px
Width: 20px
Height: 20px
Background: #ef4444
Border Radius: 50%
Animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite
Opacity: 0.75
```

---

## 📋 Notification Dropdown

### Container
```
Width: 384px (96 in Tailwind)
Max Width: calc(100vw - 2rem) /* Mobile */
Max Height: 480px
Border Radius: 16px (rounded-2xl)
```

### Colors & Effects
```css
Background: rgba(255, 255, 255, 0.95) /* white/95 */
Backdrop Filter: blur(24px)
Border: 1px solid rgba(229, 231, 235, 0.5)
Shadow: 0 25px 50px -12px rgba(17, 24, 39, 0.1)
```

### Animation
```css
Initial: {
  opacity: 0,
  y: -10px,
  scale: 0.95
}
Animate: {
  opacity: 1,
  y: 0,
  scale: 1
}
Duration: 200ms
```

---

## 📌 Dropdown Header

### Layout
```
Padding: 20px (px-5 py-4)
Border Bottom: 1px solid rgba(229, 231, 235, 0.5)
Background: linear-gradient(to right, rgba(249, 250, 251, 0.5), transparent)
```

### Typography
```css
Title:
  Font Size: 18px (text-lg)
  Font Weight: 700 (bold)
  Color: #111827 (gray-900)

Subtitle:
  Font Size: 12px (text-xs)
  Font Weight: 400
  Color: #4b5563 (gray-600)
  Margin Top: 2px
```

### Mark All Read Button
```css
Font Size: 12px
Font Weight: 600
Color: #346870 (primary)
Hover Color: #5fa8b5
Transition: colors 150ms
```

---

## 💳 Notification Card

### Layout
```
Padding: 16px 20px (px-5 py-4)
Border Bottom: 1px solid rgba(243, 244, 246, 1) /* gray-100 */
```

### States

#### Default
```css
Background: transparent
Cursor: pointer
Transition: all 200ms
```

#### Hover
```css
Background: rgba(249, 250, 251, 0.5) /* gray-50/50 */
```

#### Unread
```css
Background: rgba(239, 246, 255, 0.3) /* blue-50/30 */
```

### Card Animation
```css
Initial: {
  opacity: 0,
  x: -20px
}
Animate: {
  opacity: 1,
  x: 0
}
Delay: index * 50ms (stagger)
```

---

## 🎯 Notification Icon

### Container
```
Width: 40px
Height: 40px
Border Radius: 12px (rounded-xl)
Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

### Gradient Colors by Type

#### Appointment Created (Primary)
```css
Background: linear-gradient(to bottom right, #346870, #5fa8b5)
```

#### High Priority
```css
Background: linear-gradient(to bottom right, #ef4444, #ec4899)
/* Red-500 to Pink-600 */
```

#### Cancelled
```css
Background: linear-gradient(to bottom right, #ef4444, #ec4899)
```

#### Reminder
```css
Background: linear-gradient(to bottom right, #f59e0b, #ea580c)
/* Amber-500 to Orange-600 */
```

#### Default
```css
Background: linear-gradient(to bottom right, #3b82f6, #6366f1)
/* Blue-500 to Indigo-600 */
```

### Icon
```
Size: 20px (w-5 h-5)
Color: #ffffff
Stroke Width: 2px
```

---

## 📝 Notification Content

### Title
```css
Font Size: 14px (text-sm)
Font Weight: 600 (semibold)
Color: #111827 (gray-900)
Line Height: 1.25 (tight)
```

### Message
```css
Font Size: 12px (text-xs)
Font Weight: 400
Color: #4b5563 (gray-600)
Line Height: 1.5 (relaxed)
Margin Top: 8px
```

### Timestamp
```css
Font Size: 10px (text-[10px])
Font Weight: 500 (medium)
Color: #6b7280 (gray-500)
Margin Top: 8px
```

### Unread Indicator
```css
Width: 8px
Height: 8px
Background: #3b82f6 (blue-500)
Border Radius: 50%
Margin Top: 4px
```

---

## 🏷️ Priority Badge

### Urgent Badge
```
Padding: 2px 8px (px-2 py-0.5)
Background: #fef2f2 (red-100)
Color: #991b1b (red-700)
Font Size: 9px (text-[9px])
Font Weight: 700 (bold)
Border Radius: 9999px (full)
Text Transform: uppercase
Letter Spacing: 0.05em (tracking-wide)
```

---

## 🗑️ Delete Button

### Default State
```css
Width: 28px
Height: 28px
Border Radius: 8px (rounded-lg)
Background: #f3f4f6 (gray-100)
Color: #9ca3af (gray-400)
Opacity: 0
Transition: all 200ms
```

### Hover State (Card)
```css
Opacity: 1
```

### Hover State (Button)
```css
Background: #fef2f2 (red-100)
Color: #dc2626 (red-600)
```

### Icon
```
Size: 16px (w-4 h-4)
Stroke Width: 2px
```

---

## 📱 Empty State

### Container
```
Padding: 64px 24px (py-16 px-6)
Text Align: center
```

### Icon Container
```css
Width: 64px
Height: 64px
Background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb)
/* Gray-100 to Gray-200 */
Border Radius: 16px (rounded-2xl)
Margin: 0 auto 16px
```

### Icon
```
Size: 32px (w-8 h-8)
Color: #9ca3af (gray-400)
```

### Text
```css
Primary:
  Font Size: 14px (text-sm)
  Font Weight: 500 (medium)
  Color: #4b5563 (gray-600)

Secondary:
  Font Size: 12px (text-xs)
  Font Weight: 400
  Color: #9ca3af (gray-400)
  Margin Top: 4px
```

### Animation
```css
Initial: {
  scale: 0,
  opacity: 0
}
Animate: {
  scale: 1,
  opacity: 1
}
Transition: spring (stiffness: 200)
```

---

## 🎬 Animation Timings

### Micro-interactions
```
Button Hover: 200ms ease
Button Active: 100ms ease
Badge Pop: spring (stiffness: 200)
```

### Dropdown
```
Open: 200ms ease-out
Close: 200ms ease-in
```

### Notification Cards
```
Fade In: 300ms ease-out
Stagger Delay: 50ms per item
```

### Pulse Effect
```
Duration: 1000ms
Timing: cubic-bezier(0, 0, 0.2, 1)
Iteration: infinite
```

---

## 🌈 Color System

### Primary Palette
```css
--primary-dark: #2E676F
--primary: #346870
--primary-light: #4a8a95
--primary-lighter: #5fa8b5
```

### Semantic Colors
```css
--success: #10b981 (green-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

### Neutral Palette
```css
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-900: #111827
```

---

## 📐 Spacing System

### Notification Bell
```
Gap between bell and user info: 12px (gap-3)
```

### Dropdown
```
Header Padding: 20px (px-5 py-4)
Card Padding: 16px 20px (px-5 py-4)
Footer Padding: 12px 20px (px-5 py-3)
```

### Card Internal
```
Icon to Content Gap: 12px (gap-3)
Title to Message Gap: 4px (mb-1)
Message to Timestamp Gap: 8px (mb-2)
Badge Gap: 8px (gap-2)
```

---

## 🎯 Accessibility

### ARIA Labels
```html
<button aria-label="Notifications">
<div role="dialog" aria-modal="true">
<button aria-label="Delete notification">
```

### Focus States
```css
Focus Ring: 2px solid rgba(52, 104, 112, 0.5)
Focus Ring Offset: 2px
Border Radius: inherit
```

### Keyboard Navigation
```
Tab: Navigate between elements
Enter/Space: Activate buttons
Escape: Close dropdown
```

---

## 📱 Responsive Breakpoints

### Mobile (< 1024px)
```css
Dropdown Width: calc(100vw - 2rem)
Card Padding: 12px 16px
Font Sizes: Slightly reduced
Touch Targets: Minimum 44px
```

### Desktop (≥ 1024px)
```css
Dropdown Width: 384px
Hover Effects: Enabled
Transitions: Smooth
```

---

## ✨ Premium Details

### Glass Morphism
- Backdrop blur for depth
- Subtle transparency
- Layered shadows
- Border highlights

### Micro-interactions
- Scale on hover/tap
- Smooth color transitions
- Purposeful animations
- Haptic-like feedback

### Visual Hierarchy
- Bold titles
- Muted descriptions
- Subtle timestamps
- Color-coded priorities

### Polish
- Pixel-perfect alignment
- Consistent spacing
- Smooth animations
- Thoughtful details

---

## 🎨 Design Inspiration

The notification system draws inspiration from:
- **Apple's iOS notifications** - Clean, minimal, purposeful
- **Stripe Dashboard** - Premium feel, smooth animations
- **Linear App** - Modern, fast, delightful
- **Vercel Dashboard** - Glass morphism, elegant spacing

---

## 📏 Design Checklist

- ✅ Consistent spacing (8px grid)
- ✅ Smooth animations (200-300ms)
- ✅ Accessible color contrast (WCAG AA)
- ✅ Touch-friendly targets (44px min)
- ✅ Responsive design
- ✅ Loading states
- ✅ Empty states
- ✅ Error states
- ✅ Focus indicators
- ✅ Hover effects
- ✅ Active states
- ✅ Disabled states

---

This design system ensures a **visually stunning, intuitive, and pixel-perfect** notification experience that feels modern, elegant, and premium. 🎨✨
