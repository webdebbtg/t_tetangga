'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { observasiApi, LaporanWawancara } from '@/lib/api'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-gray', icon: '📝' },
  MENUNGGU_VERIFIKASI_GURU: { label: 'Menunggu Guru', cls: 'badge-yellow', icon: '⏳' },
  TERVERIFIKASI: { label: 'Terverifikasi', cls: 'badge-blue', icon: '✅' },
  AUTO_ROUTED: { label: 'Diteruskan OPD', cls: 'badge-blue', icon: '📨' },
  DALAM_PENANGANAN: { label: 'Diproses', cls: 'badge-primary', icon: '⚙️' },
  DILIMPAHKAN: { label: 'Dilimpahkan', cls: 'badge-yellow', icon: '↗️' },
  KOLABORASI: { label: 'Kolaborasi', cls: 'badge-blue', icon: '🤝' },
  SELESAI: { label: 'Selesai', cls: 'badge-green', icon: '🎉' },
  DITOLAK: { label: 'Ditolak', cls: 'badge-red', icon: '❌' },
}

export default function LaporanPage() {
  const router = useRouter()
  const [laporan, setLaporan] = useState<LaporanWawancara[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<any>(null)
  const [page, setPage] = useState(1)

  const fetchLaporan = async (p = 1) => {
    setLoading(true)
    try {
      const res = await observasiApi.index({ page: p, per_page: 10 })
      setLaporan(res.data.data)
      setMeta(res.data.meta || res.data)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchLaporan(page) }, [page])

  return (
    <div className="page-content">
      <div className="animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem' }}>📂 Laporan Saya</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Pantau status semua laporan observasi yang telah Anda buat.</p>
        </div>
        <Link href="/observasi" className="btn btn-primary">+ Buat Laporan</Link>
      </div>

      <div className="card animate-fadeInUp">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
          </div>
        ) : laporan.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Belum ada laporan</h3>
            <p style={{ marginBottom: '1.5rem' }}>Mulai buat laporan observasi kondisi sosial di sekitar Anda.</p>
            <Link href="/observasi" className="btn btn-primary">Buat Laporan Pertama</Link>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode Laporan</th>
                    <th>Kesimpulan</th>
                    <th>Lokasi</th>
                    <th>OPD Tujuan</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Poin</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.map(l => {
                    const cfg = STATUS_CONFIG[l.status_laporan] || { label: l.status_laporan, cls: 'badge-gray', icon: '📋' }
                    return (
                      <tr key={l.id}>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--primary-dark)' }}>
                            {l.kode_laporan}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                          {[l.kelurahan, l.kecamatan].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {l.opd_tujuan ? (
                            <span className="badge badge-primary">{l.opd_tujuan.singkatan}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                        </td>
                        <td>
                          <span className={`sla-badge ${l.status_sla === 'OVERDUE' ? 'overdue' : 'on-time'}`}>
                            {l.status_sla === 'OVERDUE' ? '🔴 Terlambat' : '🟢 Tepat Waktu'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {l.poin_kegiatan != null
                            ? <span style={{ fontWeight: 800, color: '#7C3AED' }}>⭐ {l.poin_kegiatan}</span>
                            : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                          {l.submitted_at ? format(new Date(l.submitted_at), 'dd MMM yyyy', { locale: localeId }) : '—'}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/laporan/${l.id}`)}>
                            Detail →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="pagination" style={{ padding: '1rem' }}>
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
