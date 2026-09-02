# Directory Structure

```
/workspace/
│
├── app/                                    # Next.js App Router (pages, layouts, API)
│   ├── layout.tsx                          # Root layout — metadata, viewport, fonts, PWA tags
│   ├── page.tsx                            # Home page — scanner UI, feature pills, store check-in
│   ├── globals.css                         # Tailwind imports + custom animations (shimmer, pulse, sweep)
│   ├── manifest.ts                         # PWA web manifest (name, icons, display, colors)
│   ├── icon.tsx                            # Dynamic favicon generation (ImageResponse)
│   ├── apple-icon.tsx                      # iOS home screen icon generation (ImageResponse)
│   │
│   ├── login/
│   │   └── page.tsx                        # Login/signup form with mode toggle
│   │
│   ├── history/
│   │   └── page.tsx                        # Scan history — pagination, filters, skeleton loaders
│   │
│   ├── results/
│   │   ├── [id]/
│   │   │   └── page.tsx                    # Full results page (server-rendered, ownership-scoped)
│   │   └── preview/
│   │       └── page.tsx                    # Preview page (sessionStorage-based, pre-DB-save)
│   │
│   ├── actions/
│   │   └── auth.ts                         # Server actions: signup, login, logout
│   │
│   └── api/
│       ├── scan/
│       │   └── route.ts                    # POST — main scan pipeline (image → AI → eBay → DB)
│       ├── scan/[id]/feedback/
│       │   └── route.ts                    # PATCH — user feedback on scan accuracy
│       ├── history/
│       │   └── route.ts                    # GET — paginated scan history for user
│       ├── ebay/
│       │   └── route.ts                    # GET — eBay comps debug endpoint (dev only)
│       ├── ebay/account-deletion/
│       │   └── route.ts                    # GET/POST — eBay GDPR account deletion endpoint
│       ├── migrate/
│       │   └── route.ts                    # POST — database schema initialization
│       ├── pwa-icon/
│       │   └── route.tsx                   # 192x192 PNG icon generation
│       └── pwa-icon-large/
│           └── route.tsx                   # 512x512 PNG icon generation
│
├── components/                             # React components
│   ├── Scanner.tsx                         # Camera/library UI, image preview, processing stepper
│   ├── ResultCard.tsx                      # Composite results layout (score + price + comps + tips)
│   ├── DealScore.tsx                       # HOT/GOOD/PASS badge with color and icon
│   ├── PriceRange.tsx                      # Market value range + profit estimate display
│   ├── CompsList.tsx                       # eBay comparable listings table with links
│   ├── TipsList.tsx                        # Selling tips, platforms, keywords, warnings
│   ├── FeedbackTap.tsx                     # Post-scan feedback form (bought? price? correct ID?)
│   ├── UserMenu.tsx                        # Username display + logout button
│   ├── StoreCheckIn.tsx                    # Geolocation check-in with reverse geocoding
│   ├── ShareButton.tsx                     # Native share API + clipboard fallback
│   ├── ServiceWorkerRegistrar.tsx          # PWA service worker registration on mount
│   └── icons.tsx                           # 31 SVG icon components (Camera, Search, Flame, etc.)
│
├── lib/                                    # Server-side utilities
│   ├── db.ts                               # NeonDB client, SQL migrations, query helpers
│   ├── auth.ts                             # JWT encrypt/decrypt, session create/get/delete
│   ├── password.ts                         # scrypt password hashing + timing-safe verification
│   ├── claude.ts                           # Anthropic SDK setup, vision + analysis prompts
│   ├── ebay.ts                             # eBay OAuth token management + Browse API search
│   ├── location.ts                         # Geolocation utilities + Nominatim reverse geocoding
│   └── rateLimit.ts                        # Fixed-window rate limiting (DB + in-memory fallback)
│
├── types/
│   └── index.ts                            # TypeScript interfaces (Scan, Analysis, Comp, etc.)
│
├── public/
│   └── sw.js                               # Service worker (precache, cache-first, network-first)
│
├── proxy.ts                                # Next.js middleware — JWT auth + route protection
├── next.config.ts                          # Next.js config (origins, images, headers)
├── tsconfig.json                           # TypeScript config (strict, paths, target)
├── package.json                            # Dependencies and scripts
├── postcss.config.mjs                      # PostCSS config (Tailwind CSS v4)
├── eslint.config.mjs                       # ESLint configuration
├── DOCS.md                                 # Technical documentation
├── README.md                               # Quick start guide
├── CLAUDE.md                               # AI assistant instructions
└── AGENTS.md                               # Agent behavior configuration
```
