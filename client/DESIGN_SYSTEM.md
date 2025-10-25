# Premium UI Design System
## Dental Clinic Dashboard - Design Reference

---

## 🎨 Design Philosophy

**Core Principles:**
- **Sophisticated Minimalism** - Clean, uncluttered interfaces with purposeful elements
- **Glassmorphism & Depth** - Layered UI with backdrop blur and subtle transparency
- **Micro-interactions** - Smooth, delightful animations that feel natural
- **Premium Typography** - Clear hierarchy with refined font weights
- **Subtle Color Palette** - Less saturated, more sophisticated tones

---

## 🎯 Color Palette

### Primary Colors
```css
/* Brand Colors */
--primary-dark: #346870
--primary-mid: #4a8a95
--primary-light: #5fa8b5

/* Neutral Palette */
--slate-900: rgb(15, 23, 42)
--slate-800: rgb(30, 41, 59)
--slate-700: rgb(51, 65, 85)
--gray-900: rgb(17, 24, 39)
--gray-800: rgb(31, 41, 55)
--gray-600: rgb(75, 85, 99)
--white: #ffffff
```

### Accent Colors
```css
/* Status Colors */
--success: from-green-500 to-emerald-600
--info: from-blue-500 to-cyan-500
--warning: from-amber-400 to-orange-500
--error: from-red-500 to-pink-600

/* Feature Colors */
--purple-gradient: from-purple-500 to-pink-500
--indigo-gradient: from-indigo-600 to-purple-600
--orange-gradient: from-orange-500 to-pink-500
```

### Background Colors
```css
/* Glass Effects */
--glass-white: bg-white/80 backdrop-blur-xl
--glass-dark: bg-slate-900/80 backdrop-blur-xl
--glass-light: bg-gray-50/50 backdrop-blur-sm

/* Overlays */
--overlay-light: from-blue-50 via-indigo-50 to-purple-50
--overlay-gradient: from-slate-900 via-slate-800 to-slate-900
```

---

## 📐 Spacing System

```css
/* Consistent Spacing Scale */
--space-1: 0.25rem  /* 4px */
--space-2: 0.5rem   /* 8px */
--space-3: 0.75rem  /* 12px */
--space-4: 1rem     /* 16px */
--space-5: 1.25rem  /* 20px */
--space-6: 1.5rem   /* 24px */
--space-8: 2rem     /* 32px */
--space-10: 2.5rem  /* 40px */
--space-12: 3rem    /* 48px */

/* Component Spacing */
Container: space-y-8 (32px vertical gap)
Card Padding: p-8 (32px all sides)
Card Padding Small: p-6 or p-7 (24-28px)
Grid Gap: gap-5 or gap-6 (20-24px)
```

---

## 🔤 Typography

### Font Hierarchy
```css
/* Headings */
h1: text-4xl md:text-5xl font-bold tracking-tight (36-48px)
h2: text-2xl font-bold tracking-tight (24px)
h3: text-3xl font-bold tracking-tight (30px)

/* Body Text */
Large: text-lg md:text-xl leading-relaxed (18-20px)
Base: text-base leading-relaxed (16px)
Small: text-sm (14px)
Extra Small: text-xs (12px)

/* Font Weights */
Regular: font-normal (400)
Medium: font-medium (500)
Semibold: font-semibold (600)
Bold: font-bold (700)
```

---

## 🎴 Card Components

### Premium Glass Card
```jsx
className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
```

**Usage:** Main content cards, sections

**Features:**
- Semi-transparent white background (80% opacity)
- Backdrop blur for depth
- Subtle border with 50% opacity
- Large rounded corners (24px)
- Soft shadow

### Stat Card (Hover Effect)
```jsx
className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-200/30 transition-all duration-300"

// Hover overlay
<div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
```

**Usage:** Statistics, metrics, KPI cards

**Features:**
- Hover state with colored shadow
- Gradient overlay on hover
- Smooth transitions (300ms)

### Dark Hero Card
```jsx
className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 md:p-12 shadow-2xl"

// Background pattern
<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-30"></div>

// Ambient effects
<div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"></div>
```

**Usage:** Hero sections, welcome banners, premium features

**Features:**
- Dark gradient background
- Subtle grid pattern overlay
- Ambient blur effects
- Large padding for emphasis

---

## 🔘 Button Styles

### Primary Button
```jsx
className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
```

### Secondary Button (Light)
```jsx
className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5"
```

