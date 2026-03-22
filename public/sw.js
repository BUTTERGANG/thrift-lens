const CACHE_NAME = 'thriftlens-v2'
const PRECACHE = ['/', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
      ),
    ])
  )
})

self.addEventListener('fetch', (e) => {
  // Never intercept API routes — always go to network
  if (e.request.url.includes('/api/')) return

  const url = new URL(e.request.url)
  const isSameOrigin = url.origin === self.location.origin
  const isStatic = isSameOrigin && url.pathname.startsWith('/_next/static/')

  if (isStatic) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ??
        fetch(e.request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy))
          return response
        })
      )
    )
    return
  }

  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(
        (cached) => cached ?? new Response('Offline — please reconnect.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
    )
  )
})
