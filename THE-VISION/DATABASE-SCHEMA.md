# Database Schema

**Database:** PostgreSQL via NeonDB (serverless HTTP client)
**File:** `lib/db.ts`

## Entity Relationship

```
users 1───────────────────M scans
  │                          │
  │ id (UUID, PK)            │ user_id (FK → users.id)
  │ username (UNIQUE)        │ id (UUID, PK)
  │ password_hash            │ session_id (legacy)
  │ created_at               │ item_identified
  │                          │ brand, condition
                             │ deal_score
                             │ market_value_low/high
                             │ profit_estimate*
                             │ identification_json (JSONB)
                             │ analysis_json (JSONB)
                             │ ebay_comps_json (JSONB)
                             │ store_name, lat, lng
                             │ feedback fields
                             │ created_at

comps_cache (standalone)     rate_limits (standalone)
  │ query_hash (UNIQUE)        │ rate_key (PK)
  │ comps_json (JSONB)         │ window_start
  │ expires_at (24h TTL)       │ count
```

---

## Tables

### users

Stores registered user accounts.

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
  ON users (LOWER(username));
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | User identifier |
| `username` | TEXT | NOT NULL, UNIQUE | 3-30 chars, alphanumeric + underscore |
| `password_hash` | TEXT | NOT NULL | scrypt `salt:key` hex format |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Registration timestamp |

**Index:** Case-insensitive unique index on `LOWER(username)` prevents duplicate usernames regardless of casing.

---

### sessions (Legacy)

Legacy table from the anonymous session system. **Not actively used** by current JWT auth.

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### scans

Main data table. One row per scan, tied to a user.

```sql
CREATE TABLE IF NOT EXISTS scans (
  id                      UUID PRIMARY KEY,
  session_id              UUID,
  user_id                 UUID REFERENCES users(id),
  item_identified         TEXT NOT NULL,
  brand                   TEXT,
  condition               TEXT,
  deal_score              TEXT,
  market_value_low        INTEGER,
  market_value_high       INTEGER,
  profit_estimate         INTEGER,
  profit_estimate_low     INTEGER,
  profit_estimate_high    INTEGER,
  identification_json     JSONB,
  analysis_json           JSONB,
  ebay_comps_json         JSONB,
  store_name              TEXT,
  latitude                DOUBLE PRECISION,
  longitude               DOUBLE PRECISION,
  bought                  BOOLEAN,
  buy_price_cents         INTEGER,
  identification_correct  BOOLEAN,
  actual_item_override    TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Scan identifier (generated server-side) |
| `session_id` | UUID | Legacy session reference |
| `user_id` | UUID (FK) | References `users.id` |
| `item_identified` | TEXT | AI-identified item name |
| `brand` | TEXT | Detected brand (nullable) |
| `condition` | TEXT | like_new / good / fair / poor |
| `deal_score` | TEXT | HOT / GOOD / PASS |
| `market_value_low` | INTEGER | Low estimate in cents |
| `market_value_high` | INTEGER | High estimate in cents |
| `profit_estimate` | INTEGER | Midpoint profit in cents |
| `profit_estimate_low` | INTEGER | Low profit in cents |
| `profit_estimate_high` | INTEGER | High profit in cents |
| `identification_json` | JSONB | Full `IdentificationResult` |
| `analysis_json` | JSONB | Full `AnalysisResult` |
| `ebay_comps_json` | JSONB | Array of `EbayComp` |
| `store_name` | TEXT | Store name from check-in |
| `latitude` | DOUBLE PRECISION | Scan location lat |
| `longitude` | DOUBLE PRECISION | Scan location lng |
| `bought` | BOOLEAN | User feedback: purchased? |
| `buy_price_cents` | INTEGER | User feedback: price paid |
| `identification_correct` | BOOLEAN | User feedback: ID correct? |
| `actual_item_override` | TEXT | User feedback: correct name |
| `created_at` | TIMESTAMPTZ | Scan timestamp |

**Indexes:**
```sql
CREATE INDEX scans_session_id_idx ON scans (session_id, created_at DESC);
CREATE INDEX scans_user_id_idx ON scans (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
```

---

### comps_cache

24-hour cache for eBay comparable listings. Reduces API calls for repeat queries.

```sql
CREATE TABLE IF NOT EXISTS comps_cache (
  id          UUID PRIMARY KEY,
  query_hash  TEXT UNIQUE,
  comps_json  JSONB,
  fetched_at  TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX comps_cache_hash_idx ON comps_cache (query_hash);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Cache entry identifier |
| `query_hash` | TEXT | SHA-256 of normalized search query |
| `comps_json` | JSONB | Array of `EbayComp` |
| `fetched_at` | TIMESTAMPTZ | When comps were fetched |
| `expires_at` | TIMESTAMPTZ | 24 hours after fetch |

**Cache key:** SHA-256 hash of the lowercase, trimmed eBay search query from Claude's identification.

---

### rate_limits

Fixed-window rate limiting. Tracks request counts per key per time window.

```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key     TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ,
  count        INTEGER,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `rate_key` | TEXT | Composite key (e.g., `scan:192.168.1.1`) |
| `window_start` | TIMESTAMPTZ | Start of current rate window |
| `count` | INTEGER | Requests in current window |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Fallback:** If the database is unreachable, rate limiting falls back to an in-memory Map.

---

## Monetary Values

All prices are stored in **cents** (integer) to avoid floating-point precision issues:
- `market_value_low`: 4500 = $45.00
- `profit_estimate_high`: 7500 = $75.00
- `buy_price_cents`: 1200 = $12.00

**Exception:** `EbayComp.price` is in dollars (float) as received from the eBay API.
