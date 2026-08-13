'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { observasiApi, LaporanWawancara, guruApi, publik, Opd } from '@/lib/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

const STATUS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
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



export default function DetailLaporanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [laporan, setLaporan] = useState<LaporanWawancara | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoIdx, setFotoIdx] = useState(0)

  // Verifikasi Guru States
  const [allOpd, setAllOpd] = useState<Opd[]>([])
  const [verForm, setVerForm] = useState<{
    aksi: string; catatan: string; opd_ids: number[]; kategori_urusan: string
  }>({ aksi: '', catatan: '', opd_ids: [], kategori_urusan: '' })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!id) return
    observasiApi.show(Number(id))
      .then(res => {
        const lap = res.data.laporan
        setLaporan(lap)
        // Pre-fill verifikasi form dari data laporan
        // Pre-fill semua OPD dari opd_list (hasil auto-routing sistem)
        const preFilledOpdIds = (Array.isArray(lap.opd_list) && lap.opd_list.length > 0)
          ? lap.opd_list.map((o: any) => o.id).filter(Boolean)
          : lap.opdTujuan?.id ? [lap.opdTujuan.id] : []
        setVerForm(p => ({
          ...p,
          kategori_urusan: lap.kategori_urusan || '',
          opd_ids: preFilledOpdIds,
        }))
      })
      .catch(() => router.push('/laporan'))
      .finally(() => setLoading(false))
  }, [id])

  // Load daftar OPD segera saat guru membuka halaman
  useEffect(() => {
    if (user?.role === 'guru' && allOpd.length === 0) {
      publik.opd().then(res => setAllOpd(res.data.opd || []))
    }
  }, [user])

  const handleVerifikasi = async (aksi: string) => {
    if (aksi === 'SETUJUI') {
      if (!verForm.kategori_urusan) return toast.error('Kategori urusan wajib dipilih sebelum menyetujui.')
      if (verForm.opd_ids.length === 0) return toast.error('Pilih minimal 1 OPD tujuan.')
    }
    setProcessing(true)
    try {
      await guruApi.verifikasi(Number(id), {
        aksi,
        catatan: verForm.catatan,
        opd_ids: aksi === 'SETUJUI' ? verForm.opd_ids : [],
        kategori_urusan: aksi === 'SETUJUI' ? (verForm.kategori_urusan || undefined) : undefined,
      })
      toast.success(aksi === 'SETUJUI' ? '✅ Laporan disetujui dan diteruskan ke OPD!' : '❌ Laporan ditolak.')
      const res = await observasiApi.show(Number(id))
      setLaporan(res.data.laporan)
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Gagal memverifikasi')
    } finally {
      setProcessing(false)
    }
  }

  // Saat kategori berubah → auto-pilih OPD yang sesuai kategori tersebut
  const handleKategoriChange = (kat: string) => {
    const matchingOpd = allOpd.filter(o => o.kategori_urusan === kat)
    setVerForm(p => ({
      ...p,
      kategori_urusan: kat,
      opd_ids: matchingOpd.length > 0 ? matchingOpd.map(o => o.id) : p.opd_ids,
    }))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
    </div>
  )
  if (!laporan) return null

  const cfg = STATUS_CFG[laporan.status_laporan] || { label: laporan.status_laporan, cls: 'badge-gray', icon: '📋' }
  const isOverdue = laporan.status_sla === 'OVERDUE'
  const deadline = laporan.deadline_selesai ? new Date(laporan.deadline_selesai) : null
  const hasFoto = Array.isArray(laporan.dokumentasi_foto) && laporan.dokumentasi_foto.length > 0

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }} id="print-area">

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
      <div id="web-header-bar" className="animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          ← Kembali
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      {/* Header Card */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #14532D, #166534)', color: 'white', overflow: 'visible' }}>
        <div style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.7, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>KODE LAPORAN</div>
              <div style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.5rem' }}>{laporan.kode_laporan}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
              <span className={`badge ${cfg.cls}`} style={{ padding: '0.375rem 0.875rem', fontSize: '0.875rem' }}>{cfg.icon} {cfg.label}</span>
              <span className={`sla-badge ${isOverdue ? 'overdue' : 'on-time'}`}>
                {isOverdue ? '🔴 Melewati SLA' : '🟢 Tepat Waktu'}
              </span>
            </div>
          </div>

          {/* Kesimpulan */}
          {laporan.kesimpulan_otomatis && (
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.875rem 1.25rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75, marginBottom: '0.125rem' }}>Kesimpulan Otomatis</div>
                <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{laporan.kesimpulan_otomatis.replace(/_/g, ' ')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Info Umum */}
          <div className="card animate-fadeInUp">
            <div className="card-header"><span>ℹ️</span><h3>Informasi Laporan</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Pelapor */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pelapor</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{laporan.user?.name || '—'}</div>
                  {laporan.user?.role && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{laporan.user.role}</div>}
                </div>

                {/* OPD Tujuan — numbered list */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>OPD Tujuan</div>
                  {(() => {
                    const opdItems = Array.isArray(laporan.opd_list) && laporan.opd_list.length > 0
                      ? laporan.opd_list
                      : (laporan.opd_tujuan || laporan.opdTujuan)
                        ? [laporan.opd_tujuan || laporan.opdTujuan]
                        : []
                    return opdItems.length > 0 ? (
                      <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {opdItems.map((o: any, i: number) => (
                          <li key={i} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)', lineHeight: 1.4 }}>
                            {o?.nama || '—'}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>—</div>
                    )
                  })()}
                  {laporan.opd_list && laporan.opd_list.length > 1 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{laporan.opd_list.length} OPD terlibat</div>
                  )}
                </div>

                {/* Kategori Urusan */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kategori Urusan</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{laporan.kategori_urusan || '—'}</div>
                </div>

                {/* Lokasi */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lokasi</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{[laporan.kelurahan, laporan.kecamatan].filter(Boolean).join(', ') || '—'}</div>
                </div>

                {/* Tanggal Submit */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tanggal Submit</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>
                    {laporan.submitted_at ? format(new Date(laporan.submitted_at), 'dd MMMM yyyy HH:mm', { locale: localeId }) : '—'}
                  </div>
                </div>

                {/* Deadline SLA */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deadline SLA</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: isOverdue ? 'var(--danger)' : 'var(--gray-900)' }}>
                    {deadline ? format(deadline, 'dd MMMM yyyy HH:mm', { locale: localeId }) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Warga & Kondisi */}
          {laporan.jawaban_wawancara_detail && (
            <div className="card animate-fadeInUp">
              <div className="card-header"><span>📋</span><h3>Kondisi Warga</h3></div>
              <div className="card-body">
                <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nama Tetangga</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>
                    {(laporan.jawaban_wawancara_detail as any).nama_tetangga || '—'}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kondisi Ditemukan</div>
                {Array.isArray((laporan.jawaban_wawancara_detail as any)?.kondisi) && ((laporan.jawaban_wawancara_detail as any).kondisi.length > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {((laporan.jawaban_wawancara_detail as any).kondisi || []).map((k: any, i: number) => (
                      <div key={i} style={{ background: 'var(--gray-50)', padding: '0.75rem 1rem', borderRadius: 8, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--primary)', marginTop: '2px' }}>✓</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{k.label}</div>
                          {k.keterangan && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                              Catatan: {k.keterangan}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', fontStyle: 'italic' }}>Tidak ada kondisi spesifik yang dilaporkan.</div>
                )}
              </div>
            </div>
          )}

          {/* Catatan */}
          {laporan.catatan_observasi && (
            <div className="card animate-fadeInUp">
              <div className="card-header"><span>📝</span><h3>Catatan Observasi</h3></div>
              <div className="card-body">
                <p style={{ lineHeight: 1.8, color: 'var(--gray-700)' }}>{laporan.catatan_observasi}</p>
              </div>
            </div>
          )}

          {/* Foto */}
          {hasFoto && (
            <div className="card animate-fadeInUp">
              <div className="card-header"><span>📸</span><h3>Dokumentasi Foto ({laporan.dokumentasi_foto!.length})</h3></div>
              <div className="card-body">
                {/* Main foto */}
                <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: '0.75rem', background: 'var(--gray-900)', aspectRatio: '16/9' }}>
                  <img src={laporan.dokumentasi_foto![fotoIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                {/* Thumbnails */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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

          {/* Guru info (untuk siswa) */}
          {laporan.catatan_guru && (
            <div className="card animate-fadeInUp" style={{ border: '2px solid var(--accent-subtle)' }}>
              <div className="card-header" style={{ background: 'var(--accent-subtle)' }}>
                <span>👨‍🏫</span><h3 style={{ color: 'var(--accent-dark)' }}>Catatan Guru</h3>
              </div>
              <div className="card-body">
                <p style={{ lineHeight: 1.8 }}>{laporan.catatan_guru}</p>
                {laporan.poin_kegiatan != null && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⭐</span>
                    <span style={{ fontWeight: 800, color: '#7C3AED', fontSize: '1.125rem' }}>Poin Kegiatan: {laporan.poin_kegiatan}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Verifikasi (Hanya Guru) */}
          {user?.role === 'guru' && laporan.status_laporan === 'MENUNGGU_VERIFIKASI_GURU' && (
            <div className="card animate-fadeInUp" style={{ border: '2px solid var(--primary-light)' }}>
              <div className="card-header" style={{ background: 'var(--primary-light)' }}>
                <span>🛡️</span><h3 style={{ color: 'var(--primary-dark)' }}>Verifikasi Laporan Siswa</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Keputusan Verifikasi */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Keputusan Verifikasi <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    style={{ marginBottom: 0 }}
                    value={verForm.aksi}
                    onChange={e => setVerForm(p => ({ ...p, aksi: e.target.value }))}
                  >
                    <option value="">-- Pilih Keputusan --</option>
                    <option value="SETUJUI">✅ Setujui & Teruskan ke OPD</option>
                    <option value="TOLAK">❌ Tolak Laporan</option>
                  </select>
                </div>

                {verForm.aksi === 'SETUJUI' && (
                  <>
                    {/* Kategori Urusan */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Kategori Urusan <span style={{ color: 'var(--danger)' }}>*</span>
                        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 400 }}>— menentukan OPD yang dituju</span>
                      </label>
                      <select
                        className="form-select"
                        style={{ marginBottom: 0 }}
                        value={verForm.kategori_urusan}
                        onChange={e => handleKategoriChange(e.target.value)}
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {['EKONOMI','KESEHATAN','PERMUKIMAN','PENDIDIKAN','SOSIAL','UMUM'].map(k => (
                          <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>

                    {/* OPD Tujuan */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        OPD Tujuan <span style={{ color: 'var(--danger)' }}>*</span>
                        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 400 }}>— dapat memilih lebih dari 1</span>
                      </label>
                      {allOpd.length === 0 ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                          <div className="spinner spinner-dark" style={{ width: 16, height: 16, display: 'inline-block', marginRight: 8 }} />
                          Memuat daftar OPD…
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 220, overflowY: 'auto' }}>
                          {allOpd.map(opd => {
                            const isChecked = verForm.opd_ids.includes(opd.id)
                            const isRekomendasi = !!verForm.kategori_urusan && opd.kategori_urusan === verForm.kategori_urusan
                            return (
                              <label key={opd.id} style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                cursor: 'pointer', fontSize: '0.875rem',
                                padding: '0.5rem 0.75rem', borderRadius: 8,
                                background: isChecked ? '#FFFDF5' : 'white',
                                border: `1.5px solid ${isChecked ? 'var(--primary)' : 'var(--gray-200)'}`,
                                color: 'var(--gray-900)',
                                transition: 'all 0.15s',
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => setVerForm(p => ({
                                    ...p,
                                    opd_ids: e.target.checked
                                      ? [...p.opd_ids, opd.id]
                                      : p.opd_ids.filter(x => x !== opd.id),
                                  }))}
                                  style={{ accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }}
                                />
                                <span style={{ flex: 1, fontWeight: isChecked ? 700 : 400, color: 'var(--gray-900)' }}>{opd.nama}</span>
                                {isRekomendasi && (
                                  <span style={{ fontSize: '0.6875rem', background: 'var(--primary)', color: 'var(--primary-text)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                    Rekomendasi
                                  </span>
                                )}
                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{opd.kategori_urusan}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      {verForm.opd_ids.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', marginTop: '0.375rem', fontWeight: 600 }}>
                          ✓ {verForm.opd_ids.length} OPD dipilih: {allOpd.filter(o => verForm.opd_ids.includes(o.id)).map(o => o.nama).join(', ')}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Catatan */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Catatan untuk Siswa</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Berikan catatan atau masukan untuk siswa..."
                    value={verForm.catatan}
                    onChange={e => setVerForm(p => ({ ...p, catatan: e.target.value }))}
                  />
                </div>

                {/* Tombol aksi */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => handleVerifikasi(verForm.aksi)}
                    disabled={
                      !verForm.aksi ||
                      (verForm.aksi === 'SETUJUI' && (!verForm.kategori_urusan || verForm.opd_ids.length === 0)) ||
                      processing
                    }
                  >
                    {processing ? <><div className="spinner" /> Memproses…</> : '💾 Kirim Keputusan Verifikasi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Peta */}
          {laporan.latitude && laporan.longitude && (
            <div className="card animate-fadeInUp">
              <div className="card-header"><span>📍</span><h3>Lokasi GPS</h3></div>
              <div style={{ height: 220 }}>
                <MapPicker lat={Number(laporan.latitude)} lng={Number(laporan.longitude)} readonly />
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', fontSize: '0.8125rem', color: 'var(--gray-600)', fontFamily: 'monospace' }}>
                {Number(laporan.latitude).toFixed(6)}, {Number(laporan.longitude).toFixed(6)}
              </div>
              {laporan.alamat_laporan && (
                <div style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--gray-600)', borderTop: '1px solid var(--gray-100)' }}>
                  📍 {laporan.alamat_laporan}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tindak Lanjut */}
          <div className="card animate-fadeInUp">
            <div className="card-header"><span>🕐</span><h3>Timeline Tindak Lanjut</h3></div>
            <div className="card-body" style={{ padding: '1rem' }}>
              {Array.isArray(laporan.log_tindak_lanjut) && laporan.log_tindak_lanjut.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  {/* Vertical line */}
                  <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: 'var(--gray-100)', borderRadius: 2 }} />
                  {laporan.log_tindak_lanjut.map((log, i) => (
                    <div key={log.id} style={{ display: 'flex', gap: '0.875rem', marginBottom: i < laporan.log_tindak_lanjut!.length - 1 ? '1rem' : 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? 'var(--primary)' : 'var(--gray-200)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? 'white' : 'var(--gray-500)',
                        zIndex: 1, border: '2px solid white',
                      }}>
                        {i === laporan.log_tindak_lanjut!.length - 1 ? '✓' : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--gray-900)' }}>{log.aksi.replace(/_/g, ' ')}</div>
                        {log.keterangan && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem', lineHeight: 1.6 }}>{log.keterangan}</div>}
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                          {log.user?.name} · {format(new Date(log.created_at), 'dd MMM HH:mm', { locale: localeId })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                  Belum ada tindak lanjut
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer cetak — HANYA tampil saat print */}
      <div id="print-footer" style={{ display: 'none' }}>
        Dokumen ini dicetak dari Sistem Informasi Tengok Tetangga — Pemerintah Kota Bontang.
        Kode Laporan: {laporan.kode_laporan}
        {laporan.opd_tujuan?.nama || laporan.opdTujuan?.nama ? ` · ${laporan.opd_tujuan?.nama || laporan.opdTujuan?.nama}` : ''}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 340px"] { grid-template-columns: 1fr !important; }
        }

        @media print {
          /* ── Sembunyikan elemen UI ── */
          #web-header-bar,
          .sidebar, nav, header,
          #mobile-menu-btn,
          [class*="sidebar"],
          [id*="sidebar"],
          .animate-fadeInUp button,
          form, .form-group,
          div[style*="border: 2px solid var(--primary-light)"],
          div[style*="border: 2px solid var(--accent-subtle)"] .card-body button { display: none !important; }

          /* Sembunyikan tombol-tombol aksi */
          .btn { display: none !important; }

          /* ── Reset layout halaman ── */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; font-size: 11pt !important; color: #111 !important; }
          body > div, main, [style*="margin-left"] { margin-left: 0 !important; padding: 0 !important; }
          .page-content { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }

          /* ── Kop surat ── */
          #print-header {
            display: flex !important;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 0 0.875rem 0;
            border-bottom: 3px solid #166534;
            margin-bottom: 1rem;
          }
          #print-header .print-logo {
            width: 52px; height: 52px;
            background: linear-gradient(135deg, #14532D, #166534);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 1.75rem; flex-shrink: 0;
          }
          #print-header .print-title  { font-size: 13pt; font-weight: 800; color: #14532D; line-height: 1.2; }
          #print-header .print-subtitle { font-size: 8.5pt; color: #555; margin-top: 2px; }
          #print-header .print-meta   { margin-left: auto; text-align: right; font-size: 8pt; color: #555; }
          #print-header .print-kode   { font-family: monospace; font-size: 12pt; font-weight: 900; color: #166534; }

          /* ── Grid → kolom tunggal ── */
          div[style*="grid-template-columns: 1fr 340px"] { display: block !important; }
          div[style*="grid-template-columns: 1fr 340px"] > div { width: 100% !important; }

          /* ── Card ── */
          .card {
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            margin-bottom: 0.75rem !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          .card-header {
            background: #f5f5f0 !important;
            padding: 0.5rem 1rem !important;
            border-bottom: 1px solid #ddd !important;
          }
          .card-header h3 { font-size: 10pt !important; font-weight: 700 !important; }
          .card-body { padding: 0.75rem 1rem !important; }

          /* ── Header laporan (gradient card) ── */
          .card[style*="linear-gradient"] { background: #14532D !important; }

          /* ── Info grid 2 kolom ── */
          div[style*="grid-template-columns: 1fr 1fr"] {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }

          /* ── Foto: tampilkan foto utama saja, sembunyikan thumbnail ── */
          div[style*="aspect-ratio: 16/9"] { max-height: 180px !important; }

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

          /* ── Sembunyikan garis vertikal timeline (tidak render di print) ── */
          div[style*="position: absolute"][style*="left: 14px"] { display: none !important; }

          /* ── Form verifikasi guru — sembunyikan saat print ── */
          div[style*="border: 2px solid var(--primary-light)"] { display: none !important; }

          /* ── Catatan guru — tetap tampil tapi tanpa border warna ── */
          div[style*="border: 2px solid var(--accent-subtle)"] {
            border: 1px solid #ddd !important;
          }

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

          /* ── Animasi off ── */
          .animate-fadeInUp { animation: none !important; opacity: 1 !important; }

          /* ── Ukuran kertas ── */
          @page {
            margin: 1.5cm 1.8cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  )
}
