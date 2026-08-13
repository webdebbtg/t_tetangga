'use client'

import { useState } from 'react'
import { usePushNotification } from '@/hooks/usePushNotification'

export default function NotificationBell() {
  const { state, subscribe, unsubscribe } = usePushNotification()
  const [tooltip, setTooltip] = useState(false)

  if (state === 'unsupported') return null

  const isSubscribed  = state === 'subscribed'
  const isLoading     = state === 'loading'
  const isDenied      = state === 'denied'

  const handleClick = async () => {
    if (isLoading) return
    if (isSubscribed) await unsubscribe()
    else await subscribe()
  }

  const getTitle = () => {
    if (isDenied)     return 'Notifikasi diblokir browser — ubah izin di pengaturan'
    if (isSubscribed) return 'Notifikasi aktif — klik untuk nonaktifkan'
    return 'Aktifkan notifikasi SLA & status laporan'
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        disabled={isLoading || isDenied}
        title={getTitle()}
        aria-label={getTitle()}
        style={{
          width: 38, height: 38,
          border: `1.5px solid ${isSubscribed ? 'var(--primary-light)' : isDenied ? 'var(--danger)' : 'var(--gray-200)'}`,
          borderRadius: 10,
          background: isSubscribed ? 'var(--primary-subtle)' : 'white',
          cursor: (isLoading || isDenied) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.125rem',
          transition: 'all 0.2s',
          flexShrink: 0,
          position: 'relative',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <div style={{
            width: 16, height: 16, border: '2px solid var(--primary)',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        ) : isDenied ? '🔕' : isSubscribed ? '🔔' : '🔕'}

        {/* Titik hijau saat aktif */}
        {isSubscribed && !isLoading && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--primary)', border: '1.5px solid white',
          }} />
        )}
      </button>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#1F2937', color: 'white',
          padding: '0.5rem 0.75rem', borderRadius: 8,
          fontSize: '0.75rem', whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 200, pointerEvents: 'none',
        }}>
          {getTitle()}
          <div style={{
            position: 'absolute', bottom: '100%', right: 12,
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '5px solid #1F2937',
          }} />
        </div>
      )}
    </div>
  )
}
