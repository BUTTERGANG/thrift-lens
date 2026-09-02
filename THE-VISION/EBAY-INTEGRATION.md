# eBay Integration

## Overview

ThriftLens uses the **eBay Browse API** to fetch live active listings as comparable sales ("comps"). Authentication uses **OAuth 2.0 client credentials** (app-level, no user login required).

**File:** `lib/ebay.ts`

---

## Authentication

### OAuth 2.0 Client Credentials Flow

```
App → POST https://api.ebay.com/identity/v1/oauth2/token
    → Body: grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope
    → Header: Authorization: Basic base64(client_id:client_secret)
    ← { access_token, expires_in }
```

### Token Caching

Tokens are cached in-memory with a 5-minute safety buffer before expiration:

```
Token valid? → Use cached token
Token expired/missing? → Fetch new token → Cache it
```

**No user tokens are involved** — the app accesses eBay's public search API only.

---

## Browse API Search

### Endpoint

```
GET https://api.ebay.com/buy/browse/v1/item_summary/search
```

### Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `q` | From Claude's `ebay_search_query` | Search terms |
| `limit` | 8 | Max results |
| `sort` | `price` | Sort by price ascending |
| `filter` | `deliveryCountry:US` | US listings only |

### Response Mapping

Each eBay item is mapped to an `EbayComp`:

```typescript
{
  title: "Nike Air Max 90 OG Men's Size 10",
  price: 65.00,           // USD dollars (float)
  currency: "USD",
  condition: "Pre-Owned",
  listing_url: "https://www.ebay.com/itm/...",
  image_url: "https://i.ebayimg.com/...",
  end_date: null,          // null for active listings
  marketplace: "ebay"
}
```

---

## Comp Caching

### Strategy

Results are cached in the `comps_cache` database table with a **24-hour TTL**.

### Cache Key

The cache key is a SHA-256 hash of the **normalized** search query:

```
query = "Nike Air Max 90 OG"
normalized = "nike air max 90 og"  (lowercase, trimmed)
hash = SHA-256(normalized)
```

### Flow

```
1. Claude returns ebay_search_query
2. Normalize → SHA-256 hash
3. SELECT FROM comps_cache WHERE query_hash = ? AND expires_at > NOW()
4. If found → return cached comps
5. If not found → call eBay API → INSERT into comps_cache
```

### Why Cache?

- eBay API has rate limits
- Same/similar items scanned by different users can share comps
- 24-hour TTL keeps prices reasonably fresh
- Reduces scan latency on cache hits

---

## GDPR Compliance

### Account Deletion Endpoint

**File:** `app/api/ebay/account-deletion/route.ts`

eBay requires marketplace apps to implement an account deletion notification endpoint.

**GET** — Challenge validation:
- eBay sends `challenge_code` as query parameter
- Server computes `SHA-256(challengeCode + verificationToken + endpointURL)`
- Returns `{ challengeResponse: "hex-hash" }`

**POST** — Deletion notification:
- eBay notifies that a user deleted their account
- ThriftLens acknowledges but takes no action (no user-specific eBay data stored)

### Why No Action Needed?

ThriftLens uses **client credentials** (app-level OAuth), not user OAuth tokens. The app never stores any eBay user data — only public listing data from search results.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `EBAY_CLIENT_ID` | eBay app client ID |
| `EBAY_CLIENT_SECRET` | eBay app client secret |
| `EBAY_VERIFICATION_TOKEN` | Token for GDPR endpoint verification |
| `EBAY_DEBUG_TOKEN` | Optional token for dev-only `/api/ebay` endpoint |

---

## Image Handling

eBay listing images are served from `i.ebayimg.com` and `*.ebayimg.com`. These domains are allowlisted in `next.config.ts` for Next.js image optimization:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.ebayimg.com' },
    { protocol: 'https', hostname: 'i.ebayimg.com' },
  ],
}
```
