# Logo Loader Update

## Overview
The admin panel loader has been upgraded with a beautiful logo-centered design featuring circular wave animations with the primary color gradient.

## Changes Made

### 1. New Loader Variant: `LOGO_WAVE`
- Added a new spinner variant that displays the clinic logo in the center
- Circular wave animations radiate outward with primary color gradient (#346870)
- Smooth, professional animation that matches the brand identity

### 2. Updated Components

#### LoadingSpinner.jsx
- Added `SPINNER_VARIANTS.LOGO_WAVE` variant
- Features 4 animated circular waves with gradient effects
- Logo centered with shadow and glow effect
- Waves use the primary color with varying opacity
- Custom animation timing for smooth, continuous effect

#### tailwind.config.js
- Added custom `wave-pulse` animation keyframe
- Smooth cubic-bezier easing for professional look
- 2.5s animation duration with staggered delays

#### App.jsx
- Updated main application loader to use the new logo wave variant
- Provides consistent branding during initial load

### 3. Usage

#### Default Page Loader (Recommended)
```jsx
import { PageSpinner } from '../shared/components';

// Automatically uses logo wave variant
<PageSpinner message="Loading..." />
```

#### Custom Implementation
```jsx
import LoadingSpinner, { SPINNER_VARIANTS } from '../shared/components/LoadingSpinner';

// Using variant constant
<LoadingSpinner 
  variant={SPINNER_VARIANTS.LOGO_WAVE}
  message="Loading..."
/>

// Using string (also supported)
<LoadingSpinner 
  variant="logo-wave"
  message="Loading..."
/>
```

#### Other Variants Still Available
```jsx
// For inline/small loaders, use existing variants
<LoadingSpinner variant={SPINNER_VARIANTS.CIRCLE} size="sm" />
<LoadingSpinner variant={SPINNER_VARIANTS.DOTS} size="xs" />
```

## Design Details

### Colors
- Primary: `#346870` (from tailwind config)
- Wave opacity: Decreases from 0.5 to 0.2 across 4 waves
- Gradient: Radial gradient from transparent to primary color

### Animation
- 4 circular waves with staggered timing
- Each wave: 2.5s duration
- Delay between waves: 0.3s
- Logo pulse: 2s duration
- Smooth cubic-bezier easing

### Dimensions
- Container: 240px × 240px
- Logo circle: 96px (w-24)
- Logo image: 80px (w-20)
- Waves: 60px to 165px (increasing by 35px)

## Benefits

1. **Brand Consistency**: Uses the actual clinic logo
2. **Professional Look**: Smooth, elegant animations
3. **Better UX**: Clear visual feedback during loading
4. **Accessibility**: Maintains proper ARIA labels
5. **Performance**: CSS-based animations (GPU accelerated)

## Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers
- Respects `prefers-reduced-motion` settings (via Tailwind)
