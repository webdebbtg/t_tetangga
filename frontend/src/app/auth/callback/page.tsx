'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

function CallbackContent() {
  const params = useSearchParams()
  const { setToken, refreshUser, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const token = params.get('token')
    const isNew = params.get('new_user') === '1'

    if (!token) {
      router.replace('/login?error=oauth_failed')
      return
    }

    // Simpan token lalu muat data user
    setToken(token).then(() => {
      if (isNew) {
        router.replace('/profil/lengkapi')
      } else {
        // Since setToken calls refreshUser, user state should be updated, but due to React state closure,
        // we might not have it immediately. Let's do a direct API call or just redirect to /dashboard and let
        // a layout guard handle it, OR we can fetch here:
        authApi.me().then(res => {
          const role = res.data.user.role;
          if (role === 'admin') router.replace('/admin/dashboard')
          else if (role === 'opd') router.replace('/opd/dashboard')
          else if (role === 'guru') router.replace('/guru/laporan')
          else router.replace('/dashboard')
        }).catch(() => router.replace('/dashboard'))
      }
    }).catch(() => {
      router.replace('/login?error=oauth_failed')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 50%, #FEF08A 100%)',
    }}>
      {/* Logo */}
      <img
        src="/logo.png?v=3"
        alt="Tengok Tetangga"
        width={96}
        height={96}
        style={{ display: 'block', objectFit: 'contain', animation: 'pulse 2s ease-in-out infinite' }}
      />

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, color: '#3D2B00', marginBottom: '0.375rem', fontSize: '1.25rem' }}>
          Menyiapkan Akun Anda...
        </h2>
        <p style={{ color: '#4A3300', opacity: 0.65, fontSize: '0.9rem' }}>Harap tunggu sebentar</p>
      </div>

      {/* Spinner */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(255,194,0,0.25)',
        borderTopColor: '#FFC200',
        animation: 'spin 0.8s linear infinite',
      }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#FEFCE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,194,0,0.25)', borderTopColor: '#FFC200', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
