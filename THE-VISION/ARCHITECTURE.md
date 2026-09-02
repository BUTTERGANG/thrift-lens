# Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/PWA)                   │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐ │
│  │ Scanner  │  │ Results  │  │ History │  │   Login    │ │
│  │Component │  │  Page    │  │  Page   │  │   Page     │ │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  └─────┬─────┘ │
│       │              │             │              │       │
│  Service Worker (offline shell, cache-first assets)      │
└───────┼──────────────┼─────────────┼──────────────┼──────┘
        │              │             │              │
        ▼              ▼             ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  MIDDLEWARE (proxy.ts)                    │
│           JWT verification → route protection             │
└───────┬──────────────┬─────────────┬──────────────┬──────┘
        │              │             │              │
        ▼              ▼             ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                    │
│                                                           │
│  POST /api/scan          GET /api/history                │
│  PATCH /api/scan/[id]/   POST /api/migrate               │
│        feedback           GET/POST /api/ebay/             │
│                                  account-deletion         │
└───────┬──────────────────────────┬───────────────────────┘
        │                          │
        ▼                          ▼
┌───────────────┐    ┌─────────────────────┐
│  Claude API   │    │   eBay Browse API   │
│  (Anthropic)  │    │   (OAuth client     │
│               │    │    credentials)      │
│  1. Vision ID │    │                     │
│  2. Text      │    │  Active listings    │
│     Analysis  │    │  search + pricing   │
└───────┬───────┘    └──────────┬──────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL (NeonDB)                       │
│                                                           │
│  ┌────────┐  ┌────────┐  ┌────────────┐  ┌───────────┐ │
│  │ users  │  │ scans  │  │comps_cache │  │rate_limits│ │
│  └────────┘  └────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Design Decisions

### Two-Call AI Strategy

The scan pipeline makes **two separate Claude API calls** rather than one:

1. **Vision call** — sends the image to Claude with a structured identification prompt. Returns item name, brand, model, category, condition, era, and an eBay search query.
2. **Text-only call** — sends the identification result + eBay comp data (no image) for market analysis. Returns pricing, deal score, selling tips.

**Why two calls?**
- The vision call is the expensive one (image tokens). By splitting, the analysis call uses text-only pricing.
- Analysis quality improves when Claude can see actual eBay comp data alongside the identification.
- Enables caching: if two users scan the same Nike Air Max, the comps are cached and only the analysis is re-run.

### Comps Cache (24-Hour TTL)

eBay comp results are cached in the `comps_cache` table using a SHA-256 hash of the normalized search query. This:
- Reduces eBay API calls (rate-limited)
- Speeds up repeat scans of similar items
- Expires after 24 hours to keep data fresh

### No Image Storage

Images are sent as base64 in the API request, processed by Claude, then discarded. The database stores only the structured analysis results. This is a deliberate privacy choice — no user photos are retained.

### JWT Sessions (Not Database Sessions)

Sessions are stateless JWTs stored in HttpOnly cookies. No session table lookups on every request. The `sessions` table exists as a legacy artifact but is not used by the current auth system.

### Middleware-Based Route Protection

The `proxy.ts` middleware verifies JWT tokens before any protected route handler runs. This ensures:
- Consistent auth enforcement across all routes
- No forgotten auth checks in individual handlers
- Clean separation of auth logic from business logic

### Server Actions for Auth

Login, signup, and logout use Next.js Server Actions rather than API routes. This enables:
- Progressive enhancement (forms work without JS)
- Automatic FormData parsing
- Built-in pending state via `useActionState`
- Server-side redirects after success

### Client-Side History Filtering

History data is fetched from the API, then filtered client-side (by deal score and recency). This avoids extra API calls for filter changes and keeps the interaction instant.
