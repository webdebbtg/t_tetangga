'use client'

import { useState, useEffect, useCallback } from 'react'
import { pushApi } from '@/lib/api'

type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

// Helper: konversi VAPID public key ke Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const arr     = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr.buffer
}

export function usePushNotification() {
  const [state, setState] = useState<PushState>('loading')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // Daftarkan service worker dan cek status subscription saat mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setSubscription(existing)
        setState('subscribed')
      } else {
        const perm = Notification.permission
        if (perm === 'denied') setState('denied')
        else setState('unsubscribed')
      }
    }).catch(() => setState('unsupported'))
  }, [])

  // Subscribe
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey || vapidKey === 'your_vapid_public_key_here') {
        // Mode dev tanpa VAPID key — simulasi saja
        console.warn('[Push] VAPID key belum diatur. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY di .env.local')
        setState('subscribed')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      setSubscription(sub)
      await pushApi.subscribe(sub.toJSON() as PushSubscriptionJSON)
      setState('subscribed')
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') setState('denied')
      else setState('unsubscribed')
      console.error('[Push] Subscribe gagal:', err)
    }
  }, [])

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    setState('loading')
    try {
      await subscription.unsubscribe()
      await pushApi.unsubscribe()
      setSubscription(null)
      setState('unsubscribed')
    } catch (err) {
      console.error('[Push] Unsubscribe gagal:', err)
      setState('subscribed')
    }
  }, [subscription])

  return { state, subscribe, unsubscribe }
}
