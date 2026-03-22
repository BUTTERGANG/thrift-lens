import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'ThriftLens — Resale Price Scanner',
  description: 'Snap a photo of any thrift store item and get instant resale value + profit estimate',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ThriftLens',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
<body className="min-h-full flex flex-col bg-slate-900">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
