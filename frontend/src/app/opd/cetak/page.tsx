'use client'

import { useEffect, useState } from 'react'
import { opdApi, LaporanWawancara } from '@/lib/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const STATUS_LABEL: Record<string, string> = {
  AUTO_ROUTED:              'Menunggu Aksi',
  DALAM_PENANGANAN:         'Diproses',
  DILIMPAHKAN:              'Dilimpahkan',
  KOLABORASI:               'Kolaborasi',
  SELESAI:                  'Selesai',
  DITOLAK:                  'Ditolak',
}

export default function OpdCetakPage() {
  const [laporan,   setLaporan]   = useState<LaporanWawancara[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filterStatus, setFilter] = useState('')

  useEffect(() => {
    opdApi.laporan(filterStatus ? { status: filterStatus } : undefined)
      .then(res => setLaporan(res.data.data || []))
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        // Auto-print jika dibuka dari tombol cetak (tab baru)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          if (params.get('print') === '1') {
            setTimeout(() => window.print(), 1200)
          }
        }
      })
  }, [filterStatus])

  const printNow = () => {
    // Buka di tab baru dengan flag auto-print
    const params = filterStatus ? `?status=${filterStatus}&print=1` : '?print=1'
    window.open(window.location.pathname + params, '_blank')
  }

  return (
    <>
      <div className="page-content" style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Toolbar — tersembunyi saat print */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>🖨️ Cetak Laporan</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Pilih filter lalu cetak atau simpan sebagai PDF.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilter(e.target.value)}
              style={{ marginBottom: 0, minWidth: 160 }}
            >
              <option value="">Semua Status</option>
              <option value="AUTO_ROUTED">Menunggu Aksi</option>
              <option value="DALAM_PENANGANAN">Diproses</option>
              <option value="KOLABORASI">Kolaborasi</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
            <button className="btn btn-primary" onClick={printNow} disabled={loading || laporan.length === 0}>
              🖨️ Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* Area yang dicetak */}
        <div id="print-area">
          {/* Kop surat print */}
          <div className="print-only" style={{ display: 'none', marginBottom: '1.5rem', borderBottom: '2px solid #333', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>TENGOK TETANGGA</div>
              <div style={{ color: '#555', fontSize: '0.9rem' }}>Kota Bontang</div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>
              Rekap Laporan — Dicetak pada {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}
              {filterStatus && ` · Filter: ${STATUS_LABEL[filterStatus] || filterStatus}`}
            </div>
          </div>

          {loading ? (
            <div className="no-print" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
            </div>
          ) : laporan.length === 0 ? (
            <div className="no-print" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
              <p>Tidak ada laporan dengan filter ini</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>No</th>
                      <th>Kode</th>
                      <th>Pelapor</th>
                      <th>Kesimpulan</th>
                      <th>Lokasi</th>
                      <th>Kategori</th>
                      <th>Status</th>
                      <th>SLA</th>
                      <th>Tgl Submit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.map((l, idx) => (
                      <tr key={l.id}>
                        <td style={{ textAlign: 'center', color: 'var(--gray-400)' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-dark)', whiteSpace: 'nowrap' }}>{l.kode_laporan}</td>
                        <td>{l.user?.name || '—'}</td>
                        <td>{l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}</td>
                        <td>{[l.kelurahan, l.kecamatan].filter(Boolean).join(', ') || '—'}</td>
                        <td>{l.kategori_urusan || '—'}</td>
                        <td>{STATUS_LABEL[l.status_laporan] || l.status_laporan}</td>
                        <td style={{ color: l.status_sla === 'OVERDUE' ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                          {l.status_sla === 'OVERDUE' ? 'Terlambat' : 'Tepat'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {l.submitted_at ? format(new Date(l.submitted_at), 'dd MMM yyyy', { locale: localeId }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="no-print" style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--gray-400)', textAlign: 'right', borderTop: '1px solid var(--gray-100)' }}>
                Total: {laporan.length} laporan
              </div>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#555', textAlign: 'right', borderTop: '1px solid #ccc' }}>
                Total: {laporan.length} laporan
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar, header, #mobile-menu-btn { display: none !important; }
          div[style*="margin-left: var(--sidebar-w)"] { margin-left: 0 !important; }
          .page-content { max-width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 4px 8px; }
          th { background: #f5f5f5 !important; }
        }
      `}</style>
    </>
  )
}
