'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { observasiApi } from '@/lib/api'
import { KECAMATAN_LIST, getKelurahan } from '@/lib/wilayah'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

interface GpsCoords { lat: number; lng: number }

interface KondisiOption {
  label: string
  checked: boolean
  keterangan: string
  opd: string        // singkatan OPD tujuan
  opdDetail: string  // unit/bidang penanganan
}

/** Warna badge per OPD */
const OPD_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Dinsos:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Dinkes:    { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  DP3AKB:   { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  Disperkim: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Disdik:    { bg: '#FEFCE8', text: '#854D0E', border: '#FEF08A' },
  BPBD:      { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
}

/** Konfigurasi level keparahan berdasarkan jumlah kondisi dipilih */
function getKesimpulanLevel(jumlah: number) {
  if (jumlah === 0)  return { label: '—', level: 'NORMAL',  color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' }
  if (jumlah === 1)  return { label: 'Kasus Tunggal',  level: 'RINGAN',  color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' }
  if (jumlah <= 4)   return { label: 'Kasus Rentan',   level: 'SEDANG',  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' }
  if (jumlah <= 9)   return { label: 'Kasus Kompleks', level: 'TINGGI',  color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' }
  return               { label: 'Kasus Darurat',  level: 'EKSTREM', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' }
}

export default function ObservasiPage() {
  const { user, sudahLulus, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=lokasi, 2=kuesioner, 3=konfirmasi

  const [gps, setGps] = useState<GpsCoords | null>(null)
  const [alamat, setAlamat] = useState('')
  const [kelurahan, setKelurahan] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [foto, setFoto] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [namaTetangga, setNamaTetangga] = useState('')
  const [kondisi, setKondisi] = useState<KondisiOption[]>([])
  const [catatan, setCatatan] = useState('')
  const [loadingQuestions, setLoadingQuestions] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [attemptedStep3, setAttemptedStep3] = useState(false)
  const [setujuPrivasi, setSetujuPrivasi] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ kode: string; nama: string } | null>(null)

  const wajibAssessment = user ? ['siswa', 'masyarakat'].includes(user.role) : false

  // Bersihkan sisa draft lama saat halaman pertama kali dibuka
  useEffect(() => {
    localStorage.removeItem('observasi_draft')
  }, [])

  useEffect(() => {
    if (wajibAssessment && !sudahLulus) { router.push('/self-assessment'); return }
  }, [wajibAssessment, sudahLulus])

  useEffect(() => {
    // Tunggu hingga auth selesai dimuat
    if (authLoading) return

    // Jika user wajib assessment tapi belum lulus, jangan panggil API
    // (useEffect di atas akan menangani redirect ke /self-assessment)
    if (wajibAssessment && !sudahLulus) {
      setLoadingQuestions(false)
      return
    }

    observasiApi.getPertanyaan()
      .then(res => {
        const mapped = (res.data?.pertanyaan || []).map((p: any) => {
          const opt = p.opsi_jawaban?.find?.((o: any) => o.opd) || p.opsi_jawaban?.[0] || {}
          return {
            label: p.teks_pertanyaan,
            checked: false,
            keterangan: '',
            opd: opt.opd || 'Dinsos',
            opdDetail: opt.opd_detail || 'Penanganan Umum'
          }
        })
        // Urutkan: Dinsos terlebih dahulu, kemudian OPD lain secara alfabetis
        const sorted = [...mapped].sort((a, b) => {
          if (a.opd === 'Dinsos' && b.opd !== 'Dinsos') return -1
          if (a.opd !== 'Dinsos' && b.opd === 'Dinsos') return 1
          return a.opd.localeCompare(b.opd)
        })
        setKondisi(sorted)
      })
      .catch(err => {
        console.error(err)
        toast.error('Gagal memuat kuesioner observasi lapangan')
      })
      .finally(() => {
        setLoadingQuestions(false)
      })
  }, [authLoading, wajibAssessment, sudahLulus])

  const getGps = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false) },
      () => { toast.error('Gagal mendapatkan lokasi GPS'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (foto.length + files.length > 5) { toast.error('Maksimal 5 foto'); return }
    setFoto(prev => [...prev, ...files])
  }

  const removeFoto = (idx: number) => setFoto(prev => prev.filter((_, i) => i !== idx))

  const handleKondisiToggle = (index: number) => {
    setKondisi(prev => {
      const newK = [...prev]
      newK[index] = { ...newK[index], checked: !newK[index].checked }
      if (!newK[index].checked) newK[index].keterangan = ''
      return newK
    })
  }

  const handleKeteranganChange = (index: number, val: string) => {
    setKondisi(prev => {
      const newK = [...prev]
      newK[index] = { ...newK[index], keterangan: val }
      return newK
    })
  }

  const adaKondisiTerpilih = kondisi.some(k => k.checked)
  const jawabSemua = namaTetangga.trim().length > 0 && adaKondisiTerpilih

  const handleLanjutStep3 = () => {
    setAttemptedStep3(true)
    if (!jawabSemua) {
      toast.error('Pastikan Nama Tetangga diisi dan minimal 1 kondisi dipilih')
      return
    }
    setStep(3)
  }

  /** Reset semua field form ke kondisi awal */
  const resetForm = () => {
    setStep(1)
    setGps(null)
    setAlamat('')
    setKelurahan('')
    setKecamatan('')
    setFoto([])
    setNamaTetangga('')
    setKondisi(prev => prev.map(k => ({ ...k, checked: false, keterangan: '' })))
    setCatatan('')
    setAttemptedStep3(false)
    setSetujuPrivasi(false)
    localStorage.removeItem('observasi_draft')
  }

  const handleSubmit = async () => {
    if (!gps) { toast.error('Koordinat GPS wajib diisi'); return }
    if (!setujuPrivasi) { toast.error('Anda harus menyetujui privasi sebelum mengirim laporan'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('latitude', String(gps.lat))
      fd.append('longitude', String(gps.lng))
      fd.append('alamat_laporan', alamat)
      fd.append('kelurahan', kelurahan)
      fd.append('kecamatan', kecamatan)
      fd.append('catatan_observasi', catatan)
      fd.append('nama_tetangga', namaTetangga)

      const selectedKondisi = kondisi.filter(k => k.checked)
      selectedKondisi.forEach((k, index) => {
        fd.append(`kondisi[${index}][label]`, k.label)
        fd.append(`kondisi[${index}][keterangan]`, k.keterangan)
      })

      foto.forEach((f) => fd.append('foto[]', f))

      const res = await observasiApi.submit(fd)
      const kode      = res.data?.laporan?.kode_laporan || ''
      const namaCache = namaTetangga // simpan sebelum form di-reset

      // Reset form & draft sebelum tampilkan modal
      resetForm()
      setSuccessInfo({ kode, nama: namaCache })
      setShowSuccessModal(true)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal mengirim laporan')
    } finally { setSubmitting(false) }
  }

  // Hitung OPD unik dari kondisi terpilih (untuk preview di step 2 & konfirmasi)
  const selectedKondisi = kondisi.filter(k => k.checked)
  const jumlahTerpilih  = selectedKondisi.length
  const kesimpulanLevel = getKesimpulanLevel(jumlahTerpilih)

  const opdTargets = selectedKondisi.reduce<Record<string, string[]>>((acc, k) => {
    if (!acc[k.opd]) acc[k.opd] = []
    if (!acc[k.opd].includes(k.opdDetail)) acc[k.opd].push(k.opdDetail)
    return acc
  }, {})

  const STEPS = ['📍 Lokasi', '📋 Kuesioner', '✅ Konfirmasi']
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loadingQuestions) {
    return (
      <div className="page-content" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.375rem' }}>📝 Buat Laporan Observasi</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Isi form wawancara lapangan dan dokumentasikan kondisi yang ditemukan.</p>
        </div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 1.5rem', width: 36, height: 36 }} />
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Memuat kuesioner observasi lapangan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Modal Sukses ──────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="animate-fadeInUp" style={{
            background: '#ffffff', borderRadius: 20, padding: '2.5rem 2rem',
            maxWidth: 420, width: '100%', textAlign: 'center',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {/* Ikon centang */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem', fontSize: '2.25rem',
              boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
            }}>
              ✅
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              Laporan Berhasil Dikirim!
            </h2>

            {successInfo?.nama && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--gray-600)', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                Laporan untuk <strong>{successInfo.nama}</strong> telah berhasil dikirim dan akan segera diproses.
              </p>
            )}

            {successInfo?.kode && (
              <div style={{
                display: 'inline-block', background: 'var(--primary-subtle)',
                border: '1px solid var(--primary-light)', borderRadius: 8,
                padding: '0.375rem 1rem', marginBottom: '1.25rem',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 600 }}>Kode Laporan: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.9375rem' }}>
                  {successInfo.kode}
                </span>
              </div>
            )}

            {user?.role === 'siswa' ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                📚 Laporan menunggu verifikasi Guru sebelum diteruskan ke OPD.
              </p>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                🏛️ Laporan sedang diproses dan diarahkan ke OPD yang berwenang.
              </p>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '1rem', fontWeight: 700 }}
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/dashboard')
              }}
            >
              OK, Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.375rem' }}>📝 Buat Laporan Observasi</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Isi form wawancara lapangan dan dokumentasikan kondisi yang ditemukan.</p>
      </div>

      {/* Step indicator */}
      <div className="animate-fadeInUp card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div onClick={() => i < step && setStep(i + 1)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                cursor: i < step ? 'pointer' : 'default',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: step > i + 1 ? 'var(--primary)' : step === i + 1 ? 'var(--primary)' : 'var(--gray-200)',
                  color: step >= i + 1 ? 'white' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.3s',
                }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--primary-dark)' : 'var(--gray-500)', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? 'var(--primary)' : 'var(--gray-200)', margin: '0 0.75rem', transition: 'background 0.4s' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: LOKASI & FOTO */}
      {step === 1 && (
        <div className="animate-fadeInUp">
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><span>📍</span><h3>Koordinat GPS</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={getGps} disabled={gpsLoading}>
                  {gpsLoading ? <><div className="spinner" /> Mengambil...</> : '📡 Ambil Lokasi Saya'}
                </button>
                {gps && (
                  <div style={{ background: 'var(--primary-subtle)', border: '1px solid var(--primary-light)', borderRadius: 8, padding: '0.625rem 1rem', fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
                    📍 {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                  </div>
                )}
              </div>
              {gps && (
                <div style={{ marginTop: '1rem', height: 300, borderRadius: 10, border: '1px solid var(--gray-200)', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
                  <MapPicker lat={gps.lat} lng={gps.lng} onChange={setGps} />
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><span>🏠</span><h3>Alamat Lokasi</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Alamat Lengkap</label>
                <input className="form-input" placeholder="Jl. contoh No. 1..." value={alamat} onChange={e => setAlamat(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Kecamatan</label>
                  <select
                    className="form-select"
                    style={{ marginBottom: 0 }}
                    value={kecamatan}
                    onChange={e => {
                      setKecamatan(e.target.value)
                      setKelurahan('')
                    }}
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {KECAMATAN_LIST.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Kelurahan</label>
                  <select
                    className="form-select"
                    style={{ marginBottom: 0 }}
                    value={kelurahan}
                    onChange={e => setKelurahan(e.target.value)}
                    disabled={!kecamatan}
                  >
                    <option value="">{kecamatan ? '-- Pilih Kelurahan --' : '-- Pilih kecamatan dulu --'}</option>
                    {getKelurahan(kecamatan).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><span>📸</span><h3>Dokumentasi Lokasi (maks. 5)</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {foto.map((f, i) => (
                  <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '2px solid var(--gray-200)' }} />
                    <button onClick={() => removeFoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {foto.length < 5 && (
                  <button onClick={() => fileRef.current?.click()} style={{ width: 90, height: 90, borderRadius: 8, border: '2px dashed var(--gray-300)', background: 'var(--gray-50)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📷</span> Tambah Foto
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFotoChange} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>Batal</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} disabled={!gps}>Lanjut ke Kuesioner →</button>
          </div>
        </div>
      )}

      {/* STEP 2: KUESIONER */}
      {step === 2 && (
        <div className="animate-fadeInUp">
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><span>📋</span><h3>Data Observasi</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Tanggal Kunjungan</label>
                <input className="form-input" value={tanggalHariIni} readOnly style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nama Tetangga <span style={{color: 'var(--danger)'}}>*</span></label>
                <input
                  className="form-input"
                  placeholder="Masukkan nama tetangga..."
                  value={namaTetangga}
                  onChange={e => setNamaTetangga(e.target.value)}
                  style={{ border: attemptedStep3 && !namaTetangga.trim() ? '1px solid var(--danger)' : undefined }}
                />
                {attemptedStep3 && !namaTetangga.trim() && <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>Nama tetangga wajib diisi</div>}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <span>⚠️</span>
              <h3>Kondisi Tetangga <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--gray-500)' }}>(Pilih minimal 1)</span></h3>
              {jumlahTerpilih > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{jumlahTerpilih} dipilih</span>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: kesimpulanLevel.bg, color: kesimpulanLevel.color,
                    border: `1px solid ${kesimpulanLevel.border}`,
                  }}>
                    {kesimpulanLevel.level}
                  </span>
                </div>
              )}
            </div>
            <div className="card-body" style={{ border: attemptedStep3 && !adaKondisiTerpilih ? '1px solid var(--danger)' : undefined, borderRadius: 8, padding: attemptedStep3 && !adaKondisiTerpilih ? '1rem' : undefined, background: attemptedStep3 && !adaKondisiTerpilih ? '#FEF2F2' : undefined }}>
              {attemptedStep3 && !adaKondisiTerpilih && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>Silakan pilih minimal satu kondisi di bawah ini:</div>}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {kondisi.map((k, idx) => {
                  const opdColor = OPD_COLOR[k.opd] || OPD_COLOR['Dinsos']
                  return (
                    <div key={idx} style={{ background: k.checked ? 'var(--primary-subtle)' : 'var(--gray-50)', padding: '0.875rem 1rem', borderRadius: 8, border: k.checked ? '1px solid var(--primary)' : '1px solid var(--gray-200)', transition: 'all 0.2s' }}>
                      <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={k.checked}
                          onChange={() => handleKondisiToggle(idx)}
                          style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--primary)', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: k.checked ? 600 : 400, color: 'var(--gray-800)', lineHeight: 1.5 }}>
                            {k.label}
                          </span>
                          <div style={{ marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: opdColor.bg, color: opdColor.text, border: `1px solid ${opdColor.border}` }}>
                              {k.opd}
                            </span>
                          </div>
                        </div>
                      </label>
                      {k.checked && (
                        <div style={{ marginTop: '0.75rem', marginLeft: '1.875rem' }} className="animate-fadeInUp">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Tambahkan keterangan (opsional)..."
                            value={k.keterangan}
                            onChange={(e) => handleKeteranganChange(idx, e.target.value)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ringkasan OPD tujuan (muncul saat ada kondisi terpilih) */}
          {jumlahTerpilih > 0 && (
            <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', border: `1px solid ${kesimpulanLevel.border}`, background: kesimpulanLevel.bg }}>
              <div className="card-body" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1rem' }}>🎯</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: kesimpulanLevel.color }}>
                      {kesimpulanLevel.label} — Tingkat {kesimpulanLevel.level}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{jumlahTerpilih} kondisi dipilih · laporan akan diarahkan ke:</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(opdTargets).map(([opd, details]) => {
                    const c = OPD_COLOR[opd] || OPD_COLOR['Dinsos']
                    return (
                      <div key={opd} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '0.375rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: c.text }}>{opd}</div>
                        {details.map((d, i) => (
                          <div key={i} style={{ fontSize: '0.725rem', color: c.text, opacity: 0.85 }}>• {d}</div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
            <label className="form-label">📝 Catatan Tambahan (opsional)</label>
            <textarea className="form-textarea" placeholder="Deskripsikan situasi yang Anda temukan secara lebih detail..." value={catatan} onChange={e => setCatatan(e.target.value)} rows={4} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Kembali</button>
            <button className="btn btn-primary btn-lg" onClick={handleLanjutStep3}>Lanjut ke Konfirmasi →</button>
          </div>
        </div>
      )}

      {/* STEP 3: KONFIRMASI */}
      {step === 3 && (
        <div className="animate-fadeInUp">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><span>✅</span><h3>Ringkasan Laporan</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Identitas */}
                <div style={{ background: 'var(--primary-subtle)', borderRadius: 10, padding: '1rem', border: '1px solid var(--primary-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Identitas Objek Observasi</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-900)' }}>{namaTetangga}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>Tanggal: {tanggalHariIni}</div>
                </div>

                {/* Level Kesimpulan */}
                <div style={{ background: kesimpulanLevel.bg, borderRadius: 10, padding: '1rem', border: `1px solid ${kesimpulanLevel.border}` }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Tingkat Keparahan</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {kesimpulanLevel.level === 'RINGAN' ? '🟢' : kesimpulanLevel.level === 'SEDANG' ? '🟡' : kesimpulanLevel.level === 'TINGGI' ? '🟠' : '🔴'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: kesimpulanLevel.color }}>{kesimpulanLevel.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{jumlahTerpilih} kondisi dipilih — Tingkat {kesimpulanLevel.level}</div>
                    </div>
                  </div>
                </div>

                {/* OPD Tujuan */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>OPD Tujuan Penanganan</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(opdTargets).map(([opd, details]) => {
                      const c = OPD_COLOR[opd] || OPD_COLOR['Dinsos']
                      return (
                        <div key={opd} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '0.5rem 0.875rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: c.text }}>{opd}</div>
                          {details.map((d, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', color: c.text, opacity: 0.85 }}>• {d}</div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Kondisi Ditemukan */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Kondisi yang Ditemukan ({jumlahTerpilih})</div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--gray-800)', display: 'grid', gap: '0.5rem' }}>
                    {selectedKondisi.map((k, idx) => (
                      <li key={idx}>
                        <strong>{k.label}</strong>
                        <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: (OPD_COLOR[k.opd] || OPD_COLOR['Dinsos']).text }}>→ {k.opd}</span>
                        {k.keterangan && <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '0.125rem' }}>- {k.keterangan}</div>}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* GPS */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Koordinat GPS</div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{gps?.lat.toFixed(6)}, {gps?.lng.toFixed(6)}</div>
                  {kecamatan && <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{kelurahan}, {kecamatan}</div>}
                </div>

                {foto.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem', fontWeight: 700 }}>📸 {foto.length} FOTO TERLAMPIR</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {foto.map((f, i) => <img key={i} src={URL.createObjectURL(f)} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />)}
                    </div>
                  </div>
                )}
                {catatan && <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', fontWeight: 700 }}>CATATAN TAMBAHAN</div><p style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{catatan}</p></div>}
              </div>
            </div>
          </div>

          {/* Komitmen Privasi */}
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--warning)', background: '#FEF9C3' }}>
            <div className="card-body">
              <h4 style={{ color: '#7A5500', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>
                <span>🔒</span> Komitmen Privasi & Etika
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#4A3300', lineHeight: 1.6, marginBottom: '1rem' }}>
                Sebelum mengirim laporan ini, Anda menyatakan bahwa:
              </p>
              <ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#4A3300', display: 'grid', gap: '0.5rem' }}>
                <li>Saya telah <strong>meminta izin/persetujuan</strong> dari tetangga yang bersangkutan untuk melakukan observasi.</li>
                <li>Saya <strong>berkomitmen menjaga privasi</strong> dan kerahasiaan identitas tetangga.</li>
                <li>Saya <strong>tidak akan menyebarluaskan</strong> hasil kuesioner maupun foto ini ke media sosial atau pihak yang tidak berwenang.</li>
              </ul>

              <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'white', padding: '1rem', borderRadius: 8, border: '1px solid #FFD740' }}>
                <input
                  type="checkbox"
                  checked={setujuPrivasi}
                  onChange={(e) => setSetujuPrivasi(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, accentColor: '#7A5500' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4A3300' }}>
                  Saya mengerti, menyetujui, dan mematuhi komitmen privasi di atas.
                </span>
              </label>
            </div>
          </div>

          {user?.role === 'siswa' && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>📚 Laporan Anda akan terlebih dahulu diverifikasi oleh Guru sebelum diteruskan ke OPD.</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Kembali</button>
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><div className="spinner" /> Mengirim...</> : '🚀 Kirim Laporan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
