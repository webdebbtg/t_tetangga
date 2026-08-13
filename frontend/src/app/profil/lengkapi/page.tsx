'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authApi, publik, Sekolah } from '@/lib/api'
import MapPicker from '@/components/MapPicker'
import toast from 'react-hot-toast'

export default function LengkapiProfilPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', nis: '', telepon: '', alamat: '',
    latitude: 0.133333, longitude: 117.483333,
    role: 'masyarakat', sekolah_id: '', kelas: '',
  })

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        telepon: user.telepon || '',
        alamat: user.alamat || '',
        // Set fallback to default coordinate only if user doesn't have it yet,
        // GPS will override this later if granted
        latitude: user.latitude || 0.133333,
        longitude: user.longitude || 117.483333,
      }))
    }
  }, [user])

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung fitur GPS.')
      return
    }
    setLocating(true)
    setGpsAccuracy(null)
    let bestAccuracy = Infinity
    let watchId: number

    const finish = (accuracy: number) => {
      navigator.geolocation.clearWatch(watchId)
      setLocating(false)
      setGpsAccuracy(accuracy)
      if (accuracy <= 10) {
        toast.success(`📍 Lokasi GPS presisi (±${Math.round(accuracy)} m)`)
      } else {
        toast.success(`📍 Lokasi GPS didapat (±${Math.round(accuracy)} m)`)
      }
    }

    // Timeout 20 detik — pakai posisi terbaik yang ada
    const timer = setTimeout(() => {
      if (bestAccuracy < Infinity) {
        finish(bestAccuracy)
      } else {
        navigator.geolocation.clearWatch(watchId)
        setLocating(false)
        toast.error('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi diaktifkan.')
      }
    }, 20000)

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        // Selalu pakai posisi terbaru jika lebih akurat
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy
          setGpsAccuracy(Math.round(accuracy))
          setForm(prev => ({ ...prev, latitude, longitude }))
        }
        // Cukup akurat (≤5 meter) → berhenti
        if (accuracy <= 5) {
          clearTimeout(timer)
          finish(accuracy)
        }
      },
      () => {
        clearTimeout(timer)
        navigator.geolocation.clearWatch(watchId)
        setLocating(false)
        toast.error('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi diaktifkan.')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  // Auto fetch location on mount
  useEffect(() => {
    if (!user?.latitude) {
      getLocation()
    }
  }, [])

  useEffect(() => {
    publik.sekolah().then(res => setSekolahList(res.data.sekolah))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.updateProfil({
        name: form.name,
        email: form.email,
        nis: form.role === 'siswa' ? form.nis : undefined,
        telepon: form.telepon,
        alamat: form.alamat,
        latitude: form.latitude,
        longitude: form.longitude,
        role: form.role as any,
        sekolah_id: form.sekolah_id ? Number(form.sekolah_id) : undefined,
        kelas: form.kelas || undefined,
      })
      await refreshUser()
      toast.success('Profil berhasil dilengkapi!')
      router.push('/dashboard')
    } catch (err: any) {
      const errs = err.response?.data?.errors
      if (errs) {
        Object.values(errs).flat().forEach((msg: any) => toast.error(msg))
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan profil')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #16A34A, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
          }}>👋</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14532D' }}>
            Selamat Datang! 👋
          </h1>
          <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Lengkapi profil Anda untuk mulai menggunakan Tengok Tetangga
          </p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap <span>*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Masukkan nama asli Anda sesuai KTP"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  maxLength={100}
                />
                <p className="form-hint">Gunakan nama asli Anda, bukan nama pengguna Google</p>
              </div>

              <div className="form-group">
                <label className="form-label">Peran Anda <span>*</span></label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  required
                >
                  <option value="masyarakat">Masyarakat Umum</option>
                  <option value="siswa">Siswa / Pelajar</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Email <span>*</span></label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="alamat@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon <span>*</span></label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.telepon}
                  onChange={e => setForm(p => ({ ...p, telepon: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lengkap <span>*</span></label>
                <textarea
                  className="form-input"
                  placeholder="Sertakan nama jalan, RT/RW, dan patokan rumah..."
                  rows={3}
                  value={form.alamat}
                  onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Titik Lokasi Tempat Tinggal <span>*</span></label>
                  <button
                    type="button"
                    onClick={getLocation}
                    className="btn btn-outline btn-sm"
                    disabled={locating}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    {locating ? (
                      <>
                        <div className="spinner spinner-dark" style={{ width: 12, height: 12 }} />
                        {gpsAccuracy ? `±${gpsAccuracy}m…` : 'Mencari…'}
                      </>
                    ) : '📍 Gunakan GPS Saat Ini'}
                  </button>
                </div>
                <div style={{ height: 250, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)', marginBottom: '0.5rem' }}>
                  <MapPicker
                    lat={form.latitude}
                    lng={form.longitude}
                    onChange={(pos) => setForm(p => ({ ...p, latitude: pos.lat, longitude: pos.lng }))}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="form-hint" style={{ margin: 0 }}>Geser pin atau klik pada peta untuk menentukan lokasi persis tempat tinggal Anda.</span>
                  {gpsAccuracy !== null && !locating && (
                    <span className={`badge ${gpsAccuracy <= 10 ? 'badge-green' : gpsAccuracy <= 30 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: '0.6875rem', flexShrink: 0 }}>
                      {gpsAccuracy <= 10 ? '✓' : '⚠'} Akurasi ±{gpsAccuracy} m
                    </span>
                  )}
                </div>
              </div>

              {form.role === 'siswa' && (
                <>
                  <div className="form-group">
                    <label className="form-label">NIS (Nomor Induk Siswa) <span>*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      maxLength={20}
                      placeholder="Nomor Induk Siswa"
                      value={form.nis}
                      onChange={e => setForm(p => ({ ...p, nis: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sekolah <span>*</span></label>
                    <select
                      className="form-select"
                      value={form.sekolah_id}
                      onChange={e => setForm(p => ({ ...p, sekolah_id: e.target.value }))}
                      required
                    >
                      <option value="">-- Pilih Sekolah --</option>
                      {sekolahList.map(s => (
                        <option key={s.id} value={s.id}>{s.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelas <span>*</span></label>
                    <input
                      className="form-input"
                      placeholder="Contoh: X IPA 1"
                      value={form.kelas}
                      onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <><div className="spinner" /> Menyimpan...</> : '✅ Simpan & Lanjutkan'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
