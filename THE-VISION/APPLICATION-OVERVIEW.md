# Application Overview

## What is ThriftLens?

ThriftLens is a mobile-first Progressive Web App (PWA) designed for thrift store resellers. Users snap a photo of any item, and the app instantly:

1. **Identifies the item** using Claude Vision AI (brand, model, condition, era)
2. **Fetches live eBay comps** (active listings for the same/similar items)
3. **Analyzes market value** and estimates profit potential
4. **Scores the deal** as HOT, GOOD, or PASS
5. **Provides selling tips** — best platforms, listing keywords, and warnings

## Who Is It For?

- Thrift store resellers who flip items on eBay, Poshmark, Mercari, etc.
- Casual shoppers who want to know if something is worth buying
- Anyone who wants instant market intelligence on secondhand goods

## Key User Flow

```
Open App → Snap Photo → Wait 15-25s → See Results → Buy or Skip
```

1. User opens ThriftLens (installable on iPhone home screen)
2. Taps "Take Photo" (rear camera) or "Library" (existing photo)
3. Reviews the preview image, taps "Scan This Item"
4. Watches a 3-step progress indicator (Identify → Comps → Analysis)
5. Gets routed to a results page showing:
   - Item identification (name, brand, condition, era)
   - Deal score badge (HOT/GOOD/PASS with reason)
   - Market value range and profit estimate
   - Live eBay comparable listings with prices
   - Selling tips, platform recommendations, listing keywords
6. Can provide feedback (bought it? correct ID? what did you pay?)
7. All scans saved to history for later review

## Core Design Principles

- **Privacy-first**: No images are stored on the server. Photos are sent for AI analysis then discarded.
- **Mobile-first**: Built for one-handed use in a thrift store. Large touch targets, dark theme to reduce glare.
- **Speed**: Two-call AI strategy (Vision for ID, text-only for analysis) with 24-hour eBay comp caching.
- **Installable**: Full PWA with service worker, offline shell, and home screen icon.
- **Simple auth**: Username/password with 7-day JWT sessions. No email required.

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| AI | Claude Sonnet 4.6 (Anthropic SDK) |
| Market Data | eBay Browse API (OAuth client credentials) |
| Database | PostgreSQL via NeonDB (serverless) |
| Auth | JWT (jose) + scrypt password hashing |
| Deployment | Replit |
| PWA | Custom service worker + web manifest |
