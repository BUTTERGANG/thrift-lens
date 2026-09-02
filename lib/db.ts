import { neon } from '@neondatabase/serverless'

// Lazy init — neon() validates the URL immediately, so we defer until first query
// to avoid throwing during Next.js build with placeholder env vars.
let _client: ReturnType<typeof neon> | null = null

function getClient(): ReturnType<typeof neon> {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _client = neon(process.env.DATABASE_URL)
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql = async (strings: TemplateStringsArray, ...values: any[]): Promise<Record<string, any>[]> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient()(strings, ...values) as any

export default sql

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS scans (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id          UUID NOT NULL,
      image_url           TEXT,
      item_identified     TEXT NOT NULL,
      brand               TEXT,
      condition           TEXT,
      deal_score          TEXT NOT NULL CHECK (deal_score IN ('HOT','GOOD','PASS')),
      market_value_low    INTEGER,
      market_value_high   INTEGER,
      profit_estimate     INTEGER,
      profit_estimate_low INTEGER,
      profit_estimate_high INTEGER,
      identification_json JSONB,
      analysis_json       JSONB NOT NULL,
      ebay_comps_json     JSONB,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE scans
    ADD COLUMN IF NOT EXISTS profit_estimate_low INTEGER,
    ADD COLUMN IF NOT EXISTS profit_estimate_high INTEGER
  `

  await sql`
    CREATE INDEX IF NOT EXISTS scans_session_id_idx ON scans (session_id, created_at DESC)
  `

  await sql`
    ALTER TABLE scans
    ADD COLUMN IF NOT EXISTS bought                BOOLEAN,
    ADD COLUMN IF NOT EXISTS buy_price_cents       INTEGER,
    ADD COLUMN IF NOT EXISTS identification_correct BOOLEAN,
    ADD COLUMN IF NOT EXISTS actual_item_override  TEXT
  `

  await sql`
    ALTER TABLE scans
    ADD COLUMN IF NOT EXISTS store_name TEXT,
    ADD COLUMN IF NOT EXISTS latitude   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude  DOUBLE PRECISION
  `

  await sql`
    CREATE INDEX IF NOT EXISTS scans_store_name_idx ON scans (store_name, created_at DESC)
    WHERE store_name IS NOT NULL
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comps_cache (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query_hash  TEXT NOT NULL UNIQUE,
      comps_json  JSONB NOT NULL,
      fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS comps_cache_hash_idx ON comps_cache (query_hash)
  `

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      rate_key     TEXT PRIMARY KEY,
      window_start TIMESTAMPTZ NOT NULL,
      count        INTEGER NOT NULL,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
    ON users (LOWER(username))
  `

  await sql`
    ALTER TABLE scans
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS scans_user_id_idx
    ON scans (user_id, created_at DESC)
    WHERE user_id IS NOT NULL
  `
}
