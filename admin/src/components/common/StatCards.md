# Stat Card Components

Reusable stat card components for displaying statistics across the admin panel.

## Components

### StatCard (Recommended)
Full-featured stat card with responsive design. Automatically adjusts for mobile:
- **Desktop**: Large premium glass card with full padding and large text
- **Mobile**: Compact version with reduced padding and smaller text
- **4 cards**: Displays 1 per row on mobile, 2 on tablet, 4 on desktop
- **3 cards**: Displays 1 per row on mobile, 2 on tablet, 3 on desktop

**Props:**
- `value` (string|number) - The main value to display
- `label` (string) - The label/description for the stat
- `icon` (Component) - Heroicon component to display
- `iconColor` (string) - Gradient color classes for icon (e.g., "from-blue-500 to-cyan-500")
- `hoverColor` (string) - Hover shadow color (e.g., "blue-200")
- `bgGradient` (string) - Background gradient on hover (e.g., "from-blue-50/50 to-cyan-50/50")
- `badge` (string, optional) - Badge text
- `badgeColor` (string) - Badge color classes (e.g., "bg-blue-100 text-blue-700")
- `change` (number, optional) - Percentage change value
- `variants` (object, optional) - Framer-motion variants

**Usage:**
```jsx
// For 4 cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
  <StatCard
    value={1234}
    label="Total Users"
    icon={UsersIcon}
    iconColor="from-blue-500 to-cyan-500"
    hoverColor="blue-200"
    bgGradient="from-blue-50/50 to-cyan-50/50"
    badge="All"
    badgeColor="bg-blue-100 text-blue-700"
    change={12.5}
    variants={itemVariants}
  />
  {/* 3 more cards... */}
</div>

// For 3 cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
  <StatCard
    value={42}
    label="Templates"
    icon={CogIcon}
    iconColor="from-indigo-500 to-purple-600"
    hoverColor="purple-200"
    bgGradient="from-indigo-50/50 to-purple-50/50"
    badge="Active"
    badgeColor="bg-indigo-100 text-indigo-700"
    variants={itemVariants}
  />
  {/* 2 more cards... */}
</div>
```

### CompactStatCardRow
Compact stat card with row layout similar to notifications page. Use for alternative layouts.

### MobileStatCard
Mobile-optimized stat card for horizontal scrolling layouts (legacy).

### CompactStatCard
Compact stat card for smaller displays with responsive sizing (legacy).

## Color Schemes

Common color combinations:

- **Blue/Cyan**: `iconColor="from-blue-500 to-cyan-500"`, `hoverColor="blue-200"`, `bgGradient="from-blue-50/50 to-cyan-50/50"`
- **Green/Emerald**: `iconColor="from-green-500 to-emerald-500"`, `hoverColor="green-200"`, `bgGradient="from-green-50/50 to-emerald-50/50"`
- **Purple/Pink**: `iconColor="from-purple-500 to-pink-500"`, `hoverColor="purple-200"`, `bgGradient="from-purple-50/50 to-pink-50/50"`
- **Amber/Orange**: `iconColor="from-amber-500 to-orange-500"`, `hoverColor="amber-200"`, `bgGradient="from-amber-50/50 to-orange-50/50"`
- **Indigo/Purple**: `iconColor="from-indigo-500 to-purple-600"`, `hoverColor="purple-200"`, `bgGradient="from-indigo-50/50 to-purple-50/50"`
- **Cyan/Blue**: `iconColor="from-cyan-500 to-blue-500"`, `hoverColor="cyan-200"`, `bgGradient="from-cyan-50/50 to-blue-50/50"`

## Pages Using Stat Cards

- **AdminDashboard.jsx** - Uses `StatCard` with 4 cards (1/2/4 columns responsive)
- **UserManagement.jsx** - Uses `StatCard` with 4 cards (1/2/4 columns responsive)
- **AppointmentManagement.jsx** - Uses `StatCard` with 4 cards (1/2/4 columns responsive)
- **AvailabilityManagement.jsx** - Uses `StatCard` with 3 cards (1/2/3 columns responsive)

## Layout Guidelines

**For 4 cards:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
  {/* 4 StatCard components */}
</div>
```

**For 3 cards:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
  {/* 3 StatCard components */}
</div>
```

**For 2 cards:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
  {/* 2 StatCard components */}
</div>
```

## Responsive Behavior

The StatCard component automatically adjusts:
- **Mobile (< 768px)**: Compact padding (p-4), smaller icons (w-10 h-10), smaller text (text-3xl)
- **Desktop (≥ 768px)**: Full padding (p-7), larger icons (w-12 h-12), larger text (text-5xl)
