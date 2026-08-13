'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { opdApi, publik, LaporanWawancara, Opd } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

const STATUS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  AUTO_ROUTED:              { label: 'Menunggu Aksi',   cls: 'badge-yellow',  icon: '📥' },
  DALAM_PENANGANAN:         { label: 'Diproses',         cls: 'badge-primary', icon: '⚙️' },
  DILIMPAHKAN:              { label: 'Dilimpahkan',      cls: 'badge-blue',    icon: '↗️' },
  KOLABORASI:               { label: 'Kolaborasi',        cls: 'badge-blue',    icon: '🤝' },
  SELESAI:                  { label: 'Selesai',           cls: 'badge-green',   icon: '✅' },
  DITOLAK:                  { label: 'Ditolak',           cls: 'badge-red',     icon: '❌' },
  TERVERIFIKASI:            { label: 'Terverifikasi',     cls: 'badge-blue',    icon: '✅' },
  MENUNGGU_VERIFIKASI_GURU: { label: 'Menunggu Guru',    cls: 'badge-yellow',  icon: '⏳' },
}

const AKSI_OPTS = [
  { value: 'PROSES',     label: '⚙️ Mulai Proses',          color: '#0EA5E9' },
  { value: 'LIMPAHKAN',  label: '↗️ Limpahkan ke OPD Lain', color: '#FFC200' },
  { value: 'KOLABORASI', label: '🤝 Kolaborasi',             color: '#8B5CF6' },
  { value: 'SELESAI',    label: '✅ Tandai Selesai',         color: '#16A34A' },
  { value: 'TOLAK',      label: '❌ Tolak',                  color: '#EF4444' },
  { value: 'CATATAN',    label: '📝 Tambah Catatan',         color: '#6B7280' },
]

