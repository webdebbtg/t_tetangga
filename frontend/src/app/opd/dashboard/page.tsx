'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { opdApi, LaporanWawancara } from '@/lib/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  AUTO_ROUTED:      { label: 'Menunggu Aksi',  cls: 'badge-yellow'  },
  TERVERIFIKASI:    { label: 'Terverifikasi',   cls: 'badge-blue'    },
  DALAM_PENANGANAN: { label: 'Diproses',        cls: 'badge-primary' },
  DILIMPAHKAN:      { label: 'Dilimpahkan',     cls: 'badge-blue'    },
  KOLABORASI:       { label: 'Kolaborasi',       cls: 'badge-blue'    },
  SELESAI:          { label: 'Selesai',          cls: 'badge-green'   },
  DITOLAK:          { label: 'Ditolak',          cls: 'badge-red'     },
}

export default function OpdDashboardPage() {
  const router = useRouter()
  const [stats,   setStats]   = useState<any>(null)
  const [terbaru, setTerbaru] = useState<LaporanWawancara[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    opdApi.dashboard()
      .then(res => {
        setStats(res.data.stats)
        setTerbaru(res.data.terbaru || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = stats ? [
    { icon: '📥', label: 'Total Masuk',       value: stats.total,            color: '#0EA5E9', bg: '#E0F2FE' },
    { icon: '⏳', label: 'Menunggu Aksi',     value: stats.masuk,            color: '#FFC200', bg: '#FEF9C3' },
    { icon: '⚙️', label: 'Dalam Penanganan',  value: stats.dalam_penanganan, color: '#8B5CF6', bg: '#EDE9FE' },
    { icon: '✅', label: 'Selesai',            value: stats.selesai,          color: '#16A34A', bg: '#DCFCE7' },
    { icon: '🔴', label: 'Melewati SLA',      value: stats.overdue,          color: '#EF4444', bg: '#FEE2E2' },
  ] : []

  return (
    <div className="page-content animate-fadeInUp">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>🏛️ Dashboard OPD</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Selamat datang. Berikut ringkasan laporan yang masuk ke instansi Anda.
        </p>
      </div>

      {/* Statistik */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            {STAT_CARDS.map((c, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ background: c.bg }}>
                  <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
                </div>
                <div className="stat-info">
                  <div className="stat-value" style={{ color: c.color }}>{c.value ?? '—'}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Shortcut ke laporan yang butuh aksi */}
          {(stats?.masuk ?? 0) > 0 && (
            <div className="card animate-fadeInUp" style={{
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #FEF9C3, #FEF08A)',
              border: '1px solid #FFD740',
            }}>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#4A3300' }}>
                      {stats.masuk} laporan menunggu tindak lanjut Anda
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#3D2B00', marginTop: '0.125rem' }}>
                      Segera proses agar tidak melewati batas SLA
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: '#FFC200', color: '#1A0F00', border: 'none', whiteSpace: 'nowrap' }}
                  onClick={() => router.push('/opd/laporan?status=AUTO_ROUTED')}
                >
                  Tangani Sekarang →
                </button>
              </div>
            </div>
          )}

          {/* 5 laporan terbaru */}
          <div className="card animate-fadeInUp">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📋</span><h3>Laporan Terbaru</h3>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => router.push('/opd/laporan')}>
                Lihat Semua →
              </button>
            </div>

            {/* Legend warna */}
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 10, height: 10, background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 2, display: 'inline-block' }} />
                Belum diproses
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 10, height: 10, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'inline-block' }} />
                Sudah diproses
              </span>
            </div>

            {terbaru.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p>Belum ada laporan masuk</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Pelapor</th>
                      <th>Kesimpulan</th>
                      <th>Status</th>
                      <th>Tgl Submit</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terbaru.map(l => {
                      const belumDiproses = !l.log_tindak_lanjut || l.log_tindak_lanjut.length === 0
                      const cfg = STATUS_CFG[l.status_laporan] || { label: l.status_laporan, cls: 'badge-gray' }
                      return (
                        <tr
                          key={l.id}
                          style={{ cursor: 'pointer', background: belumDiproses ? '#FFFBEB' : undefined }}
                          onClick={() => router.push(`/opd/laporan/${l.id}`)}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              {belumDiproses && (
                                <span title="Belum diproses" style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, display: 'inline-block' }} />
                              )}
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--primary-dark)' }}>
                                {l.kode_laporan}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{l.user?.name || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}</td>
                          <td>
                            <span className={`badge ${cfg.cls}`} style={{ fontSize: '0.7rem' }}>{cfg.label}</span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                            {l.submitted_at ? format(new Date(l.submitted_at), 'dd MMM yyyy', { locale: localeId }) : '—'}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <button className="btn btn-primary btn-sm" onClick={() => router.push(`/opd/laporan/${l.id}`)}>
                              Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
