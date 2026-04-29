// EventHub Service Worker — offline-first caching for the PWA shell
const CACHE = 'eventhub-v1'

// Skip waiting so the new SW activates immediately
self.addEventListener('install', () => self.skipWaiting())

// Claim all open clients so the SW controls them right away
self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
)

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return

  // Never cache Supabase API, email API, or external image CDNs
  const url = new URL(request.url)
  const skipHosts = ['supabase.co', 'resend.com', 'api.qrserver.com', 'images.unsplash.com']
  if (skipHosts.some(h => url.hostname.includes(h))) return

  // Network-first with cache fallback — keeps the app fast and fresh
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      } catch {
        const cached = await cache.match(request)
        if (cached) return cached
        // Offline fallback: return the cached root for navigation requests
        if (request.mode === 'navigate') return cache.match('/')
        return new Response('Offline', { status: 503 })
      }
    })
  )
})
