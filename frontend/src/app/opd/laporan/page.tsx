'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { opdApi, LaporanWawancara } from '@/lib/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  AUTO_ROUTED:      { label: 'Menunggu Aksi',  cls: 'badge-yellow' },
  DALAM_PENANGANAN: { label: 'Diproses',        cls: 'badge-primary' },
  DILIMPAHKAN:      { label: 'Dilimpahkan',     cls: 'badge-blue' },
  KOLABORASI:       { label: 'Kolaborasi',       cls: 'badge-blue' },
  SELESAI:          { label: 'Selesai',          cls: 'badge-green' },
  DITOLAK:          { label: 'Ditolak',          cls: 'badge-red' },
}

export default function OpdLaporanPage() {
  const router = useRouter()
  const [laporan, setLaporan]     = useState<LaporanWawancara[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilter] = useState('')
  const [search, setSearch]       = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await opdApi.laporan(filterStatus ? { status: filterStatus } : undefined)
      setLaporan(res.data.data || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterStatus])

  const filtered = laporan.filter(l =>
    !search ||
    l.kode_laporan.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    l.kecamatan?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content animate-fadeInUp">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>📋 Kelola Laporan</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Daftar laporan yang masuk ke instansi Anda. Klik baris laporan untuk melihat detail dan mengelolanya.
        </p>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="🔍 Cari kode, nama pelapor, kecamatan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, marginBottom: 0 }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { v: '',                 l: 'Semua' },
            { v: 'AUTO_ROUTED',      l: 'Menunggu Aksi' },
            { v: 'DALAM_PENANGANAN', l: 'Diproses' },
            { v: 'KOLABORASI',       l: 'Kolaborasi' },
            { v: 'SELESAI',          l: 'Selesai' },
          ].map(f => (
            <button
              key={f.v}
              className={`btn btn-sm ${filterStatus === f.v ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f.v)}
            >{f.l}</button>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div className="card">
        {/* Legend */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 10, height: 10, background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 2, display: 'inline-block' }} />
            Belum diproses instansi Anda
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 10, height: 10, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 2, display: 'inline-block' }} />
            Sudah diproses
          </span>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <p>Tidak ada laporan dengan filter ini</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kode Laporan</th>
                  <th>Pelapor</th>
                  <th>Kesimpulan</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Deadline</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const cfg = STATUS_CFG[l.status_laporan] || { label: l.status_laporan, cls: 'badge-gray' }
                  const deadline = l.deadline_selesai ? new Date(l.deadline_selesai) : null
                  const isOverdue = l.status_sla === 'OVERDUE'
                  const belumDiproses = !l.log_tindak_lanjut || l.log_tindak_lanjut.length === 0
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
                      <td>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{l.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{l.user?.role}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                        {[l.kelurahan, l.kecamatan].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                      <td>
                        <span className={`sla-badge ${isOverdue ? 'overdue' : 'on-time'}`}>
                          {isOverdue ? '🔴 Terlambat' : '🟢 Tepat'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: isOverdue ? 'var(--danger)' : 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                        {deadline ? format(deadline, 'dd MMM HH:mm', { locale: localeId }) : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => router.push(`/opd/laporan/${l.id}`)}
                        >
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

      {/* Jumlah hasil */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--gray-400)', textAlign: 'right' }}>
          Menampilkan {filtered.length} laporan
        </div>
      )}
    </div>
  )
}
