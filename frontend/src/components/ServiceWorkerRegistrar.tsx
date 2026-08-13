'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope)

        // Cek update service worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Ada versi baru — bisa tampilkan toast "Update tersedia"
              console.log('[SW] Update tersedia. Refresh untuk mendapatkan versi terbaru.')
            }
          })
        })
      })
      .catch((err) => console.warn('[SW] Registration failed:', err))
  }, [])

  return null
}
