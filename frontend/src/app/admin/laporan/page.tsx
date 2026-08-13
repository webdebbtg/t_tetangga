'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, LaporanWawancara } from '@/lib/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-gray' },
  MENUNGGU_VERIFIKASI_GURU: { label: 'Menunggu Guru', cls: 'badge-yellow' },
  TERVERIFIKASI: { label: 'Terverifikasi', cls: 'badge-blue' },
  AUTO_ROUTED: { label: 'Diteruskan', cls: 'badge-blue' },
  DALAM_PENANGANAN: { label: 'Diproses', cls: 'badge-primary' },
  DILIMPAHKAN: { label: 'Dilimpahkan', cls: 'badge-yellow' },
  KOLABORASI: { label: 'Kolaborasi', cls: 'badge-blue' },
  SELESAI: { label: 'Selesai', cls: 'badge-green' },
  DITOLAK: { label: 'Ditolak', cls: 'badge-red' },
}

export default function AdminLaporanPage() {
  const router = useRouter()
  const [laporan, setLaporan] = useState<LaporanWawancara[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    status: '', kategori: '', sla: '', kecamatan: '', search: '',
  })

  const fetchLaporan = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, per_page: 15 }
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await adminApi.laporan(params)
      setLaporan(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch { } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchLaporan(page) }, [page, filters])

  const handleEkspor = async (format_: 'excel' | 'pdf') => {
    setExporting(true)
    try {
      const res = await adminApi.ekspor({ format: format_, mask_nik: true })
      const mimeType = format_ === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
      const blob = new Blob([res.data], { type: mimeType })
      const url  = URL.createObjectURL(blob)

      if (format_ === 'pdf') {
        // PDF: buka di tab baru agar bisa dilihat sebelum disimpan
        const tab = window.open(url, '_blank')
        if (!tab) toast.error('Pop-up diblokir browser. Izinkan pop-up untuk membuka PDF.')
        else {
          toast.success('✅ PDF siap dilihat di tab baru')
          // Revoke URL setelah delay agar tab sempat membaca blob
          setTimeout(() => URL.revokeObjectURL(url), 60_000)
        }
      } else {
        // Excel: langsung download
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-tengok-tetangga-${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('✅ File Excel berhasil diunduh')
      }
    } catch {
      toast.error('Gagal mengekspor laporan')
    } finally { setExporting(false) }
  }

  // Edit / Delete State
  const [opdOpts, setOpdOpts] = useState<any[]>([])
  const [editingReport, setEditingReport] = useState<LaporanWawancara | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.opdList().then(res => setOpdOpts(res.data.opd || []))
  }, [])

  const handleEdit = (lap: LaporanWawancara) => {
    setEditingReport(lap)
    setEditForm({
      status_laporan: lap.status_laporan,
      kategori_urusan: lap.kategori_urusan,
      opd_tujuan_id: lap.opd_tujuan_id || ''
    })
  }

  const submitEdit = async () => {
    if (!editingReport) return
    setSaving(true)
    try {
      const payload = { ...editForm }
      if (!payload.opd_tujuan_id) payload.opd_tujuan_id = null
      await adminApi.updateLaporan(editingReport.id, payload)
      toast.success('Laporan berhasil diperbarui')
      setEditingReport(null)
      fetchLaporan(page)
    } catch (e: any) {
      toast.error('Gagal menyimpan laporan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await adminApi.deleteLaporan(id)
      toast.success('Laporan berhasil dihapus')
      fetchLaporan(page)
    } catch (e: any) {
      toast.error('Gagal menghapus laporan')
    }
  }

  const KATEGORI_OPTS = ['EKONOMI', 'KESEHATAN', 'PERMUKIMAN', 'PENDIDIKAN']

  return (
    <div className="page-content">
      {/* Header */}
      <div className="animate-fadeInUp" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>📂 Semua Laporan</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Pantau dan kelola seluruh laporan dari semua pengguna.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => handleEkspor('excel')} disabled={exporting}>
            {exporting ? <div className="spinner spinner-dark" /> : '📊'} Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleEkspor('pdf')} disabled={exporting}>
            {exporting ? <div className="spinner spinner-dark" /> : '📄'} PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <input
            className="form-input"
            placeholder="🔍 Cari kode/pelapor..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
          <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="form-select" value={filters.kategori} onChange={e => setFilters(p => ({ ...p, kategori: e.target.value }))}>
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTS.map(k => <option key={k}>{k}</option>)}
          </select>
          <select className="form-select" value={filters.sla} onChange={e => setFilters(p => ({ ...p, sla: e.target.value }))}>
            <option value="">Semua SLA</option>
            <option value="ON_TIME">🟢 Tepat Waktu</option>
            <option value="OVERDUE">🔴 Melewati SLA</option>
          </select>
          <input
            className="form-input"
            placeholder="Kecamatan..."
            value={filters.kecamatan}
            onChange={e => setFilters(p => ({ ...p, kecamatan: e.target.value }))}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', kategori: '', sla: '', kecamatan: '', search: '' }); setPage(1) }}>
            ✕ Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card animate-fadeInUp">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
        ) : laporan.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <p>Tidak ada laporan ditemukan dengan filter ini</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Pelapor</th>
                    <th>Kesimpulan</th>
                    <th>OPD Tujuan</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.map(l => {
                    const cfg = STATUS_CFG[l.status_laporan] || { label: l.status_laporan, cls: 'badge-gray' }

                    // Kumpulkan semua OPD: utamakan opd_list (multi), fallback ke opd_tujuan
                    const opdList: { singkatan: string; nama: string }[] =
                      (l.opd_list && l.opd_list.length > 0)
                        ? l.opd_list.map((o: any) => ({ singkatan: o.singkatan || o.nama, nama: o.nama }))
                        : l.opd_tujuan
                          ? [{ singkatan: l.opd_tujuan.singkatan || l.opd_tujuan.nama, nama: l.opd_tujuan.nama }]
                          : []

                    return (
                      <tr key={l.id}>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--primary-dark)' }}>
                            {l.kode_laporan}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.user?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{l.user?.role}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem', maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}
                          </div>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          {opdList.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {opdList.map((o, i) => (
                                <span
                                  key={i}
                                  className="badge badge-blue"
                                  title={o.nama}
                                  style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                >
                                  {o.singkatan}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>—</span>
                          )}
                        </td>
                        <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                        <td>
                          <span className={`sla-badge ${l.status_sla === 'OVERDUE' ? 'overdue' : 'on-time'}`} style={{ fontSize: '0.7rem' }}>
                            {l.status_sla === 'OVERDUE' ? '🔴' : '🟢'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                          {l.submitted_at ? format(new Date(l.submitted_at), 'dd/MM/yy', { locale: localeId }) : '—'}
                        </td>
                        <td style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/laporan/${l.id}`)} title="Detail">
                            👁️
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(l)} title="Edit">
                            ✏️
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(l.id)} title="Hapus" style={{ color: 'var(--danger)' }}>
                            🗑️
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
                <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Halaman {page} dari {meta.last_page}
                </span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
                <button className="page-btn" onClick={() => setPage(meta.last_page)} disabled={page === meta.last_page}>»</button>
              </div>
            )}

            {/* Info count */}
            {meta && (
              <div style={{ padding: '0 1rem 0.875rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                Menampilkan {laporan.length} dari {meta.total} laporan
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fadeInUp" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>✏️ Edit Laporan #{editingReport.id}</h3>
              <button className="btn btn-ghost" onClick={() => setEditingReport(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Kategori Urusan</label>
                <select className="form-select" value={editForm.kategori_urusan || ''} onChange={e => setEditForm({ ...editForm, kategori_urusan: e.target.value })}>
                  <option value="">Pilih...</option>
                  {KATEGORI_OPTS.map(k => <option key={k} value={k}>{k}</option>)}
                  <option value="UMUM">UMUM</option>
                  <option value="SOSIAL">SOSIAL</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status Laporan</label>
                <select className="form-select" value={editForm.status_laporan || ''} onChange={e => setEditForm({ ...editForm, status_laporan: e.target.value })}>
                  {Object.keys(STATUS_CFG).map(k => <option key={k} value={k}>{STATUS_CFG[k].label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">OPD Tujuan</label>
                <select className="form-select" value={editForm.opd_tujuan_id || ''} onChange={e => setEditForm({ ...editForm, opd_tujuan_id: e.target.value })}>
                  <option value="">— Tidak Ada OPD Tujuan —</option>
                  {opdOpts.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setEditingReport(null)}>Batal</button>
              <button className="btn btn-primary" onClick={submitEdit} disabled={saving}>
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-backdrop {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 999;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .modal-content {
          background: white; border-radius: 12px; width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-100);
        }
        .modal-body { padding: 1.5rem; }
      `}</style>
    </div>
  )
}