### Action Card Button
```jsx
className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300"

// Icon container
<div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
```

---

## 🎭 Animation Patterns

### Framer Motion Variants
```jsx
// Container stagger animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Item entrance animation
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};
```

### Hover Animations
```jsx
// Subtle lift
whileHover={{ y: -4 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}

// Scale effect
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.98 }}

// Icon scale
group-hover:scale-110 transition-transform

// Translate arrow
group-hover:translate-x-0.5 transition-transform
```

---

## 🎨 Icon Styling

### Icon Container (Gradient)
```jsx
className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25"

// Icon
<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
```

### Small Icon Container
```jsx
className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0"

<svg className="w-4 h-4 text-green-400" strokeWidth={2.5}>
```

---

## 🏷️ Badge Styles

### Status Badge
```jsx
className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/10"

// Pulse indicator
<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
```

### Small Badge
```jsx
className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full"
```

---

## 📊 Layout Patterns

### Main Container
```jsx
<motion.div 
  className="space-y-8 max-w-7xl mx-auto"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
```

### Grid Layouts
```jsx
// 3-column stats
className="grid md:grid-cols-3 gap-5"

// 4-column actions
className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"

// 2-column subscription
className="grid md:grid-cols-2 gap-8 items-center"
```

### Section Header
```jsx
<div className="flex items-center gap-3 mb-8">
  <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Section Title</h2>
</div>
```

---

## 🌈 Gradient Combinations

### Background Gradients
```css
/* Dark Premium */
bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900

/* Light Overlay */
bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50

/* Brand Gradient */
bg-gradient-to-br from-[#346870] via-[#4a8a95] to-[#5fa8b5]
```

### Button Gradients
```css
bg-gradient-to-r from-blue-600 to-indigo-600
bg-gradient-to-br from-purple-500 to-pink-500
bg-gradient-to-br from-orange-500 to-pink-500
bg-gradient-to-br from-green-500 to-emerald-600
```

### Hover Overlays
```css
bg-gradient-to-br from-purple-50/50 to-pink-50/50
bg-gradient-to-br from-blue-50/50 to-cyan-50/50
```

---

## 🎯 Shadow System

```css
/* Card Shadows */
shadow-lg shadow-gray-200/50          /* Default card */
shadow-xl shadow-purple-200/30        /* Hover state */
shadow-2xl                            /* Hero sections */

/* Button Shadows */
shadow-lg shadow-blue-500/25          /* Primary button */
shadow-xl shadow-blue-500/30          /* Button hover */
shadow-xl shadow-black/10             /* Light button */

/* Icon Shadows */
shadow-lg shadow-purple-500/25        /* Icon container */
shadow-sm                             /* Small icons */
```

---

## 🔄 Border Styles

```css
/* Glass Borders */
border border-gray-200/50             /* Light glass */
border border-white/10                /* Dark glass */
border border-blue-100/50             /* Colored glass */

/* Hover Borders */
border border-transparent hover:border-gray-200/50

/* Dividers */
border-t border-gray-100              /* Light divider */
```

---

## 📱 Responsive Patterns

```jsx
// Text sizing
className="text-4xl md:text-5xl"

// Padding
className="p-8 md:p-12"

// Grid columns
className="grid md:grid-cols-3 gap-5"
className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"

// Flex direction
className="flex flex-col md:flex-row"
```

---

## ✨ Special Effects

### Backdrop Blur
```css
backdrop-blur-xl    /* Strong blur for main cards */
backdrop-blur-sm    /* Subtle blur for overlays */
```

### Opacity Layers
```css
bg-white/80         /* 80% white */
bg-white/10         /* 10% white for dark themes */
opacity-30          /* Pattern overlays */
opacity-0 group-hover:opacity-100  /* Hover reveals */
```

### Blur Effects (Ambient)
```jsx
className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"
```

---

## 🎪 Component Examples

### Activity Timeline Item
```jsx
<motion.div
  className="group relative flex items-start gap-4 p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-200/50 hover:shadow-md transition-all duration-200"
>
  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-green-500 to-emerald-600">
    <svg className="w-5 h-5 text-white" strokeWidth={2.5}>
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-gray-900 font-medium text-sm leading-relaxed">Message</p>
    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">Date</p>
  </div>
</motion.div>
```

