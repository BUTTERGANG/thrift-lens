# ThriftLens

ThriftLens is a mobile-first PWA that helps resellers price thrift finds. Snap a photo, get identification, live eBay comps (active listings), market value range, profit estimate, and selling tips.

## Features
- Camera + library upload with preview and retake
- Processing stepper (Identify → Comps → Analysis) with ETA hint
- Claude Vision identification + text-only analysis
- eBay Browse API comps (active listings, cached 24h)
- Deal score (HOT / GOOD / PASS) + confidence context
- Scan history per session with client-side filters
- Installable PWA (iPhone Safari)
- No account required; images are not stored

## Tech Stack
- Next.js 16 App Router
- Claude Sonnet 4.6 (Vision + Text)
- eBay Browse API
- NeonDB (PostgreSQL)
- Tailwind CSS v4

## Getting Started

### 1) Install
```bash
npm install
```

### 2) Env vars
Create `.env.local`:
```env
ANTHROPIC_API_KEY=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
DATABASE_URL=
MIGRATE_SECRET=
ENABLE_MIGRATE_ENDPOINT=true
```

### 3) Run migrations
```bash
curl -X POST http://localhost:3000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_MIGRATE_SECRET"}'
```

### 4) Run the app
```bash
npm run dev
```

Open http://localhost:3000.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Notes
- Comps are **active listings** (asking prices), not sold listings.
- The app uses a session UUID stored in localStorage (no auth in beta).

## More Documentation
See `DOCS.md` for architecture, API, schema, and deployment details.
