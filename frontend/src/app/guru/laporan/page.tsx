'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { guruApi, LaporanWawancara, publik, Opd } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function GuruLaporanPage() {
  const router = useRouter()
  const [laporan, setLaporan] = useState<LaporanWawancara[]>([])
  const [allOpd, setAllOpd] = useState<Opd[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LaporanWawancara | null>(null)
  const [poinSelected, setPoinSelected] = useState<LaporanWawancara | null>(null)
  const [verForm, setVerForm] = useState<{ aksi: string; catatan: string; opd_ids: number[] }>({ aksi: '', catatan: '', opd_ids: [] })
  const [poinForm, setPoinForm] = useState({ poin: 80, catatan: '' })
  const [processing, setProcessing] = useState(false)
  const [tab, setTab] = useState<'menunggu' | 'selesai'>('menunggu')

  const fetchLaporan = async () => {
    setLoading(true)
    try {
      const status = tab === 'menunggu' ? 'MENUNGGU_VERIFIKASI_GURU' : 'SELESAI'
      const [resLaporan, resOpd] = await Promise.all([
        guruApi.laporanSiswa({ status }),
        allOpd.length === 0 ? publik.opd() : Promise.resolve(null)
      ])
      setLaporan(resLaporan.data.data || [])
      if (resOpd) setAllOpd(resOpd.data.opd || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchLaporan() }, [tab])

  const handleVerifikasi = async () => {
    if (!selected || !verForm.aksi) return
    setProcessing(true)
    try {
      await guruApi.verifikasi(selected.id, verForm)
      toast.success(verForm.aksi === 'SETUJUI' ? '✅ Laporan disetujui dan diteruskan ke OPD!' : '❌ Laporan ditolak.')
      setSelected(null)
      fetchLaporan()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal')
    } finally { setProcessing(false) }
  }

  const handleInputPoin = async () => {
    if (!poinSelected) return
    setProcessing(true)
    try {
      await guruApi.inputPoin(poinSelected.id, { poin: poinForm.poin, catatan: poinForm.catatan })
      toast.success(`⭐ Poin ${poinForm.poin} berhasil diberikan!`)
      setPoinSelected(null)
      fetchLaporan()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal')
    } finally { setProcessing(false) }
  }

  return (
    <div className="page-content">
      <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>✅ Verifikasi Laporan Siswa</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Tinjau dan verifikasi laporan observasi dari siswa di sekolah Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="animate-fadeInUp" style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: 'white', padding: '0.375rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-100)', width: 'fit-content' }}>
        <button className={`btn btn-sm ${tab === 'menunggu' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('menunggu')}>⏳ Menunggu Verifikasi</button>
        <button className={`btn btn-sm ${tab === 'selesai' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('selesai')}>🎉 Selesai - Input Poin</button>
      </div>

      <div className="card animate-fadeInUp">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
        ) : laporan.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{tab === 'menunggu' ? '📭' : '🎉'}</div>
            <p>{tab === 'menunggu' ? 'Tidak ada laporan yang menunggu verifikasi' : 'Belum ada laporan selesai'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Siswa</th>
                  <th>Kelas</th>
                  <th>Kesimpulan</th>
                  <th>Kondisi</th>
                  <th>Foto</th>
                  <th>Tanggal Submit</th>
                  {tab === 'selesai' && <th>Poin</th>}
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {laporan.map(l => (
                  <tr key={l.id}>
                    <td><span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--primary-dark)' }}>{l.kode_laporan}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{l.user?.sekolah?.nama}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{l.user?.kelas || '—'}</td>
                    <td><span style={{ fontSize: '0.85rem' }}>{l.kesimpulan_otomatis?.replace(/_/g, ' ') || '—'}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                        {l.skor_akhir > 0 ? `${l.skor_akhir} kondisi` : '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{l.dokumentasi_foto?.length || 0} foto</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                      {l.submitted_at ? format(new Date(l.submitted_at), 'dd MMM yyyy HH:mm', { locale: localeId }) : '—'}
                    </td>
                    {tab === 'selesai' && (
                      <td>
                        {l.poin_kegiatan != null
                          ? <span style={{ fontWeight: 800, color: '#7C3AED' }}>⭐ {l.poin_kegiatan}</span>
                          : <span className="badge badge-yellow">Belum</span>}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => router.push(`/laporan/${l.id}`)}>
                          Detail
                        </button>
                        {tab === 'menunggu' && (
                          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/laporan/${l.id}`)}>
                            Tinjau
                          </button>
                        )}
                        {tab === 'selesai' && l.poin_kegiatan == null && (
                          <button className="btn btn-sm" style={{ background: '#7C3AED', color: 'white' }} onClick={() => { setPoinSelected(l); setPoinForm({ poin: 80, catatan: '' }) }}>
                            ⭐ Beri Poin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Verifikasi dipindahkan ke halaman detail laporan */}

      {/* Modal Input Poin */}
      {poinSelected && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>⭐ Input Poin Kegiatan</h3>
              <button onClick={() => setPoinSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⭐</div>
                <div style={{ fontWeight: 700 }}>{poinSelected.user?.name}</div>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{poinSelected.kode_laporan}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Poin Kegiatan (1-100) <span>*</span></label>
                <input className="form-input" type="number" min={1} max={100} value={poinForm.poin}
                  onChange={e => setPoinForm(p => ({ ...p, poin: Number(e.target.value) }))} style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: 800 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" rows={2} value={poinForm.catatan} onChange={e => setPoinForm(p => ({ ...p, catatan: e.target.value }))} placeholder="Catatan untuk siswa..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPoinSelected(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleInputPoin} disabled={processing} style={{ background: '#7C3AED' }}>
                {processing ? <><div className="spinner" /> Menyimpan...</> : '⭐ Berikan Poin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
