# Components

## Component Map

```
Home Page (/)
├── UserMenu              (username + logout)
├── StoreCheckIn          (geolocation check-in)
├── Scanner               (camera/upload + processing)
│   └── [navigates to results]
└── Bottom Nav

Results Page (/results/[id])
├── ResultCard
│   ├── DealScore         (HOT/GOOD/PASS badge)
│   ├── PriceRange        (market value + profit)
│   ├── CompsList         (eBay listings table)
│   └── TipsList          (platforms, tips, keywords)
├── FeedbackTap           (post-scan feedback form)
├── ShareButton           (share/copy link)
└── Bottom Nav

History Page (/history)
├── Filter Tabs           (score + recency)
├── Scan List Items       (inline, not a component)
└── Bottom Nav

Global
├── ServiceWorkerRegistrar (PWA registration)
└── icons.tsx              (31 SVG icons)
```

---

## Scanner

**File:** `components/Scanner.tsx` | **Type:** Client component

The primary user-facing component. Handles image capture, preview, and the scan submission pipeline.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `storeName` | `string \| undefined` | Store name from StoreCheckIn |
| `latitude` | `number \| undefined` | User latitude |
| `longitude` | `number \| undefined` | User longitude |

### State
| State | Type | Purpose |
|-------|------|---------|
| `preview` | `string \| null` | Blob URL for image preview |
| `file` | `File \| null` | Selected file for upload |
| `loading` | `boolean` | Scan in progress |
| `stepIndex` | `number` (0-2) | Current processing step |
| `error` | `string \| null` | Error message |

### Behavior
1. **File selection**: Camera (rear) or library. Validates format (no HEIC) and size (10MB max).
2. **Preview**: Shows selected image with retake/choose-different options.
3. **Scan**: Sends image to `/api/scan`. Shows 3-step progress (Identify → Comps → Analysis) with 6-second step advancement.
4. **Completion**: Saves response to sessionStorage, navigates to results page.
5. **Memory management**: Revokes blob URLs when preview changes.

### Steps Display
```
① Identifying item...  →  ② Pulling live comps...  →  ③ Crunching numbers...
```

---

## ResultCard

**File:** `components/ResultCard.tsx` | **Type:** Server component

Composite layout that assembles all result sub-components.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `scan` | `ScanResponse` | Full scan response data |

### Layout
1. Item name + brand header
2. Condition + confidence badge
3. `<DealScore />` — score badge
4. `<PriceRange />` — market value and profit
5. `<CompsList />` — eBay listings
6. `<TipsList />` — selling tips and keywords

---

## DealScore

**File:** `components/DealScore.tsx` | **Type:** Client component

Displays the deal assessment as a colored badge.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `score` | `'HOT' \| 'GOOD' \| 'PASS'` | Deal rating |
| `reason` | `string` | Explanation text |

### Visual Mapping
| Score | Color | Icon | Animation |
|-------|-------|------|-----------|
| HOT | Red gradient | Flame | Pulse glow |
| GOOD | Green gradient | ThumbUp | None |
| PASS | Slate gradient | Minus | None |

---

## PriceRange

**File:** `components/PriceRange.tsx` | **Type:** Client component

Shows market value range and estimated profit.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `analysis` | `AnalysisResult` | Analysis data with price fields (in cents) |

### Display
- Market value: `$45 — $85` (converted from cents)
- Suggested list price: `$65`
- Profit estimate: `$35 — $75`

---

## CompsList

**File:** `components/CompsList.tsx` | **Type:** Client component

Table of eBay comparable active listings.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `comps` | `EbayComp[]` | Array of eBay listings |

### Display
Each comp shows:
- Listing title (truncated)
- Price
- Condition
- Link to eBay listing (external, new tab)

---

## TipsList

**File:** `components/TipsList.tsx` | **Type:** Client component

Selling recommendations from the AI analysis.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `analysis` | `AnalysisResult` | Full analysis data |

### Sections
1. **Best Platforms** — where to sell (eBay, Poshmark, etc.)
2. **Selling Tips** — actionable advice
3. **Keywords** — suggested listing keywords
4. **Watch Out** — warnings or things to check

---

## FeedbackTap

**File:** `components/FeedbackTap.tsx` | **Type:** Client component

Post-scan feedback form for improving AI accuracy.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `scanId` | `string` | Scan UUID |

### Form Fields
- **Did you buy it?** — Yes/No toggle
- **Price paid** — dollar input (if bought)
- **Was the ID correct?** — Yes/No toggle
- **Correct item name** — text input (if ID was wrong)

Submits via `PATCH /api/scan/[id]/feedback`.

---

## UserMenu

**File:** `components/UserMenu.tsx` | **Type:** Client component

Displays the authenticated user's name with a logout button.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `username` | `string` | Current user's username |

### Elements
- User icon + truncated username (max 100px)
- Logout button (form wrapping `logout` server action)

---

## StoreCheckIn

**File:** `components/StoreCheckIn.tsx` | **Type:** Client component

Optional geolocation check-in that attaches a store name to scans.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `onCheckIn` | `(data) => void` | Callback with store name + coordinates |

### Behavior
1. User taps "Check In"
2. Browser requests geolocation permission
3. Coordinates sent to Nominatim for reverse geocoding
4. Store name resolved and displayed
5. Data passed up to Scanner via callback

---

## ShareButton

**File:** `components/ShareButton.tsx` | **Type:** Client component

Share scan results via native share sheet or clipboard.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `scanId` | `string` | Scan UUID for URL construction |
| `itemName` | `string` | Item name for share text |

### Behavior
- Uses `navigator.share()` if available (mobile)
- Falls back to `navigator.clipboard.writeText()` with "Copied!" feedback

---

## ServiceWorkerRegistrar

**File:** `components/ServiceWorkerRegistrar.tsx` | **Type:** Client component

Registers the PWA service worker on component mount.

### Behavior
- Checks `'serviceWorker' in navigator`
- Registers `/sw.js` with scope `/`
- Runs once on mount (empty dependency array)
- No UI rendered (returns `null`)

---

## Icons

**File:** `components/icons.tsx`

31 SVG icon components sharing a common base configuration.

### Base Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Tailwind classes |
| `size` | `number` | 18 | Pixel dimensions |
| `strokeWidth` | `number` | 2 | SVG stroke width |

### Available Icons
IconCamera, IconGallery, IconSearch, IconBarChart, IconDollar, IconClipboard, IconPin, IconArrowRight, IconArrowLeft, IconArrowUpRight, IconCheck, IconX, IconWarning, IconFlame, IconThumbUp, IconMinus, IconClock, IconShare, IconStar, IconUser, IconLogout, IconInbox, and more.
