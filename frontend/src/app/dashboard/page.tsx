'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { observasiApi, LaporanWawancara } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-gray' },
  MENUNGGU_VERIFIKASI_GURU: { label: 'Menunggu Guru', cls: 'badge-yellow' },
  TERVERIFIKASI: { label: 'Terverifikasi', cls: 'badge-blue' },
  AUTO_ROUTED: { label: 'Diteruskan', cls: 'badge-blue' },
  DALAM_PENANGANAN: { label: 'Diproses', cls: 'badge-primary' },
  SELESAI: { label: 'Selesai', cls: 'badge-green' },
  DITOLAK: { label: 'Ditolak', cls: 'badge-red' },
}

export default function DashboardPage() {
  const { user, sudahLulus } = useAuth()
  const router = useRouter()
  const [laporanList, setLaporanList] = useState<LaporanWawancara[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sudahLulus) {
      setLaporanList([])
      setLoading(false)
      return
    }
    observasiApi.index({ per_page: 5 })
      .then(res => setLaporanList(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sudahLulus])

  const cards = [
    {
      icon: '📋', label: 'Uji Kelayakan', desc: 'Jawab kuesioner penapis untuk membuka akses observasi',
      href: '/self-assessment', color: '#FFC200', bg: '#FEF9C3',
      locked: false, badge: sudahLulus ? '✓ Lulus' : null, badgeCls: 'badge-green',
    },
    {
      icon: '📝', label: 'Buat Laporan', desc: 'Laporkan kondisi sosial warga di sekitar Anda',
      href: '/observasi', color: '#16A34A', bg: '#DCFCE7',
      locked: !sudahLulus, badge: !sudahLulus ? '🔒 Terkunci' : null, badgeCls: 'badge-red',
    },
    {
      icon: '📂', label: 'Laporan Saya', desc: 'Pantau status dan progres laporan yang telah Anda buat',
      href: '/laporan', color: '#0EA5E9', bg: '#E0F2FE',
      locked: false, badge: null, badgeCls: '',
    },
    {
      icon: '🏆', label: 'Poin Kegiatan', desc: 'Lihat poin kegiatan yang Anda dapatkan dari laporan',
      href: '/laporan?tab=poin', color: '#8B5CF6', bg: '#EDE9FE',
      locked: false, badge: null, badgeCls: '', visible: user?.role === 'siswa',
    },
  ].filter(c => c.visible !== false)

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="animate-fadeInUp" style={{
        background: 'linear-gradient(135deg, #14532D, #166534, #15803D)',
        borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: '30%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>
                Selamat datang, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p style={{ opacity: 0.88, fontSize: '0.9375rem' }}>
                {sudahLulus
                  ? 'Anda sudah lulus uji kelayakan. Mulai buat laporan observasi.'
                  : 'Selesaikan uji kelayakan untuk mulai melaporkan kondisi sosial.'}
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '0.75rem 1.25rem', textAlign: 'center', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>Status</div>
              <div style={{ fontWeight: 800, fontSize: '1.0625rem' }}>
                {sudahLulus ? '✅ LULUS' : '⏳ BELUM LULUS'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((card, i) => (
          <div key={card.href} className="animate-fadeInUp card" style={{
            animationDelay: `${i * 0.08}s`, cursor: card.locked ? 'not-allowed' : 'pointer',
            opacity: card.locked ? 0.7 : 1, transition: 'all 0.2s',
          }}
            onClick={() => !card.locked && router.push(card.href)}
          >
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>{card.icon}</div>
                {card.badge && <span className={`badge ${card.badgeCls}`} style={{ fontSize: '0.7rem' }}>{card.badge}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem', color: 'var(--gray-900)' }}>{card.label}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Laporan Terbaru */}
      <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span>📂</span>
            <h3>Laporan Terbaru Anda</h3>
          </div>
          <Link href="/laporan" className="btn btn-ghost btn-sm">Lihat Semua →</Link>
        </div>
        <div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
            </div>
          ) : laporanList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
              <p>Belum ada laporan. {sudahLulus ? 'Mulai buat laporan pertama Anda!' : 'Selesaikan uji kelayakan terlebih dahulu.'}</p>
              {sudahLulus && (
                <Link href="/observasi" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Buat Laporan</Link>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Kesimpulan</th>
                    <th>OPD</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {laporanList.map(l => {
                    const cfg = STATUS_CONFIG[l.status_laporan] || { label: l.status_laporan, cls: 'badge-gray' }
                    return (
                      <tr key={l.id} onClick={() => router.push(`/laporan/${l.id}`)} style={{ cursor: 'pointer' }}>
                        <td><span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--primary-dark)' }}>{l.kode_laporan}</span></td>
                        <td><span style={{ fontSize: '0.85rem' }}>{l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}</span></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{l.opd_tujuan?.singkatan || '—'}</td>
                        <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                        <td><span className={`sla-badge ${l.status_sla === 'OVERDUE' ? 'overdue' : 'on-time'}`}>{l.status_sla === 'OVERDUE' ? '🔴 Terlambat' : '🟢 Tepat'}</span></td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                          {l.submitted_at ? formatDistanceToNow(new Date(l.submitted_at), { addSuffix: true, locale: id }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