### Info Banner
```jsx
<motion.div 
  className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
>
  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
  <div className="relative flex items-start gap-4">
    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
      <svg className="w-6 h-6 text-white">
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-gray-900 font-semibold text-base mb-1">Title</h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">Description</p>
    </div>
  </div>
</motion.div>
```

---

## 🎬 Implementation Checklist

When redesigning a component:

- [ ] Use glassmorphism (backdrop-blur-xl, bg-white/80)
- [ ] Add proper spacing (space-y-8, p-8)
- [ ] Implement hover states with smooth transitions
- [ ] Use rounded-3xl or rounded-2xl for cards
- [ ] Add subtle shadows (shadow-lg shadow-gray-200/50)
- [ ] Include micro-animations (hover:y-4, group-hover:scale-110)
- [ ] Use gradient accents sparingly
- [ ] Ensure proper typography hierarchy
- [ ] Add ambient blur effects for depth
- [ ] Test responsive breakpoints (md:, lg:)
- [ ] Implement proper color contrast
- [ ] Add loading/empty states

---

## 🚀 Quick Reference

**Card Template:**
```jsx
<div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8">
  <div className="flex items-center gap-3 mb-8">
    <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Title</h2>
  </div>
  {/* Content */}
</div>
```

**Button Template:**
```jsx
<button className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
  Action
  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
</button>
```

---

## 🪟 Modal Components

### Premium Booking Modal (Large & Responsive)
```jsx
// Modal wrapper with custom sizing
<Modal isOpen={isOpen} onClose={handleClose} size="booking">
  {/* size="booking" creates:
      - Mobile: w-full h-full (fullscreen)
      - Desktop: w-[75vw] h-[80vh]
  */}
</Modal>

// Modal sizes available:
size="sm"      // max-w-md max-h-[60vh]
size="md"      // max-w-lg max-h-[70vh]
size="lg"      // max-w-2xl max-h-[75vh]
size="xl"      // max-w-4xl max-h-[80vh]
size="booking" // Mobile: w-full h-full | Desktop: w-[75vw] h-[80vh]
```

**Features:**
- Glassmorphism background overlay (slate-900/60 with backdrop-blur)
- Premium white modal with backdrop-blur-xl
- Responsive corners: rounded-none (mobile) → rounded-3xl (desktop)
- Enhanced close button with hover effects
- Full-height scrollable content area
- Responsive padding: p-4 (mobile) → p-8 (desktop)
- Fullscreen on mobile for optimal space usage

### Premium Modal Header with Icon & Ambient Glow
```jsx
<div className="relative">
  {/* Ambient background effects */}
  <div className="absolute -top-8 -left-8 w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br from-[#5fa8b5]/15 to-[#346870]/15 rounded-full blur-3xl animate-pulse"></div>
  <div className="absolute -top-4 -right-8 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
  
  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
    <div className="flex items-start gap-3">
      {/* Gradient accent bar with glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5fa8b5] to-[#346870] rounded-full blur-md opacity-50"></div>
        <div className="relative w-1.5 h-10 md:h-12 bg-gradient-to-b from-[#5fa8b5] to-[#346870] rounded-full shadow-lg"></div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-2xl flex items-center justify-center shadow-lg shadow-[#346870]/30">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2}>
              {/* Icon path */}
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Title</h2>
        </div>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">Description</p>
      </div>
    </div>
    
    {/* Optional info badge */}
    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#346870]/10 via-[#4a8a95]/10 to-[#5fa8b5]/10 backdrop-blur-xl border border-[#346870]/30 text-[#346870] text-xs md:text-sm font-semibold rounded-2xl shadow-lg shadow-[#346870]/10 ml-auto md:ml-0 w-fit hover:shadow-xl transition-all duration-300">
      Badge Content
    </div>
  </div>
</div>
```

**Features:**
- Multiple ambient blur effects with animation
- Icon container with gradient and shadow
- Glowing accent bar
- Responsive sizing and spacing
- Premium badge with hover effects

