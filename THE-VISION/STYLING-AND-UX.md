# Styling and UX

## Design System

### Framework
- **Tailwind CSS v4** via PostCSS
- **No component library** — all custom components
- **Utility-first** approach with minimal custom CSS

### Color Palette

| Role | Color | Hex | Tailwind |
|------|-------|-----|----------|
| Background | Dark slate | `#0f172a` | `slate-900` |
| Card bg | Slightly lighter | — | `slate-800` |
| Primary text | White | `#ffffff` | `white` |
| Secondary text | Muted | — | `slate-300` / `slate-400` |
| Accent | Amber/gold | `#f59e0b` | `amber-500` |
| HOT deal | Red | `#ef4444` | `red-500` |
| GOOD deal | Green | `#34d399` | `emerald-400` |
| PASS deal | Gray | — | `slate-400` |
| Error | Red | — | `red-500` |

### Typography
- **Font:** Geist Sans (Google Fonts, loaded in layout.tsx)
- **No custom font sizes** — uses Tailwind defaults (text-sm, text-lg, text-2xl, etc.)

---

## Dark-Only Theme

ThriftLens is dark-mode only. No light theme toggle. This is intentional:
- Reduces screen glare in brightly lit stores
- Saves battery on OLED screens (common on phones)
- Creates a premium, focused aesthetic

---

## Mobile-First Design

All layouts are designed for one-handed phone use:

- **Large touch targets**: Buttons are full-width with generous padding
- **Bottom navigation**: Thumb-reachable Scan/History tabs
- **Safe area padding**: `viewportFit: cover` with `env(safe-area-inset-*)` for notch support
- **Portrait orientation**: Manifest locks to portrait
- **No horizontal scrolling**: All content fits viewport width

---

## Custom Animations

**File:** `app/globals.css`

### Shimmer (Skeleton Loader)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animate-shimmer {
  background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```
Used in: Scanner processing state, History skeleton loaders

### HOT Deal Pulse
```css
@keyframes hotPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
  50% { box-shadow: 0 0 20px rgba(239,68,68,0.7); }
}
```
Used in: DealScore component for HOT badges

### Progress Sweep
```css
@keyframes progressSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```
Used in: Scanner processing bar (amber sweep animation)

---

## Component Styling Patterns

### Cards
```
bg-gradient-to-b from-slate-800 to-slate-800/70
border border-slate-700/40
rounded-2xl
p-4 or p-5
```

### Buttons (Primary)
```
bg-gradient-to-r from-amber-500 to-amber-600
text-slate-900 font-semibold
rounded-xl
shadow-lg shadow-amber-500/25
```

### Buttons (Secondary)
```
bg-slate-800 border border-slate-700
text-slate-300
rounded-xl
```

### Inputs
```
bg-slate-800/50 border border-slate-700
text-white placeholder-slate-500
rounded-lg
focus:ring-2 focus:ring-amber-500/50
```

### Frosted Glass Effect
```
bg-slate-800/80 backdrop-blur-sm
border border-slate-700/50
```

---

## Responsive Considerations

The app targets phone screens exclusively:
- **Max width**: Content fills viewport (no max-width container)
- **Padding**: `px-4` standard horizontal padding
- **Grid**: Single column layouts throughout
- **Images**: Object-cover with rounded corners
- **Text truncation**: `truncate` class on long item names, usernames

---

## Loading States

### Scanner Processing
- Amber sweep progress bar at top
- 3-step indicator with numbered circles
- Completed steps show green checkmarks
- Shimmer skeleton placeholders for content areas
- "Typically 15-25 seconds" helper text

### History Page
- Skeleton cards with shimmer animation
- 5 skeleton items shown during initial load

### Buttons
- Text changes to "Scanning..." / "Signing in..." / "Creating..."
- Disabled state prevents double-submission

---

## Error States

### Scanner Errors
- Red background card with warning icon
- Specific messages: "HEIC not supported", "Image too large", "Rate limit exceeded"

### History Errors
- Red text with retry button
- "Something went wrong" generic message

### Login Errors
- Red background bar below form
- Server action error messages displayed inline

---

## Empty States

### History (No Scans)
- Inbox icon
- "No scans yet" heading
- "Start Scanning" CTA button linking to home
