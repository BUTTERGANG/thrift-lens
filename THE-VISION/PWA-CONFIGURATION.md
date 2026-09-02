# PWA Configuration

## Overview

ThriftLens is a fully installable Progressive Web App optimized for iPhone Safari "Add to Home Screen". It provides an app-like experience with offline shell support, precaching, and standalone display.

---

## Web Manifest

**File:** `app/manifest.ts`

```typescript
{
  name: 'ThriftLens — Resale Price Scanner',
  short_name: 'ThriftLens',
  description: 'Snap thrift store items for instant resale value',
  start_url: '/',
  display: 'standalone',        // No browser chrome
  orientation: 'portrait',      // Portrait lock
  background_color: '#0f172a',  // Slate-900
  theme_color: '#0f172a',
  categories: ['shopping', 'utilities'],
  icons: [
    { src: '/api/pwa-icon',       sizes: '192x192', type: 'image/png' },
    { src: '/api/pwa-icon-large', sizes: '512x512', type: 'image/png' },
    { src: '/api/pwa-icon-large', sizes: '512x512', purpose: 'maskable' },
  ],
}
```

---

## Service Worker

**File:** `public/sw.js`

**Cache name:** `thriftlens-v2`

### Lifecycle Events

**Install:**
- Precaches `/` and `/manifest.json`
- Calls `skipWaiting()` to activate immediately

**Activate:**
- Claims all open clients
- Deletes old caches (any cache not named `thriftlens-v2`)

### Caching Strategies

| Request Type | Strategy | Rationale |
|-------------|----------|-----------|
| API routes (`/api/*`) | Network only | Always need fresh data |
| Static assets (`_next/static/*`, images) | Cache first, network fallback | Immutable after build |
| HTML / navigation | Network first, cache fallback | Show latest content, fall back to cached shell |

### Registration

**File:** `components/ServiceWorkerRegistrar.tsx`

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }
}, [])
```

Registered on first page load. Returns `null` (no UI).

### Service Worker Headers

**File:** `next.config.ts`

```typescript
headers: [
  { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
  { key: 'Service-Worker-Allowed', value: '/' },
]
```

The service worker file is never cached by the browser (always checks for updates), and is allowed to control the entire site scope.

---

## Icons

All icons are dynamically generated using Next.js `ImageResponse`:

| Route | Size | Purpose |
|-------|------|---------|
| `/api/pwa-icon` | 192x192 | Standard PWA icon |
| `/api/pwa-icon-large` | 512x512 | Large PWA icon + maskable |
| `/apple-icon` | 180x180 | iOS home screen icon |
| `/icon` | 32x32 | Browser favicon |

Icons render a magnifying glass emoji on a slate-900 gradient background.

---

## Apple Web App Meta

**File:** `app/layout.tsx`

```typescript
appleWebApp: {
  capable: true,                      // Enable standalone mode
  statusBarStyle: 'black-translucent', // Transparent status bar
  title: 'ThriftLens',                // Home screen title
}

viewport: {
  viewportFit: 'cover',  // Extend into safe area (notch support)
}
```

---

## Offline Behavior

| Scenario | Behavior |
|----------|----------|
| Full offline | Cached shell loads, API calls fail gracefully |
| Slow connection | Network-first for pages, cache-first for assets |
| Back online | Service worker syncs, fresh content loads |

The app is designed for use in physical stores where connectivity may be intermittent. The service worker ensures the app shell loads instantly even on slow connections.
