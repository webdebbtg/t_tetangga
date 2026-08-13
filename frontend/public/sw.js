// ============================================================
//  Tengok Tetangga — Service Worker
//  Menangani: PWA offline cache + Web Push Notification
// ============================================================

const CACHE_NAME = 'tt-cache-v1'
const OFFLINE_URL = '/offline.html'

// Asset yang di-cache saat install
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Jika ada asset yang gagal di-cache, tetap lanjutkan
      })
    }).then(() => self.skipWaiting())
  )
})

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Hapus cache lama
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  )
})

// ── Fetch — Network first, fallback to cache ─────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET dan API requests (jangan di-cache)
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.hostname !== self.location.hostname) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache respons yang sukses
        if (response.ok && response.status === 200) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        }
        return response
      })
      .catch(() => {
        // Fallback ke cache
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Jika navigasi dan tidak ada cache, tampilkan offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
        })
      })
  )
})

// ── Push Notification ─────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Tengok Tetangga', body: event.data.text() }
  }

  const {
    title = 'Tengok Tetangga',
    body = 'Ada pembaruan baru',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/icon-96x96.png',
    url = '/dashboard',
    tag = 'tt-notif',
    data: notifData = {},
  } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: { url, ...notifData },
      actions: [
        { action: 'open',    title: 'Buka'   },
        { action: 'dismiss', title: 'Tutup'  },
      ],
    })
  )
})

// ── Notification Click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Cari tab yang sudah terbuka
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Buka tab baru
      return self.clients.openWindow(targetUrl)
    })
  )
})

// ── Background Sync (opsional — untuk submit offline) ─────
self.addEventListener('sync', (event) => {
  if (event.tag === 'tt-sync-laporan') {
    event.waitUntil(syncPendingLaporan())
  }
})

async function syncPendingLaporan() {
  // Placeholder: implementasi sinkronisasi laporan yang pending saat offline
  console.log('[SW] Background sync: tt-sync-laporan')
}
