import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import { THEME_OVERRIDES_CSS } from './themeOverrides'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

// Runs before first paint so the page never flashes dark-on-light (or the
// reverse). Decision order: saved user choice → system preference → dark (brand).
const THEME_BOOTSTRAP = `try{var k='thriftlens_theme',d=document.documentElement,t;try{t=localStorage.getItem(k)}catch(e){}if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark'}d.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}`

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'ThriftLens — Resale Price Scanner',
  description: 'Snap a photo of any thrift store item and get instant resale value + profit estimate',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ThriftLens',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} h-full antialiased`}>
<body className="min-h-full flex flex-col bg-slate-900">
        {/* Set data-theme before the first paint to avoid a theme flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        {/* Light-theme + desktop responsive overrides (delivered verbatim, see themeOverrides.ts) */}
        <style dangerouslySetInnerHTML={{ __html: THEME_OVERRIDES_CSS }} />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
