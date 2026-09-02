# API Routes

## Summary

| Endpoint | Method | Auth | Rate Limit | Purpose |
|----------|--------|------|-----------|---------|
| `/api/scan` | POST | Session | 5/min/IP | Main scan pipeline |
| `/api/scan/[id]/feedback` | PATCH | Session | None | User feedback on scan |
| `/api/history` | GET | Session | None | Paginated history |
| `/api/ebay` | GET | None (dev) | 10/min/IP | eBay comps debug |
| `/api/ebay/account-deletion` | GET/POST | None | None | GDPR compliance |
| `/api/migrate` | POST | Secret key | None | DB initialization |

---

## POST /api/scan

**File:** `app/api/scan/route.ts`

The main analysis pipeline. Accepts an image and returns full item analysis.

### Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | JPEG, PNG, WEBP, or GIF. Max 10MB. No HEIC. |
| `store_name` | string | No | Name of the store (from check-in) |
| `latitude` | number | No | User's latitude |
| `longitude` | number | No | User's longitude |

### Pipeline Steps

1. **Rate limit check** — 5 scans per minute per IP address
2. **Session validation** — JWT must be valid
3. **Image validation** — file type, size, no HEIC
4. **Claude Vision identification** — image sent as base64 to Claude Sonnet
5. **eBay comp cache lookup** — SHA-256 hash of search query
6. **eBay Browse API call** — only if cache miss
7. **Claude text analysis** — identification + comps sent for pricing/scoring
8. **Database INSERT** — full scan record saved
9. **Response** — JSON with analysis results

### Response (200)

```json
{
  "scan_id": "uuid-string | null",
  "item_identified": "Nike Air Max 90",
  "brand": "Nike",
  "deal_score": "HOT",
  "identification": {
    "item_name": "Nike Air Max 90",
    "brand": "Nike",
    "model": "Air Max 90",
    "category": "Shoes",
    "condition": "good",
    "condition_notes": "Minor sole wear, upper clean",
    "notable_features": ["OG colorway", "Leather upper"],
    "estimated_era": "2019-2020",
    "ebay_search_query": "Nike Air Max 90 OG men size",
    "confidence": "high"
  },
  "analysis": {
    "market_value_low": 4500,
    "market_value_high": 8500,
    "suggested_list_price": 6500,
    "profit_estimate_low": 3500,
    "profit_estimate_high": 7500,
    "deal_score": "HOT",
    "deal_score_reason": "Strong demand, good condition, well below market",
    "best_platforms": ["eBay", "StockX", "GOAT"],
    "selling_tips": ["Clean soles before listing", "Include all angles"],
    "keywords_for_listing": ["Nike Air Max 90", "OG", "vintage"],
    "watch_out_for": "Check for sole separation on older pairs",
    "data_confidence": "high"
  },
  "comps": [
    {
      "title": "Nike Air Max 90 OG Men's Size 10",
      "price": 65.00,
      "currency": "USD",
      "condition": "Pre-Owned",
      "listing_url": "https://www.ebay.com/itm/...",
      "image_url": "https://i.ebayimg.com/...",
      "end_date": null,
      "marketplace": "ebay"
    }
  ]
}
```

**Note:** `scan_id` is `null` if the database insert fails (results still returned).

### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ error: "No image provided" }` | Missing image field |
| 400 | `{ error: "HEIC not supported..." }` | HEIC/HEIF format |
| 400 | `{ error: "Image too large (max 10 MB)" }` | File exceeds 10MB |
| 401 | `{ error: "Not authenticated" }` | No/invalid session |
| 429 | `{ error: "Rate limit exceeded..." }` | Over 5 scans/min |
| 500 | `{ error: "Analysis failed" }` | Claude API error |

---

## PATCH /api/scan/[id]/feedback

**File:** `app/api/scan/[id]/feedback/route.ts`

Records user feedback on a scan's accuracy.

### Request

**Content-Type:** `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bought` | boolean | No | Did the user buy the item? |
| `buy_price_cents` | number | No | Price paid in cents |
| `identification_correct` | boolean | No | Was the AI ID correct? |
| `actual_item_override` | string | No | Correct item name if AI was wrong |

### Response (200)

```json
{ "ok": true }
```

---

## GET /api/history

**File:** `app/api/history/route.ts`

Returns paginated scan history for the authenticated user.

### Query Parameters

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `limit` | number | 20 | 50 | Items per page |
| `offset` | number | 0 | — | Pagination offset |

### Response (200)

```json
{
  "scans": [
    {
      "id": "uuid",
      "item_identified": "Nike Air Max 90",
      "brand": "Nike",
      "deal_score": "HOT",
      "market_value_low": 4500,
      "market_value_high": 8500,
      "store_name": "Goodwill",
      "created_at": "2026-03-30T15:30:00Z"
    }
  ],
  "total": 42
}
```

---

## GET /api/ebay

**File:** `app/api/ebay/route.ts`

Development-only endpoint for testing eBay API integration directly.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | eBay search query |

### Access Control

- Blocked in production unless `EBAY_DEBUG_TOKEN` matches request header
- Rate limited: 10 requests per minute per IP

---

## GET/POST /api/ebay/account-deletion

**File:** `app/api/ebay/account-deletion/route.ts`

eBay Marketplace Account Deletion notification endpoint (GDPR compliance).

### GET (Challenge Validation)

eBay sends a challenge code. Server returns SHA-256 hash proving endpoint ownership.

**Query:** `?challenge_code=abc123`

**Response:**
```json
{ "challengeResponse": "sha256-hex-hash" }
```

### POST (Deletion Notification)

eBay notifies that a user deleted their account. Since ThriftLens uses client credentials (no user tokens), no action needed.

**Response:**
```json
{ "status": "acknowledged" }
```

---

## POST /api/migrate

**File:** `app/api/migrate/route.ts`

Initializes or updates the database schema. Runs all migrations defined in `lib/db.ts`.

### Access Control

- Requires `ENABLE_MIGRATE_ENDPOINT=true` environment variable
- Request body must include `secret` matching `MIGRATE_SECRET` env var

### Request

```json
{ "secret": "your-migrate-secret" }
```

### Response (200)

```json
{ "ok": true }
```
