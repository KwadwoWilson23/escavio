const CACHE_NAME = 'escavio-v1'
const PRECACHE = ['/', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/')) return
  e.respondWith(
    fetch(e.request)
      .then(res => res)
      .catch(() => caches.match(e.request).then(r => r || new Response('Offline', { status: 503 })))
  )
})