export default function OpdDetailLaporanPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuth()

  const [laporan,       setLaporan]       = useState<LaporanWawancara | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [fotoIdx,       setFotoIdx]       = useState(0)
  const [opdList,       setOpdList]       = useState<Opd[]>([])
  const [aksiForm,      setAksiForm]      = useState<{ aksi: string; keterangan: string; opd_limpah_id: string; opd_kolaborasi_ids: number[] }>({ aksi: '', keterangan: '', opd_limpah_id: '', opd_kolaborasi_ids: [] })
  const [processing,    setProcessing]    = useState(false)
  const [showSelesaiModal, setShowSelesaiModal] = useState(false)
  const [batalProcessing,  setBatalProcessing]  = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      opdApi.show(Number(id)),
      publik.opd(),
    ]).then(([lRes, opdRes]) => {
      setLaporan(lRes.data.laporan)
      setOpdList(opdRes.data.opd || [])
    }).catch(() => router.push('/opd/laporan'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAksi = async () => {
    if (!laporan || !aksiForm.aksi) return
    if (aksiForm.aksi === 'KOLABORASI' && aksiForm.opd_kolaborasi_ids.length === 0) {
      toast.error('Pilih minimal 1 OPD untuk berkolaborasi')
      return
    }
    setProcessing(true)
    try {
      const res = await opdApi.aksi(laporan.id, {
        aksi: aksiForm.aksi,
        keterangan: aksiForm.keterangan || undefined,
        opd_limpah_id: aksiForm.opd_limpah_id ? Number(aksiForm.opd_limpah_id) : undefined,
        opd_kolaborasi_ids: aksiForm.aksi === 'KOLABORASI' ? aksiForm.opd_kolaborasi_ids : undefined,
      })
      setLaporan(res.data.laporan)
      setAksiForm({ aksi: '', keterangan: '', opd_limpah_id: '', opd_kolaborasi_ids: [] })
      if (aksiForm.aksi === 'SELESAI') {
        setShowSelesaiModal(true)
      } else {
        toast.success('Aksi berhasil dicatat')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.response?.data?.errors?.opd_kolaborasi_ids?.[0] || 'Gagal menyimpan aksi')
    } finally { setProcessing(false) }
  }

  const handleBatalSelesai = async () => {
    if (!laporan) return
    setBatalProcessing(true)
    try {
      const res = await opdApi.aksi(laporan.id, { aksi: 'BATAL_SELESAI' })
      setLaporan(res.data.laporan)
      toast.success('Status selesai dibatalkan. Anda dapat mengisi tindak lanjut kembali.')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal membatalkan status selesai')
    } finally { setBatalProcessing(false) }
  }

  const toggleKolaborasiOpd = (opdId: number) => {
    setAksiForm(prev => ({
      ...prev,
      opd_kolaborasi_ids: prev.opd_kolaborasi_ids.includes(opdId)
        ? prev.opd_kolaborasi_ids.filter(id => id !== opdId)
        : [...prev.opd_kolaborasi_ids, opdId],
    }))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
    </div>
  )
  if (!laporan) return null

  const cfg      = STATUS_CFG[laporan.status_laporan] || { label: laporan.status_laporan, cls: 'badge-gray', icon: '📋' }
  const isOverdue = laporan.status_sla === 'OVERDUE'
  const deadline  = laporan.deadline_selesai ? new Date(laporan.deadline_selesai) : null
  const hasFoto   = laporan.dokumentasi_foto && laporan.dokumentasi_foto.length > 0

  // Cek apakah OPD ini (user login) sudah tandai selesai via pivot selesai_at
  const myOpdEntry = laporan.opd_list?.find((o: any) => o.id === user?.opd_id)
  const myOpdSudahSelesai = !!(myOpdEntry as any)?.pivot?.selesai_at

  // Progress selesai: berapa OPD sudah selesai vs total
  const totalOpd   = laporan.opd_list?.length ?? 0
  const selesaiOpd = laporan.opd_list?.filter((o: any) => !!(o as any).pivot?.selesai_at).length ?? 0

  // Form aksi tidak tersedia jika: ditolak, atau OPD ini sudah selesai, atau laporan global selesai
  const sudahSelesai = laporan.status_laporan === 'DITOLAK' || myOpdSudahSelesai || laporan.status_laporan === 'SELESAI'

  return (
    <>
      <div className="page-content" style={{ maxWidth: 960, margin: '0 auto' }} id="print-area">

        {/* Kop surat — HANYA tampil saat print */}
        <div id="print-header" style={{ display: 'none' }}>
          <div className="print-logo">🏘️</div>
          <div>
            <div className="print-title">Tengok Tetangga — Kota Bontang</div>
            <div className="print-subtitle">Sistem Pelaporan Kesejahteraan Warga</div>
          </div>
          <div className="print-meta">
            <div className="print-kode">{laporan.kode_laporan}</div>
            <div>Dicetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Toolbar — tersembunyi saat print */}
        <div id="web-header-bar" className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/opd/laporan')}>
            ← Kembali ke Daftar
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>

        {/* Header laporan */}
        <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #3D2B00, #8B6800)', padding: '1.5rem 2rem', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', letterSpacing: '0.08em' }}>KODE LAPORAN</div>
                <div style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.5rem' }}>{laporan.kode_laporan}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span className={`badge ${cfg.cls}`} style={{ padding: '0.375rem 0.875rem', fontSize: '0.875rem' }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className={`sla-badge ${isOverdue ? 'overdue' : 'on-time'}`}>
                  {isOverdue ? '🔴 Melewati SLA' : '🟢 Tepat Waktu'}
                </span>
              </div>
            </div>
            {laporan.kesimpulan_otomatis && (
              <div style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: 8,
                padding: '0.75rem 1.125rem', marginTop: '1rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>🎯</span>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Kesimpulan Otomatis</div>
                  <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{laporan.kesimpulan_otomatis.replace(/_/g, ' ')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
          {/* Kolom kiri */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Info umum */}
            <div className="card">
              <div className="card-header"><span>ℹ️</span><h3>Informasi Laporan</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {/* Pelapor */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Pelapor</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{laporan.user?.name || '—'}</div>
                    {laporan.user?.role && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{laporan.user.role}</div>}
                  </div>

                  {/* OPD Tujuan — numbered list + progress */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>OPD Tujuan</div>
                    {(() => {
                      const opdItems = (laporan.opd_list && laporan.opd_list.length > 0)
                        ? laporan.opd_list
                        : (laporan.opd_tujuan || laporan.opdTujuan)
                          ? [laporan.opd_tujuan || laporan.opdTujuan]
                          : []
                      return (
                        <>
                          <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {opdItems.map((o: any, i: number) => (
                              <li key={i} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-900)', lineHeight: 1.4 }}>
                                <span>{o?.nama || '—'}</span>
                                {(o as any)?.pivot?.selesai_at && (
                                  <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#DCFCE7', color: '#15803D', borderRadius: 4, padding: '0.1rem 0.35rem', fontWeight: 700 }}>✓ Selesai</span>
                                )}
                              </li>
                            ))}
                          </ol>
                          {totalOpd > 1 && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                                <span>Progress penyelesaian</span>
                                <span style={{ fontWeight: 700, color: selesaiOpd === totalOpd ? '#15803D' : 'var(--gray-600)' }}>{selesaiOpd}/{totalOpd} OPD</span>
                              </div>
                              <div style={{ background: 'var(--gray-200)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: selesaiOpd === totalOpd ? '#16A34A' : 'var(--primary)', borderRadius: 4, width: `${totalOpd > 0 ? (selesaiOpd / totalOpd) * 100 : 0}%`, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* Kategori */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Kategori</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{laporan.kategori_urusan || '—'}</div>
                  </div>

                  {/* Lokasi */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Lokasi</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{[laporan.kelurahan, laporan.kecamatan].filter(Boolean).join(', ') || '—'}</div>
                  </div>

                  {/* Tanggal Submit */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Tanggal Submit</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {laporan.submitted_at ? format(new Date(laporan.submitted_at), 'dd MMMM yyyy HH:mm', { locale: localeId }) : '—'}
                    </div>
                  </div>

                  {/* Deadline SLA */}
                  <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Deadline SLA</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isOverdue ? 'var(--danger)' : 'var(--gray-900)' }}>
                      {deadline ? format(deadline, 'dd MMMM yyyy HH:mm', { locale: localeId }) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kondisi warga */}
            {laporan.jawaban_wawancara_detail && (
              <div className="card">
                <div className="card-header"><span>👥</span><h3>Kondisi Warga</h3></div>
                <div className="card-body">
                  <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Nama Tetangga</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{(laporan.jawaban_wawancara_detail as any).nama_tetangga || '—'}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Kondisi Ditemukan</div>
                  {((laporan.jawaban_wawancara_detail as any).kondisi || []).map((k: any, i: number) => (
                    <div key={i} style={{ background: 'var(--gray-50)', padding: '0.625rem 0.875rem', borderRadius: 8, marginBottom: '0.375rem', display: 'flex', gap: '0.625rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{k.label}</div>
                        {k.keterangan && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>Catatan: {k.keterangan}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Catatan observasi */}
            {laporan.catatan_observasi && (
              <div className="card">
                <div className="card-header"><span>📝</span><h3>Catatan Observasi</h3></div>
                <div className="card-body">
                  <p style={{ lineHeight: 1.8, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{laporan.catatan_observasi}</p>
                </div>
              </div>
            )}

            {/* Foto */}
            {hasFoto && (
              <div className="card">
                <div className="card-header"><span>📸</span><h3>Dokumentasi Foto ({laporan.dokumentasi_foto!.length})</h3></div>
                <div className="card-body">
                  <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: '0.75rem', background: '#0f172a', aspectRatio: '16/9' }}>
                    <img src={laporan.dokumentasi_foto![fotoIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {laporan.dokumentasi_foto!.map((url, i) => (
                      <button key={i} onClick={() => setFotoIdx(i)} style={{
                        width: 64, height: 64, border: `2.5px solid ${i === fotoIdx ? 'var(--primary)' : 'var(--gray-200)'}`,
                        borderRadius: 6, padding: 0, cursor: 'pointer', overflow: 'hidden', background: 'none',
                      }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Form Aksi — hanya tampil jika belum selesai */}
            {!sudahSelesai && (
              <div className="card no-print" style={{ border: '2px solid var(--primary-light)' }}>
                <div className="card-header" style={{ background: 'var(--primary-subtle)' }}>
                  <span>🎯</span>
                  <h3 style={{ color: 'var(--primary-dark)' }}>Tindak Lanjut</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Pilih Aksi <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {AKSI_OPTS.map(a => (
                        <button
                          key={a.value}
                          onClick={() => setAksiForm(p => ({ ...p, aksi: a.value }))}
                          style={{
                            padding: '0.625rem 0.875rem', borderRadius: 8, border: '2px solid',
                            borderColor: aksiForm.aksi === a.value ? a.color : 'var(--gray-200)',
                            background: aksiForm.aksi === a.value ? `${a.color}18` : 'white',
                            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                            color: aksiForm.aksi === a.value ? a.color : 'var(--gray-600)',
                            transition: 'all 0.15s', textAlign: 'left',
                          }}
                        >{a.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Pilih OPD tujuan jika LIMPAHKAN — card single-select */}
                  {aksiForm.aksi === 'LIMPAHKAN' && (
                    <div className="form-group">
                      <label className="form-label">
                        OPD Tujuan Pelimpahan <span style={{ color: 'var(--danger)' }}>*</span>
                        {aksiForm.opd_limpah_id && (
                          <span style={{ marginLeft: '0.5rem', background: '#FFC200', color: '#1A0F00', borderRadius: 20, padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                            1 dipilih
                          </span>
                        )}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 240, overflowY: 'auto', padding: '0.25rem' }}>
                        {opdList
                          .filter(o => o.id !== laporan.opd_tujuan_id)
                          .map(o => {
                            const selected = aksiForm.opd_limpah_id === String(o.id)
                            return (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setAksiForm(p => ({ ...p, opd_limpah_id: selected ? '' : String(o.id) }))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                                  padding: '0.625rem 0.875rem', borderRadius: 8,
                                  border: `2px solid ${selected ? '#FFC200' : 'var(--gray-200)'}`,
                                  background: selected ? '#FEFCE8' : 'white',
                                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                }}
                              >
                                {/* Radio indicator */}
                                <div style={{
                                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                  border: `2px solid ${selected ? '#FFC200' : 'var(--gray-300)'}`,
                                  background: selected ? '#FFC200' : 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: selected ? '#7A5500' : 'var(--gray-800)' }}>{o.nama}</div>
                                  {o.singkatan && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{o.singkatan}</div>}
                                </div>
                              </button>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}

                  {/* Pilih OPD kolaborasi — multi-select */}
                  {aksiForm.aksi === 'KOLABORASI' && (
                    <div className="form-group">
                      <label className="form-label">
                        OPD yang Diajak Kolaborasi <span style={{ color: 'var(--danger)' }}>*</span>
                        {aksiForm.opd_kolaborasi_ids.length > 0 && (
                          <span style={{ marginLeft: '0.5rem', background: '#8B5CF6', color: 'white', borderRadius: 20, padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                            {aksiForm.opd_kolaborasi_ids.length} dipilih
                          </span>
                        )}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 240, overflowY: 'auto', padding: '0.25rem' }}>
                        {opdList
                          .filter(o => o.id !== laporan.opd_tujuan_id)
                          .map(o => {
                            const checked = aksiForm.opd_kolaborasi_ids.includes(o.id)
                            return (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => toggleKolaborasiOpd(o.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                                  padding: '0.625rem 0.875rem', borderRadius: 8,
                                  border: `2px solid ${checked ? '#8B5CF6' : 'var(--gray-200)'}`,
                                  background: checked ? '#F5F3FF' : 'white',
                                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                }}
                              >
                                <div style={{
                                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                  border: `2px solid ${checked ? '#8B5CF6' : 'var(--gray-300)'}`,
                                  background: checked ? '#8B5CF6' : 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {checked && <span style={{ color: 'white', fontSize: '0.6875rem', fontWeight: 900 }}>✓</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: checked ? '#6D28D9' : 'var(--gray-800)' }}>{o.nama}</div>
                                  {o.singkatan && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{o.singkatan}</div>}
                                </div>
                              </button>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Keterangan / Catatan</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Tuliskan keterangan atau catatan tindak lanjut..."
                      value={aksiForm.keterangan}
                      onChange={e => setAksiForm(p => ({ ...p, keterangan: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setAksiForm({ aksi: '', keterangan: '', opd_limpah_id: '', opd_kolaborasi_ids: [] })}
                    >Reset</button>
                    <button
                      className="btn btn-primary"
                      onClick={handleAksi}
                      disabled={
                        !aksiForm.aksi || processing ||
                        (aksiForm.aksi === 'LIMPAHKAN' && !aksiForm.opd_limpah_id) ||
                        (aksiForm.aksi === 'KOLABORASI' && aksiForm.opd_kolaborasi_ids.length === 0)
                      }
                    >
                      {processing ? <><div className="spinner" /> Memproses...</> : '✅ Konfirmasi Aksi'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sudahSelesai && (
              <div className="card no-print" style={{
                background: laporan.status_laporan === 'DITOLAK' ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${laporan.status_laporan === 'DITOLAK' ? '#FECACA' : '#86EFAC'}`,
              }}>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>
                    {laporan.status_laporan === 'DITOLAK' ? '❌' : laporan.status_laporan === 'SELESAI' ? '🎉' : '✅'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: laporan.status_laporan === 'DITOLAK' ? '#DC2626' : '#15803D' }}>
                      {laporan.status_laporan === 'DITOLAK'
                        ? 'Laporan telah ditolak'
                        : laporan.status_laporan === 'SELESAI'
                          ? 'Semua OPD telah menyelesaikan laporan ini'
                          : 'Instansi Anda telah menandai laporan ini selesai'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      {laporan.status_laporan === 'DITOLAK'
                        ? 'Tidak ada aksi lebih lanjut yang dapat dilakukan.'
                        : laporan.status_laporan === 'SELESAI'
                          ? `Seluruh ${totalOpd} OPD terlibat telah menyelesaikan tugasnya.`
                          : `Menunggu ${totalOpd - selesaiOpd} OPD lain menyelesaikan penanganan.`}
                    </div>
                    {/* Tombol Batalkan Selesai — hanya muncul jika OPD ini sudah selesai tapi laporan belum global selesai/ditolak */}
                    {myOpdSudahSelesai && !['SELESAI', 'DITOLAK'].includes(laporan.status_laporan) && (
                      <button
                        className="btn btn-sm"
                        onClick={handleBatalSelesai}
                        disabled={batalProcessing}
                        style={{ marginTop: '0.75rem', background: 'white', border: '1.5px solid #FCA5A5', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        {batalProcessing
                          ? <><div className="spinner" style={{ borderColor: '#FCA5A5', borderTopColor: '#DC2626' }} /> Membatalkan...</>
                          : '↩️ Batalkan Selesai Laporan'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kolom kanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Peta */}
            {laporan.latitude && laporan.longitude && (
              <div className="card">
                <div className="card-header"><span>📍</span><h3>Lokasi GPS</h3></div>
                <div style={{ height: 220 }}>
                  <MapPicker lat={Number(laporan.latitude)} lng={Number(laporan.longitude)} readonly />
                </div>
                <div style={{ padding: '0.625rem 1rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                  {Number(laporan.latitude).toFixed(6)}, {Number(laporan.longitude).toFixed(6)}
                </div>
                {laporan.alamat_laporan && (
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', color: 'var(--gray-600)', borderTop: '1px solid var(--gray-100)' }}>
                    📍 {laporan.alamat_laporan}
                  </div>
                )}
              </div>
            )}

            {/* Timeline — dikelompokkan per OPD */}
            <div className="card">
              <div className="card-header"><span>🕐</span><h3>Timeline Tindak Lanjut</h3></div>
              <div className="card-body" style={{ padding: '1rem' }}>
                {laporan.log_tindak_lanjut && laporan.log_tindak_lanjut.length > 0 ? (() => {
                  // Kelompokkan log berdasarkan opd_id (atau 'system' jika tidak ada)
                  const groups: Record<string, { opdNama: string; opdSingkatan: string; logs: typeof laporan.log_tindak_lanjut; selesai: boolean }> = {}

                  laporan.log_tindak_lanjut.forEach((log: any) => {
                    const key = log.opd_id ? String(log.opd_id) : 'system'
                    const opdNama = log.opd?.nama || log.user?.opd?.nama || 'Sistem'
                    const opdSingkatan = log.opd?.singkatan || log.user?.opd?.singkatan || ''
                    if (!groups[key]) {
                      // Cek apakah OPD ini sudah selesai via pivot
                      const pivotEntry = laporan.opd_list?.find((o: any) => o.id === log.opd_id)
                      groups[key] = { opdNama, opdSingkatan, logs: [], selesai: !!(pivotEntry as any)?.pivot?.selesai_at }
                    }
                    groups[key].logs.push(log)
                  })

                  const AKSI_ICON: Record<string, string> = {
                    KOLABORASI: '🤝', LIMPAHKAN: '↗️', PROSES: '⚙️',
                    SELESAI: '✅', TOLAK: '❌', CATATAN: '📝', TERVERIFIKASI: '✅',
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {Object.entries(groups).map(([key, group]) => (
                        <div key={key}>
                          {/* Header per-OPD */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              background: group.selesai ? '#16A34A' : 'var(--primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', color: 'white', fontWeight: 800,
                            }}>
                              {group.selesai ? '✓' : group.opdSingkatan?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{group.opdNama}</span>
                              {group.opdSingkatan && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--gray-500)' }}>({group.opdSingkatan})</span>}
                            </div>
                            {group.selesai
                              ? <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#15803D', borderRadius: 4, padding: '0.15rem 0.5rem', fontWeight: 700, flexShrink: 0 }}>✓ Selesai</span>
                              : <span style={{ fontSize: '0.7rem', background: '#FEF9C3', color: '#92400E', borderRadius: 4, padding: '0.15rem 0.5rem', fontWeight: 700, flexShrink: 0 }}>Proses</span>
                            }
                          </div>

                          {/* Log entries untuk OPD ini */}
                          <div style={{ marginLeft: '0.875rem', borderLeft: '2px solid var(--gray-100)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {group.logs.map((log: any) => (
                              <div key={log.id}>
                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                  <span>{AKSI_ICON[log.aksi] || '📋'}</span>
                                  <span>{log.aksi.replace(/_/g, ' ')}</span>
                                </div>
                                {log.keterangan && (
                                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginTop: '0.2rem', lineHeight: 1.6, background: 'var(--gray-50)', borderRadius: 6, padding: '0.35rem 0.6rem' }}>
                                    {log.keterangan}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                                  {log.user?.name} · {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })() : (
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                    Belum ada tindak lanjut
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Modal Sukses Selesai */}
      {showSelesaiModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="animate-fadeInUp" style={{
            background: '#ffffff', borderRadius: 16, maxWidth: 420, width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
          }}>
            {/* Top green bar */}
            <div style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)', padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2.25rem' }}>✅</div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.3 }}>
                Tindak Lanjut Berhasil Dicatat
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9375rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                  Instansi Anda telah menandai laporan
                  <span style={{ display: 'block', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '1rem', marginTop: '0.25rem' }}>
                    {laporan.kode_laporan}
                  </span>
                  sebagai <strong>selesai ditangani</strong>.
                </div>
                {totalOpd > 1 && selesaiOpd < totalOpd && (
                  <div style={{ marginTop: '0.75rem', background: '#FEF9C3', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#92400E' }}>
                    ⏳ Masih menunggu <strong>{totalOpd - selesaiOpd} OPD lain</strong> menyelesaikan penanganan
                  </div>
                )}
                {selesaiOpd >= totalOpd && totalOpd > 0 && (
                  <div style={{ marginTop: '0.75rem', background: '#DCFCE7', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#15803D' }}>
                    🎉 Semua <strong>{totalOpd} OPD</strong> telah menyelesaikan penanganan!
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => { setShowSelesaiModal(false); router.push('/opd/dashboard') }}
                style={{ fontWeight: 700 }}
              >
                Kembali ke Dashboard
              </button>
              <button
                className="btn btn-ghost btn-full btn-sm"
                onClick={() => setShowSelesaiModal(false)}
                style={{ marginTop: '0.5rem', color: 'var(--gray-500)' }}
              >
                Tetap di halaman ini
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Footer cetak — HANYA tampil saat print */}
        <div id="print-footer" style={{ display: 'none' }}>
          Dokumen ini dicetak dari Sistem Informasi Tengok Tetangga — Pemerintah Kota Bontang.
          Kode Laporan: {laporan.kode_laporan} · {laporan.opd_tujuan?.nama || laporan.opdTujuan?.nama || ''}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
        }

        @media print {
          /* ── Sembunyikan elemen UI ── */
          .no-print,
          .sidebar,
          nav,
          header,
          #mobile-menu-btn,
          [class*="sidebar"],
          [id*="sidebar"] { display: none !important; }

          /* ── Reset layout halaman ── */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; font-size: 11pt !important; color: #111 !important; }
          body > div, main, [style*="margin-left"] { margin-left: 0 !important; padding: 0 !important; }
          .page-content { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }

          /* ── Print area ── */
          #print-area { padding: 0 !important; }

          /* ── Kop surat cetak ── */
          #print-header {
            display: flex !important;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1.5rem;
            border-bottom: 3px solid #CC9B00;
            margin-bottom: 1rem;
          }
          #print-header .print-logo {
            width: 52px; height: 52px;
            background: linear-gradient(135deg, #3D2B00, #8B6800);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 1.75rem; flex-shrink: 0;
          }
          #print-header .print-title { font-size: 13pt; font-weight: 800; color: #3D2B00; line-height: 1.2; }
          #print-header .print-subtitle { font-size: 8.5pt; color: #666; margin-top: 2px; }
          #print-header .print-meta { margin-left: auto; text-align: right; font-size: 8pt; color: #555; }
          #print-header .print-kode { font-family: monospace; font-size: 12pt; font-weight: 900; color: #7A5500; }

          /* ── Sembunyikan kop web, tampilkan kop cetak ── */
          #web-header-bar { display: none !important; }
          #print-header { display: flex !important; }

          /* ── Grid → kolom tunggal ── */
          div[style*="grid-template-columns: 1fr 320px"] {
            display: block !important;
          }
          div[style*="grid-template-columns: 1fr 320px"] > div {
            width: 100% !important;
          }

          /* ── Card ── */
          .card {
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            margin-bottom: 0.75rem !important;
            break-inside: avoid;
            box-shadow: none !important;
          }
          .card-header {
            background: #f5f5f0 !important;
            padding: 0.5rem 1rem !important;
            border-bottom: 1px solid #ddd !important;
          }
          .card-header h3 { font-size: 10pt !important; font-weight: 700 !important; }
          .card-body { padding: 0.75rem 1rem !important; }

          /* ── Header laporan (gradient) ── */
          .card div[style*="linear-gradient"] {
            background: #3D2B00 !important;
            padding: 0.875rem 1.25rem !important;
          }

          /* ── Info grid 2 kolom ── */
          div[style*="grid-template-columns: 1fr 1fr"] {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }

          /* ── Foto grid ── */
          div[style*="aspect-ratio: 16/9"] { aspect-ratio: 16/9 !important; max-height: 200px !important; }
          div[style*="display: flex"][style*="gap: 0.5rem"] img { display: none !important; }

          /* ── Peta Leaflet — paksa cetak ── */
          div[style*="height: 220px"] {
            height: 220px !important;
            min-height: 220px !important;
            display: block !important;
            overflow: hidden !important;
          }
          .leaflet-container {
            display: block !important;
            width: 100% !important;
            height: 220px !important;
            min-height: 220px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid;
          }
          .leaflet-pane,
          .leaflet-tile,
          .leaflet-marker-pane img,
          .leaflet-shadow-pane img,
          .leaflet-overlay-pane canvas,
          .leaflet-tile-pane {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            opacity: 1 !important;
          }
          .leaflet-control-container { display: none !important; }

          /* ── Timeline ── */
          div[style*="position: absolute"][style*="left: 13px"] { display: none !important; }

          /* ── Badge ── */
          .badge { border: 1px solid currentColor !important; }

          /* ── Footer ── */
          #print-footer {
            display: block !important;
            margin-top: 1.5rem;
            padding-top: 0.75rem;
            border-top: 1px solid #ccc;
            font-size: 8pt;
            color: #888;
            text-align: center;
          }

          /* ── Page break ── */
          .card { page-break-inside: avoid; }
          h1, h2, h3 { page-break-after: avoid; }

          /* ── Margins kertas ── */
          @page {
            margin: 1.5cm 1.8cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </>
  )
}
