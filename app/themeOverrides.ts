// Light-theme + responsive-layout overrides, delivered as a raw inline <style>
// (see app/layout.tsx). They are intentionally NOT placed in globals.css:
// Turbopack/@tailwindcss/postcss re-serializes that file into CSS cascade layers
// (`@layer theme` / `@layer utilities`), and this browser drops bespoke override
// rules that get folded into those layers. An inline <style> is served verbatim,
// so every declaration below lands exactly as written.
//
// `!important` is used throughout because Tailwind's layer rules outrank ordinary
// root rules regardless of specificity — important declarations are exempt from
// that layer priority on browsers that implement @layer.
//
// Light mode rationale: thrift-store lighting is poor — dim-hallway glare against
// a bright window makes dark surfaces genuinely hard to read, so light is an
// accessibility need. Dark stays the brand default; `data-theme="light"` flips it.

export const THEME_OVERRIDES_CSS = `
html[data-theme="light"] {
  --background: #f4f6fb !important;
  --foreground: #0f172a !important;
}
html[data-theme="light"] body {
  background: radial-gradient(ellipse 120% 60% at 50% 0%, #ffffff 0%, #f1f5f9 55%) !important;
  color: var(--foreground) !important;
  transition: background-color 0.2s ease;
}

/* Surfaces (light) */
html[data-theme="light"] .bg-slate-900 { background-color: #f4f6fb !important; }
html[data-theme="light"] .bg-slate-900\\/95 { background-color: rgb(244 246 251 / 0.95) !important; }
html[data-theme="light"] .bg-slate-900\\/90 { background-color: rgb(244 246 251 / 0.9) !important; }
html[data-theme="light"] .bg-slate-900\\/80 { background-color: rgb(244 246 251 / 0.8) !important; }
html[data-theme="light"] .bg-slate-900\\/70 { background-color: rgb(244 246 251 / 0.7) !important; }
html[data-theme="light"] .bg-slate-800 { background-color: #ffffff !important; }
html[data-theme="light"] .bg-slate-800\\/80 { background-color: rgb(255 255 255 / 0.8) !important; }
html[data-theme="light"] .bg-slate-800\\/70 { background-color: rgb(255 255 255 / 0.7) !important; }
html[data-theme="light"] .bg-slate-800\\/60 { background-color: rgb(255 255 255 / 0.6) !important; }
html[data-theme="light"] .bg-slate-700 { background-color: #e2e8f0 !important; }
html[data-theme="light"] .bg-slate-700\\/80 { background-color: rgb(226 232 240 / 0.8) !important; }
html[data-theme="light"] .bg-slate-700\\/60 { background-color: rgb(226 232 240 / 0.6) !important; }
html[data-theme="light"] .bg-slate-700\\/50 { background-color: rgb(226 232 240 / 0.5) !important; }
html[data-theme="light"] .bg-slate-700\\/40 { background-color: rgb(226 232 240 / 0.4) !important; }
html[data-theme="light"] .bg-slate-700\\/30 { background-color: rgb(226 232 240 / 0.3) !important; }
html[data-theme="light"] .bg-slate-600 { background-color: #cbd5e1 !important; }
html[data-theme="light"] .from-slate-800 { --tw-gradient-from: #ffffff !important; }
html[data-theme="light"] .to-slate-800\\/80 { --tw-gradient-to: rgb(255 255 255 / 0.8) !important; }
html[data-theme="light"] .to-slate-800\\/70 { --tw-gradient-to: rgb(255 255 255 / 0.7) !important; }
html[data-theme="light"] .to-slate-800\\/60 { --tw-gradient-to: rgb(255 255 255 / 0.6) !important; }

/* HOT/GOOD deal badges + status pills (light) */
html[data-theme="light"] .from-red-950\\/40 { --tw-gradient-from: #fef2f2 !important; }
html[data-theme="light"] .bg-red-950\\/40 { background-color: #fef2f2 !important; }
html[data-theme="light"] .border-red-800\\/40 { border-color: rgb(252 165 165 / 0.4) !important; }
html[data-theme="light"] .border-red-800\\/50 { border-color: rgb(252 165 165 / 0.5) !important; }
html[data-theme="light"] .from-amber-950\\/30 { --tw-gradient-from: #fffbeb !important; }
html[data-theme="light"] .border-amber-800\\/30 { border-color: rgb(252 211 77 / 0.3) !important; }
html[data-theme="light"] .bg-green-900\\/40 { background-color: #f0fdf4 !important; }
html[data-theme="light"] .border-green-700\\/40 { border-color: rgb(134 239 172 / 0.5) !important; }
html[data-theme="light"] .bg-amber-900\\/40 { background-color: #fffbeb !important; }
html[data-theme="light"] .border-amber-700\\/40 { border-color: rgb(252 211 77 / 0.4) !important; }
html[data-theme="light"] .from-green-900\\/40 { --tw-gradient-from: #f0fdf4 !important; }
html[data-theme="light"] .to-emerald-900\\/20 { --tw-gradient-to: rgb(236 253 245 / 0.5) !important; }

/* Text (light) */
html[data-theme="light"] .text-white { color: #0f172a !important; }
html[data-theme="light"] .text-slate-200 { color: #1e293b !important; }
html[data-theme="light"] .text-slate-300 { color: #334155 !important; }
html[data-theme="light"] .text-slate-400 { color: #64748b !important; }
html[data-theme="light"] .text-slate-500 { color: #64748b !important; }
html[data-theme="light"] .text-slate-600 { color: #475569 !important; }
html[data-theme="light"] .text-slate-700 { color: #334155 !important; }
html[data-theme="light"] .text-amber-200 { color: #f59e0b !important; }
html[data-theme="light"] .text-amber-300 { color: #d97706 !important; }
html[data-theme="light"] .text-amber-400 { color: #b45309 !important; }
html[data-theme="light"] .text-amber-400\\/90 { color: rgb(180 83 9 / 0.9) !important; }
html[data-theme="light"] .text-amber-500 { color: #92400e !important; }
html[data-theme="light"] .text-amber-600 { color: #b45309 !important; }
html[data-theme="light"] .text-green-400 { color: #16a34a !important; }
html[data-theme="light"] .text-red-400 { color: #dc2626 !important; }

/* Borders (light) */
html[data-theme="light"] .border-slate-800 { border-color: #e2e8f0 !important; }
html[data-theme="light"] .border-slate-800\\/80 { border-color: rgb(226 232 240 / 0.8) !important; }
html[data-theme="light"] .border-slate-700 { border-color: #cbd5e1 !important; }
html[data-theme="light"] .border-slate-700\\/80 { border-color: rgb(203 213 225 / 0.8) !important; }
html[data-theme="light"] .border-slate-700\\/60 { border-color: rgb(203 213 225 / 0.6) !important; }
html[data-theme="light"] .border-slate-700\\/50 { border-color: rgb(203 213 225 / 0.5) !important; }
html[data-theme="light"] .border-slate-700\\/40 { border-color: rgb(203 213 225 / 0.4) !important; }
html[data-theme="light"] .border-slate-700\\/20 { border-color: rgb(203 213 225 / 0.2) !important; }
html[data-theme="light"] .border-slate-600 { border-color: #cbd5e1 !important; }
html[data-theme="light"] .border-slate-600\\/60 { border-color: rgb(203 213 225 / 0.6) !important; }
html[data-theme="light"] .border-slate-600\\/50 { border-color: rgb(203 213 225 / 0.5) !important; }
html[data-theme="light"] .border-slate-600\\/40 { border-color: rgb(203 213 225 / 0.4) !important; }
html[data-theme="light"] .border-slate-600\\/30 { border-color: rgb(203 213 225 / 0.3) !important; }
html[data-theme="light"] .border-slate-500 { border-color: #cbd5e1 !important; }
html[data-theme="light"] .border-white\\/10 { border-color: rgb(226 232 240 / 0.6) !important; }
html[data-theme="light"] .border-white\\/5 { border-color: rgb(226 232 240 / 0.5) !important; }
html[data-theme="light"] .bg-white\\/10 { background-color: rgb(255 255 255 / 0.85) !important; }
html[data-theme="light"] .bg-white\\/5 { background-color: rgb(255 255 255 / 0.6) !important; }

html[data-theme="light"] .shimmer {
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%) !important;
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

/* Baseline (mobile): bottom nav visible, top nav hidden. NOTE these base rules
   MUST come before the desktop media queries below — for equal-specificity
   !important rules the LATER declaration wins, so the media-scoped overrides
   need to appear after these to take effect at ≥1024px. */
nav[data-nav="mobile"] { display: flex !important; }
nav[data-nav="desktop"] { display: none !important; }

/* Responsive desktop layout */
@media (min-width: 1024px) {
  nav[data-nav="mobile"] { display: none !important; }
  nav[data-nav="desktop"] { display: flex !important; }
  .mx-auto.max-w-md { max-width: 42rem !important; padding-top: 6rem !important; }
}
@media (min-width: 1280px) {
  .mx-auto.max-w-md { max-width: 48rem !important; }
}
`