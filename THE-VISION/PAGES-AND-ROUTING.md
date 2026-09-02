# Pages and Routing

## Route Map

| Path | File | Type | Auth Required | Description |
|------|------|------|---------------|-------------|
| `/` | `app/page.tsx` | Server | Yes | Home — scanner, features, store check-in |
| `/login` | `app/login/page.tsx` | Client | No | Login/signup form |
| `/history` | `app/history/page.tsx` | Client | Yes | Paginated scan history with filters |
| `/results/[id]` | `app/results/[id]/page.tsx` | Server | Yes (ownership) | Full scan results |
| `/results/preview` | `app/results/preview/page.tsx` | Client | No | Temporary preview from sessionStorage |

## Navigation Flow

```
                    ┌──────────────┐
                    │  /login      │
                    │  (public)    │
                    └──────┬───────┘
                           │ auth success
                           ▼
                    ┌──────────────┐
              ┌────►│  / (home)    │◄────┐
              │     │  Scanner UI  │     │
              │     └──────┬───────┘     │
              │            │ scan        │
              │            ▼             │
              │     ┌──────────────┐     │
              │     │ /results/[id]│     │
              │     │ or /preview  │     │
              │     └──────────────┘     │
              │                          │
              │     ┌──────────────┐     │
              └─────│  /history    │─────┘
                    │  Scan list   │
                    └──────────────┘
```

**Bottom navigation** appears on Home, History, and Results pages with two tabs: **Scan** (home) and **History**.

## Route Protection (Middleware)

**File:** `proxy.ts`

The middleware runs before every request and splits routes into public and protected:

### Public Routes (no auth needed)
- `/login` — authentication page
- `/api/ebay/account-deletion` — eBay GDPR endpoint
- `/api/migrate` — database initialization
- `/sw.js` — service worker
- `/_next/*` — Next.js internal assets
- `/manifest.json` — PWA manifest
- `/icons/*` — icon assets
- Static files: `*.ico`, `*.png`, `*.svg`, `*.webmanifest`

### Protected Routes (JWT required)
Everything else. If the JWT is missing or invalid:
1. Session cookie is cleared
2. User is redirected to `/login`

## Page Details

### Home (`/`)

**Server component** that:
1. Calls `getSession()` to get the current user
2. Renders feature pills (Vision AI, Live Comps, Profit Calc, Selling Tips)
3. Renders `<StoreCheckIn />` for geolocation
4. Renders `<Scanner />` (the main camera/upload UI)
5. Renders `<UserMenu />` if session exists
6. Shows bottom nav (Scan / History)

### Login (`/login`)

**Client component** with:
- Toggle between login and signup modes
- `useActionState` hooks for both login and signup server actions
- Form validation (username: 3-30 chars alphanumeric; password: 8+ chars)
- Error display from server action responses
- Loading state during submission
- Hydration-safe rendering (mounted state check)

### History (`/history`)

**Client component** that:
1. Fetches `GET /api/history?limit=20&offset=0` on mount
2. Displays skeleton loaders during fetch
3. Shows filterable list (deal score: ALL/HOT/GOOD/PASS; recency: all/30d/7d)
4. Client-side filtering (no additional API calls)
5. "Load More" pagination
6. Empty state with CTA to start scanning
7. Each item links to `/results/[id]`

### Results (`/results/[id]`)

**Server component** that:
1. Requires valid session
2. Queries database for scan where `id` matches AND `user_id` matches session
3. Returns 404 if scan not found or not owned by user
4. Renders `<ResultCard />` with full analysis
5. Renders `<FeedbackTap />` if user hasn't submitted feedback yet
6. Shows "New Scan" back link and bottom nav

### Preview (`/results/preview`)

**Client component** for displaying scan results before they're saved to the database:
1. Reads `sessionStorage.thriftlens_preview` on mount
2. Parses JSON into `ScanResponse`
3. Renders `<ResultCard />` (same as results page)
4. Used as fallback when DB save fails but scan succeeded