### Premium Progress Stepper (Enhanced)
```jsx
<div className="relative bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-xl shadow-gray-200/50">
  {/* Subtle background pattern */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-2xl md:rounded-3xl opacity-50"></div>
  
  <div className="relative flex items-center justify-between">
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-center flex-1">
        <div className="flex items-center gap-2 md:gap-3 w-full">
          {/* Step circle with glow effect */}
          <div className="relative group">
            {currentStep >= step.id && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            )}
            <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-500 flex-shrink-0 ${
              currentStep >= step.id
                ? "bg-gradient-to-br from-[#346870] to-[#5fa8b5] text-white shadow-xl shadow-[#346870]/30 scale-110"
                : "bg-white/80 text-gray-400 border-2 border-gray-200 shadow-sm"
            }`}>
              {currentStep > step.id ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
          </div>
          
          {/* Step labels */}
          <div className="min-w-0 hidden sm:block flex-1">
            <div className={`text-xs md:text-sm font-bold truncate transition-colors duration-300 ${
              currentStep >= step.id ? "text-gray-900" : "text-gray-500"
            }`}>
              {step.title}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 truncate leading-relaxed">
              {step.description}
            </div>
          </div>
        </div>
        
        {/* Animated connector line */}
        {index < steps.length - 1 && (
          <div className="flex-shrink-0 w-6 md:w-12 mx-2 md:mx-3">
            <div className="relative h-1 rounded-full overflow-hidden bg-gray-200">
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                currentStep > step.id 
                  ? "bg-gradient-to-r from-[#346870] via-[#4a8a95] to-[#5fa8b5] shadow-lg" 
                  : "w-0"
              }`} />
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
```

**Features:**
- Glassmorphism with layered backgrounds
- Glow effects on active steps
- Animated progress connectors
- Scale animations on active steps
- Enhanced typography hierarchy
- Smooth transitions (500ms)

### Premium Form Section Card
```jsx
<div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
  
  <div className="relative flex items-center gap-3 mb-5">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
      <svg className="w-5 h-5 text-white" strokeWidth={2}>
        {/* Icon */}
      </svg>
    </div>
    <div>
      <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Section Title</h3>
      <p className="text-xs text-gray-600">Section description</p>
    </div>
  </div>

  <div className="relative">
    {/* Content */}
  </div>
</div>
```

### Premium Input Field
```jsx
<div className="group">
  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
    <span>Field Label</span>
    <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#346870] transition-colors">
      <svg strokeWidth={2}>
        {/* Icon */}
      </svg>
    </div>
    <input
      className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#346870] focus:ring-2 focus:ring-[#346870]/20 hover:border-gray-300"
      placeholder="Placeholder text"
    />
  </div>
</div>
```

### Premium Button Styles (Booking Flow)
```jsx
// Primary Action Button
<button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#346870] via-[#4a8a95] to-[#5fa8b5] text-white text-sm font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#346870]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 shadow-xl">
  <span>Continue</span>
  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5}>
    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
</button>

// Secondary/Back Button
<button className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:border-gray-300 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5}>
    <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
  <span>Back</span>
</button>

// Confirm Button (Success variant)
<button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-600 to-green-600 text-white text-sm font-bold rounded-2xl hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
  <svg className="w-6 h-6" strokeWidth={2.5}>
    <path d="M5 13l4 4L19 7" />
  </svg>
  <span>Confirm</span>
  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5}>
    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
</button>
```

### Premium Info/Alert Banners
```jsx
// Success Banner
<div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border border-green-200/60 rounded-2xl p-5 shadow-lg">
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
  <div className="relative flex items-center gap-4">
    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
      <svg className="w-7 h-7 text-white" strokeWidth={2.5}>
        <path d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Label</p>
      <p className="text-lg md:text-xl font-bold text-gray-900">Content</p>
    </div>
  </div>
</div>

// Warning Banner
<div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/60 rounded-2xl p-5 shadow-md">
  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-300/20 to-yellow-300/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
  <div className="relative flex items-start gap-4">
    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
      <svg className="w-6 h-6 text-white" strokeWidth={2}>
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-amber-900 mb-3 text-sm md:text-base">Title</h4>
      <p className="text-xs md:text-sm text-amber-800 leading-relaxed">Content</p>
    </div>
  </div>
</div>

// Error Banner
<div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-50 border border-red-200/60 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-xl shadow-red-200/30">
  <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-red-300/20 to-pink-300/20 rounded-full blur-3xl -mr-16 md:-mr-20 -mt-16 md:-mt-20"></div>
  <div className="relative flex items-start gap-3 md:gap-4">
    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30">
      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5}>
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-red-900 font-bold text-sm md:text-base mb-1">Title</h4>
      <p className="text-red-800 font-medium text-xs md:text-sm leading-relaxed">Message</p>
    </div>
  </div>
</div>
```

---

**Last Updated:** October 2025  
**Version:** 1.1  
**Design System:** Premium Glassmorphism
