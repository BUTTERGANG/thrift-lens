# Changelog

All notable changes to thrift-lens. Newest first.

## 2026-10-23 — Security: dependency vulnerability fixes

Known advisories (OSV) in lockfiles: **5 critical, 43 high, 28 moderate, 4 low → 2 moderate**.

- **Next.js 16.2.0 → 16.4.2** (`next`, `eslint-config-next`, pinned) — fixes critical unauthenticated RCE advisories (Image Optimization API, `use cache`, `next/og` ImageResponse). 16.4.2 chosen over the same-day 16.4.3 as a supply-chain precaution; both have no known advisories
- Non-breaking `npm audit fix` updates
- `package-lock.json` tarball URLs pointed at Replit's internal `package-firewall.replit.local`; rewritten to `registry.npmjs.org` so installs work off Replit (integrity hashes unchanged)
- Critical/high advisories cleared in: `next`, `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `picomatch`, `postcss`, `sharp`, `source-map-js`, `zod`
- Verified: `npm run build` passes
- Remaining: `@anthropic-ai/sdk` (moderate) — only affects the SDK's filesystem memory tool, which this app does not use; fix is a 1.x major bump
