# ThriftLens — Documentation

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [Profit & Loss Engine](#5-profit--loss-engine)
6. [MVP Plan](#6-mvp-plan)
7. [Environment Setup](#7-environment-setup)
8. [Deployment (Replit)](#8-deployment-replit)

---

## 1. Product Overview

ThriftLens is a mobile-first PWA that lets resellers photograph thrift store items and get an instant analysis:

- **Item identification** — brand, model, condition, era, category
- **Market value range** — low / high sell price in current market
- **Profit estimate** — net profit after platform fees and shipping
- **Deal score** — HOT / GOOD / PASS verdict in under 20 seconds
- **Selling tips** — best platforms, listing keywords, authenticity warnings
- **eBay comps** — live active listings for price reference
- **Scan history** — all past scans stored per session

**UI/UX highlights (current):**
- **How it works onboarding** — 3-step explainer + privacy note (no account, no image storage)
- **Scan flow polish** — clear camera vs library actions, image preview, retake/choose different
- **Processing stepper** — Identify → Comps → Analysis with ETA hint
- **Results clarity** — active listings explained + confidence meaning
- **History UX** — filters (client-side) + “scan again” CTA

**Target user:** Thrift flippers sourcing items in-store or online (Facebook Marketplace, garage sales).

**Platform:** Web app (PWA). Works in iPhone Safari. Add to Home Screen for native-like experience.

---

## 2. Architecture

### High-Level Flow

```
User (iPhone Safari)
  │
  │  Photo upload (FormData)
  ▼
POST /api/scan
  │
  ├─ 1. Claude Sonnet 4.6 (Vision)
  │       Image → IdentificationResult
  │       { item_name, brand, condition, ebay_search_query, ... }
  │
  ├─ 2. comps_cache lookup (NeonDB)
  │       SHA-256(search_query) → cache hit or miss
  │
  ├─ 3. eBay Browse API (on cache miss)
  │       Active listings → EbayComp[]
  │       Cached for 24 hours
  │
  ├─ 4. Claude Sonnet 4.6 (Text only — no image re-sent, cheaper)
  │       Identification + Comps → AnalysisResult
  │       { deal_score, market_value, profit_estimate, tips, ... }
  │
  ├─ 5. NeonDB INSERT
  │       Persists full scan record
  │
  └─ 6. Response → /results/[scan_id]
```

### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | API routes + server components in one project, easy Replit deploy |
| AI — Vision | Claude Sonnet 4.6 | Best-in-class image understanding for item identification |
| AI — Analysis | Claude Sonnet 4.6 (text) | Same model, text-only call = ~10x cheaper than vision |
| Database | NeonDB (PostgreSQL) | Serverless Postgres, HTTP transport works reliably on Replit |
| Market Data | eBay Browse API | Official API, 5,000 free calls/day, OAuth client credentials |
| Styling | Tailwind CSS v4 | Utility-first, dark mobile UI |
| PWA | Native SW + manifest | Installable on iPhone, service worker for offline |
| Auth | None (beta) | UUID session in localStorage |

### Directory Structure

```
thrift-lens/
├── app/
│   ├── layout.tsx              # Root layout: fonts, PWA meta, service worker
│   ├── page.tsx                # Home: camera UI + bottom nav
│   ├── manifest.ts             # PWA manifest (App Router native)
│   ├── history/
│   │   └── page.tsx            # Scan history (client component)
│   ├── results/
│   │   └── [id]/
│   │       └── page.tsx        # Results display (server component)
│   └── api/
│       ├── scan/route.ts       # POST — main analysis pipeline
│       ├── ebay/route.ts       # GET  — eBay comps debug endpoint
│       ├── history/route.ts    # GET  — paginated scan history
│       └── migrate/route.ts    # POST — DB schema initialization
│
├── components/
│   ├── Scanner.tsx             # Camera/upload flow + loading states
│   ├── ResultCard.tsx          # Full results layout (composite)
│   ├── DealScore.tsx           # HOT/GOOD/PASS badge
│   ├── PriceRange.tsx          # Market value + profit display
│   ├── CompsList.tsx           # eBay listings table
│   ├── TipsList.tsx            # Platforms, tips, keywords, warnings
│   └── ServiceWorkerRegistrar.tsx
│
├── lib/
│   ├── claude.ts               # Anthropic client, both prompts, JSON parser
│   ├── ebay.ts                 # eBay OAuth token cache + Browse API client
│   ├── db.ts                   # NeonDB client + runMigrations()
│   └── session.ts              # localStorage UUID session helper
│
├── types/
│   └── index.ts                # IdentificationResult, AnalysisResult, EbayComp, ScanRecord, ScanResponse
│
└── public/
    ├── sw.js                   # Service worker
    └── icons/                  # 192x192, 512x512, apple-touch-icon (180x180)
```

### Two-Call Claude Strategy

Claude is called twice per scan to keep costs down:

| Call | Input | Output | Cost driver |
|------|-------|--------|------------|
| **Step 1** — Identification | Image (base64) + prompt | IdentificationResult JSON | Image tokens (expensive) |
| **Step 2** — Analysis | Text only (identification + comps) | AnalysisResult JSON | Text tokens (~10× cheaper) |

The image is never sent twice. Step 2 uses the structured output of Step 1 as context.

### eBay Data Limitation

> **Important:** eBay's Finding API (sold/completed listings) was decommissioned on February 5, 2025. The Marketplace Insights API (Terapeak sold data) is restricted to approved partners only.

The app currently uses the **Browse API (active listings)** as a market signal proxy. Claude compensates by applying its training knowledge of historical sold prices when interpreting active listing prices.

**Recommended approach (roadmap):**
1) Keep the **official eBay path** (Browse now; Marketplace Insights approval in progress).
2) Add a **sold‑data fallback provider** if approval stalls (hosted/paid data source).
3) Avoid relying on GitHub scrapers for production due to fragility and TOS risk—use only for prototyping.

**Implementation idea:** add a small “comps provider” abstraction with env‑based switching (e.g., `EBAY_BROWSE` vs `SOLD_DATA_PROVIDER`) and store the source per scan for transparency.

---

## 3. Database Schema

All prices are stored as **integer cents** (e.g. $25.00 = `2500`) to avoid floating point issues.

```sql
-- Session tracking (no auth in beta — UUID from localStorage)
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Main scan records
CREATE TABLE scans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL,
  image_url           TEXT,                    -- NULL in beta (no image persistence)
  item_identified     TEXT NOT NULL,           -- e.g. "Vintage Levi's 501 Jeans"
  brand               TEXT,
  condition           TEXT,
  deal_score          TEXT NOT NULL CHECK (deal_score IN ('HOT','GOOD','PASS')),
  market_value_low    INTEGER,                 -- cents
  market_value_high   INTEGER,                 -- cents
  profit_estimate     INTEGER,                 -- cents (midpoint of low/high)
  identification_json JSONB,                   -- full IdentificationResult from Claude
  analysis_json       JSONB NOT NULL,          -- full AnalysisResult from Claude
  ebay_comps_json     JSONB,                   -- raw EbayComp[] array
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX scans_session_id_idx ON scans (session_id, created_at DESC);

-- 24-hour eBay comps cache (avoids re-fetching same item)
CREATE TABLE comps_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash  TEXT NOT NULL UNIQUE,            -- SHA-256 of normalized search query
  comps_json  JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX comps_cache_hash_idx ON comps_cache (query_hash);

-- Rate limit tracking (fixed windows)
CREATE TABLE rate_limits (
  rate_key     TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Initialize schema:**
```bash
curl -X POST https://your-app.replit.app/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"your_migrate_secret"}'
```

---

## 4. API Reference

### `POST /api/scan`

Main analysis pipeline. Accepts a photo, returns full deal analysis.

**Request:** `multipart/form-data`
| Field | Type | Required |
|-------|------|----------|
| `image` | File (JPEG/PNG/WEBP/HEIC) | Yes |
| `session_id` | UUID string | Yes |

**Response:** `200 OK`
```json
{
  "scan_id": "uuid",
  "item_identified": "Vintage Levi's 501 Jeans",
  "brand": "Levi's",
  "deal_score": "HOT",
  "identification": { ... },
  "analysis": { ... },
  "comps": [ ... ]
}
```

**Errors:**
- `400` — Missing image or session_id
- `500` — Claude API failure or unexpected error

---

### `GET /api/ebay?q={query}`

Fetch eBay active listings directly. Useful for debugging.

**Example:** `GET /api/ebay?q=levis+501+jeans+vintage`

**Response:**
```json
{
  "comps": [
    {
      "title": "Levi's 501 Jeans 32x30 Vintage USA Made",
      "price": "45.00",
      "currency": "USD",
      "condition": "Pre-Owned",
      "listing_url": "https://www.ebay.com/itm/...",
      "image_url": "https://i.ebayimg.com/...",
      "end_date": null,
      "marketplace": "ebay"
    }
  ],
  "total": 10,
  "source": "ebay_browse"
}
```

---

### `GET /api/history?session_id={uuid}&limit=20&offset=0`

Returns paginated scan history for a session.

**Parameters:**
| Param | Default | Max |
|-------|---------|-----|
| `session_id` | required | — |
| `limit` | 20 | 50 |
| `offset` | 0 | — |

**Response:**
```json
{
  "scans": [
    {
      "id": "uuid",
      "item_identified": "Nike Air Max 90",
      "brand": "Nike",
      "deal_score": "GOOD",
      "market_value_low": 4500,
      "market_value_high": 8000,
      "created_at": "2025-03-19T12:00:00Z"
    }
  ]
}
```

---

### `POST /api/migrate`

Initializes database schema. Run once on first deploy.

**Request:**
```json
{ "secret": "your_migrate_secret" }
```

**Response:** `{ "ok": true, "message": "Migrations complete" }`

---

## 5. Profit & Loss Engine

### Overview

Every scan produces a complete P&L estimate. All values are calculated by Claude's analysis step using the identified item + eBay active listings as inputs.

### Fee Model

The analysis prompt instructs Claude to use this fee model:

| Fee | Amount | Notes |
|-----|--------|-------|
| eBay final value fee | ~13.25% of sale price | Standard seller rate (non-store) |
| Payment processing | ~0.30% | Included in eBay's combined rate |
| Estimated shipping | $5 flat | Conservative estimate; heavy items higher |
| Buy price deducted | Not yet — user inputs separately | Planned for v2 |

**Net profit formula (per scan):**
```
profit = sale_price - (sale_price × 0.1325) - shipping
```

Claude applies this to both the low and high end of the market value range.

### Deal Score Thresholds

```
HOT  → profit_estimate_high > $20 AND item has strong/common demand
GOOD → profit_estimate_high > $8  AND reasonable market exists
PASS → market saturated, item damaged, or profit unlikely
```

These thresholds are embedded in the Claude analysis prompt (`lib/claude.ts`) and can be tuned.

### Data Fields (AnalysisResult)

All monetary values are stored as **integer cents**.

| Field | Type | Description |
|-------|------|-------------|
| `market_value_low` | integer (cents) | Conservative estimate of what it would sell for |
| `market_value_high` | integer (cents) | Optimistic estimate (good condition, good timing) |
| `suggested_list_price` | integer (cents) | Recommended eBay listing price |
| `profit_estimate_low` | integer (cents) | Net profit at market_value_low, after fees |
| `profit_estimate_high` | integer (cents) | Net profit at market_value_high, after fees |
| `deal_score` | HOT / GOOD / PASS | Final verdict |
| `deal_score_reason` | string | One-sentence explanation |
| `data_confidence` | high / medium / low | How reliable Claude considers the estimate |

### Displayed in UI

**PriceRange component** (`components/PriceRange.tsx`) shows:
- Market value range bar (low → high, amber to green gradient)
- Suggested list price
- Profit range (low–high net)

**DealScore component** (`components/DealScore.tsx`) shows:
- Colour-coded badge (green = HOT, amber = GOOD, slate = PASS)
- Reason text below badge
- Confidence context (item confidence vs data confidence)

**CompsList component** (`components/CompsList.tsx`) shows:
- Active listings only (asking prices), with a note that sold data is unavailable via the public API

### Planned P&L Additions (Post-MVP)

These are not yet built but are the natural next features:

**Buy price input**
Allow user to enter what they paid. App calculates:
```
actual_profit = sale_price - buy_price - fees - shipping
ROI = actual_profit / buy_price × 100
```

**Platform fee selector**
Different platforms have different fee structures:

| Platform | Approximate Fee |
|----------|----------------|
| eBay | 13.25% + $0.30 |
| Poshmark | 20% flat |
| Mercari | 10% + $0.30 |
| Facebook Marketplace | 5% (shipped) / 0% (local) |
| Depop | 10% |

Switching platforms in the UI would recalculate profit estimates live.

**Shipping estimator**
Weight/dimensions input → real shipping quote from USPS/UPS API.

**Break-even calculator**
Given market value, calculate: "What's the maximum you should pay for this item?"
```
max_buy_price = market_value_low - fees - shipping - minimum_acceptable_profit
```

**Portfolio tracker**
Aggregate P&L across all scans in a session:
- Total invested (sum of buy prices)
- Total profit (sum of net profits on sold items)
- Best flip this month
- Average ROI

---

## 6. MVP Plan

### MVP Roadmap (Detailed)

**MVP Goal**
Deliver a reliable, mobile‑first PWA that lets resellers scan an item and instantly get identification, market range, profit estimate, and a clear buy/sell signal.

**Target user + core journey**
Open app → Capture/Upload → Results → Decide buy/sell → Saved in history.

**MVP Scope (Must‑Have)**
- **Product/UI**: onboarding + privacy note, camera/library flow with preview + retake, processing stepper + ETA, results clarity (active listings + confidence meaning), history list with client‑side filters and scan‑again CTA, PWA installability.
- **Backend/Data**: `/api/scan` pipeline, eBay Browse comps + 24h cache, rate limiting + retries, NeonDB persistence, protected migrate endpoint.
- **Reliability/UX**: friendly errors, file validation, clear “no comps” messaging.

**Non‑Goals (Out of scope for MVP)**
- User accounts or auth
- Sold‑listing data / Terapeak
- Multi‑image scans
- Advanced ROI tooling (buy price input, break‑even)
- Paid tiers or subscriptions

**Quality Gates (Definition of Done)**
- End‑to‑end scan works with production keys
- Results render for DB‑saved and preview flows
- History loads reliably per session
- PWA installs on iPhone Safari
- Errors are user‑friendly, no blank screens

**Release Readiness Checklist**
- DB migrations run
- Env vars set in Replit
- PWA icons added
- Smoke test on iPhone Safari
- “Add to Home Screen” verified

**Metrics to Track**
- Scan completion rate (photo → results)
- % of scans with eBay comps returned
- Average scan latency (target: <25 seconds)
- Deal score distribution (HOT / GOOD / PASS ratio)
- Returning sessions (same UUID across days)
- Buy rate on HOT scores (Phase 2: "did you buy it?" tap)
- Estimate accuracy (Phase 2: compare Claude price vs actual sold price)

**Risk Register + Mitigations**
- **No sold data** → clear “active listings” copy + confidence context
- **API rate limits** → cache + retry/backoff + rate limiting
- **Mobile camera quirks** → clear instructions + library fallback
- **DB outages** → preview flow + graceful errors

_Post‑MVP expansion is captured in Phase 2/3 below._

### What's Built (v0.1 — Current State)

- [x] Photo capture on iPhone (camera + library)
- [x] Scan flow polish (preview, retake, clear actions)
- [x] Processing stepper (Identify → Comps → Analysis + ETA)
- [x] Claude Vision item identification
- [x] eBay Browse API active listing comps
- [x] 24-hour comps cache (NeonDB)
- [x] Claude profit analysis (deal score, price range, tips)
- [x] Results clarity (active listings + confidence explanation)
- [x] Results page (server component, SEO-friendly URL)
- [x] Scan history per session + client-side filters
- [x] PWA manifest + service worker (installable on iPhone)
- [x] DB schema with full data persistence
- [x] `.replit` config for Replit deployment
- [x] TypeScript build error fixed (`lib/ebay.ts` type guard)

### Phase 1 — Replit Deploy & First Field Test

**Must have before first Goodwill test:**
- [ ] Add Replit Secrets (ANTHROPIC_API_KEY, EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, DATABASE_URL, MIGRATE_SECRET)
- [ ] Create NeonDB project at neon.tech, grab pooled connection string
- [ ] Run DB migration (`POST /api/migrate`) after first deploy
- [ ] Test full scan flow on iPhone Safari (camera + library paths)
- [ ] Test "Add to Home Screen" — verify PWA installs correctly

**Nice to have before sharing:**
- [ ] Loading skeleton on results page (currently blank during server fetch)
- [ ] Error boundary on results page (if DB is down, show friendly message)
- [ ] Share button (Web Share API — lets users share scan results)

### Phase 2 — Field Validation & Core Feature Completeness

**Field testing infrastructure (track whether the app actually finds deals):**
- [ ] "Did you buy it?" prompt after each HOT/GOOD scan — one-tap yes/no stored on scan record
- [ ] "Did it sell?" follow-up (optional, manual) — enter actual sale price to close the loop
- [ ] Simple stats dashboard: scan count, HOT%, buy rate, accuracy vs actual sale price
- [ ] Deal accuracy score: compare Claude's estimate to actual sold price over time

**Profit tools:**
- [ ] Buy price input on scan screen → actual ROI calculation
- [ ] Break-even calculator ("Don't pay more than $X for this")
- [ ] Platform fee selector (eBay / Poshmark / Mercari / FB Marketplace)

| Platform | Approximate Fee |
|----------|----------------|
| eBay | 13.25% + $0.30 |
| Poshmark | 20% flat |
| Mercari | 10% + $0.30 |
| Facebook Marketplace | 5% (shipped) / 0% (local) |
| Depop | 10% |

**Data quality:**
- [ ] Swap eBay active listings for real sold data (Apify eBay sold actor or WatchCount.com)
- [ ] Condition rating UI (let user confirm/override Claude's condition assessment)
- [ ] Multi-image support (up to 3 photos per scan for better identification accuracy)

**UX:**
- [ ] Scan result sharing (image card with deal score + price — shareable on social)
- [ ] Offline results viewing (cached past scans accessible without network)

### Phase 3 — Multi-Item & Power Features

**Multi-item scanning (shelf mode):**

> **Context:** Currently the app identifies one item per scan. A "shelf mode" feature would let users photograph an entire shelf and get a triage view of multiple items at once.

- [ ] Shelf scan mode — Claude returns an array of detected items instead of one, each with a quick deal score
- [ ] Tap to expand any item from the shelf view for full analysis + comps
- [ ] UI: grid/list of items with HOT/GOOD/PASS badges overlaid

> **Note:** One-at-a-time scanning is recommended for v1. In-store workflow naturally maps to picking up one item, flipping it, and scanning it. Shelf photos produce lower-res, angled, partially-occluded items that reduce identification confidence. Build multi-item only after validating single-item accuracy in the field.

**Category intelligence:**
- [ ] Category-specific Claude prompts (sneakers, vintage electronics, designer clothing each have different signals)
- [ ] Brand detection priority list (brands that consistently appear and resell well at Goodwill)
- [ ] "Seen before" flagging — alert when you've scanned the same item/brand category multiple times

**Power user features:**
- [ ] CSV export of scan history (for spreadsheet-based resellers)
- [ ] Trip mode — group scans by store visit, see total potential haul value
- [ ] Watchlist — save items you passed on to monitor if price drops

### Phase 4 — Growth & Distribution

**Monetisation (if applicable):**
- [ ] Scan limits on free tier (e.g. 10/day free, unlimited paid)
- [ ] User accounts (replace localStorage UUID with real auth via Clerk or NextAuth)
- [ ] Subscription billing (Stripe)

**Distribution:**
- [ ] Chrome extension (analyze FBMP/eBay listings without leaving the page)
- [ ] React Native app (after web validation — camera access is significantly better native)

### Cost Model (Per Scan)

| Component | Cost | Notes |
|-----------|------|-------|
| Claude Vision (Step 1) | ~$0.004 | ~1,000 image tokens @ claude-sonnet-4-6 pricing |
| Claude Text (Step 2) | ~$0.001 | Text-only, ~500 tokens |
| eBay API | $0.00 | Free tier: 5,000 calls/day |
| NeonDB | ~$0.00 | Free tier covers ~3GB storage |
| **Total per scan** | **~$0.005** | At scale with Haiku: ~$0.001 |

At 100 scans/day: ~$0.50/day (~$15/month). Upgrade Claude model to claude-haiku-4-5 for step 2 (analysis only) to cut costs by ~70% with minimal quality impact.

---

## 7. Environment Setup

### Required Variables

Add to `.env.local` (local) or Replit Secrets (production):

```env
ANTHROPIC_API_KEY=       # console.anthropic.com
EBAY_CLIENT_ID=          # developer.ebay.com → Your Apps → OAuth credentials
EBAY_CLIENT_SECRET=      # Same location as Client ID
DATABASE_URL=            # NeonDB → Project → Connection string (use POOLED)
MIGRATE_SECRET=          # Any random string, used to protect /api/migrate
```

### Getting API Keys

**Anthropic:**
1. `console.anthropic.com` → API Keys → Create key
2. Minimum $5 credit needed to use claude-sonnet-4-6

**eBay:**
1. `developer.ebay.com` → My Account → Application Keys
2. Create production app (not sandbox)
3. Under Auth Tokens → OAuth Client Credentials
4. Scope needed: `https://api.ebay.com/oauth/api_scope` (read-only public)
5. Rate limit: 5,000 Browse API calls/day (free)

**NeonDB:**
1. `neon.tech` → Create project → Connection Details
2. Copy the **Pooled** connection string (contains `-pooler` in hostname)
3. Do NOT use the direct connection string — exhausts connections on Replit

---

## 8. Deployment (Replit)

### Setup

1. Import project to Replit (or push via GitHub)
2. Add all env vars to Replit **Secrets** (padlock icon in sidebar)
3. Ensure `package.json` start script is `next start` (not `next start -p 3000`)
4. Replit auto-detects Next.js and handles port mapping

### First Deploy Checklist

```bash
# 1. Build passes
npm run build

# 2. Start the server
npm start

# 3. Run migrations (once only)
curl -X POST https://your-replit-url.replit.app/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"your_migrate_secret"}'

# 4. Test eBay connection
curl "https://your-replit-url.replit.app/api/ebay?q=levi+501+jeans"

# 5. Open on iPhone Safari → test scan flow → Add to Home Screen
```

### Known Replit Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| Images silently fail | Default body size limits | No action needed — Route Handlers don't have the 1MB Server Actions limit |
| DB connection errors | Using `pg` instead of neon serverless | `lib/db.ts` already uses `@neondatabase/serverless` |
| Service worker not registering | HTTP (not HTTPS) | Replit always provides HTTPS — no action needed |
| Cold start drops eBay token | Module-level token cache resets | Expected — token is re-fetched on cold start, ~200ms overhead |
| PWA won't install | Missing icons | Add PNG files to `/public/icons/` before testing |

### Upgrading to Native App

The PWA covers the iPhone use case for beta. When ready to go native:

1. Validate the web flow with real users first
2. Use React Native (Expo) to port — share `types/index.ts` and API routes as-is
3. Camera access in React Native is significantly better than PWA (faster, more control)
4. The API layer (`/api/scan`, `/api/history`) stays identical — just change the client

---

*Last updated: March 2026 · v0.1 deployed to Replit · Built with Next.js 16 + Claude Sonnet 4.6 + NeonDB*
