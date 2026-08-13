'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { guruApi } from '@/lib/api'

interface GuruDashboard {
  menunggu_verifikasi: number
  total_laporan_selesai: number
  total_siswa_aktif: number
}

export default function GuruDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<GuruDashboard | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user?.role !== 'guru') {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || user.role !== 'guru') return
    
    guruApi.dashboard()
      .then(res => {
        setData(res.data)
        setLoadingData(false)
      })
      .catch(err => {
        console.error(err)
        setError('Gagal mengambil data dashboard guru')
        setLoadingData(false)
      })
  }, [user])

  if (loading || loadingData) {
    return (
      <div className="layout-content container">
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 40, height: 40, border: '3px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Memuat dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="layout-content container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ margin: 0, color: 'var(--gray-900)' }}>Dashboard Guru</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--gray-500)', fontSize: '0.9375rem' }}>
            Pantau aktivitas dan laporan dari siswa Anda
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Card 1 */}
          <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--warning-subtle)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              ⏳
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '0.25rem' }}>
                Menunggu Verifikasi
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
                {data.menunggu_verifikasi}
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--success-subtle)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              ✅
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '0.25rem' }}>
                Laporan Selesai
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
                {data.total_laporan_selesai}
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '0.25rem' }}>
                Total Siswa Lulus Assessment
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
                {data.total_siswa_aktif}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
