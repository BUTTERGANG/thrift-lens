import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ThriftLens — Resale Price Scanner',
    short_name: 'ThriftLens',
    description: 'Snap thrift store items for instant resale value',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    categories: ['shopping', 'utilities'],
    icons: [
      { src: '/api/pwa-icon', sizes: '192x192', type: 'image/png' },
      { src: '/api/pwa-icon-large', sizes: '512x512', type: 'image/png' },
      { src: '/api/pwa-icon-large', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
