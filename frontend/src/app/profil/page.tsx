'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authApi, publik, Sekolah } from '@/lib/api'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function ProfilPage() {
  const { user, refreshUser, sudahLulus } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    telepon: '',
    alamat: '',
    nis: '',
    kelas: '',
    sekolah_id: 0,
    latitude: 0,
    longitude: 0,
    password: '',
    password_confirmation: '',
  })

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        email: user.email || '',
        telepon: user.telepon || '',
        alamat: user.alamat || '',
        nis: user.nis || '',
        kelas: user.kelas || '',
        sekolah_id: user.sekolah_id || 0,
        latitude: Number(user.latitude) || 0,
        longitude: Number(user.longitude) || 0,
      }))
    }
  }, [user])

  const [sekolahs, setSekolahs] = useState<Sekolah[]>([])
  useEffect(() => {
    publik.sekolah().then(res => {
      setSekolahs(res.data.sekolah || res.data.data || [])
    }).catch(err => console.error(err))
  }, [])

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Browser tidak mendukung GPS')
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

    const timer = setTimeout(() => {
      if (bestAccuracy < Infinity) {
        finish(bestAccuracy)
      } else {
        navigator.geolocation.clearWatch(watchId)
        setLocating(false)
        toast.error('Gagal mendapat lokasi GPS. Aktifkan izin lokasi.')
      }
    }, 20000)

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy
          setGpsAccuracy(Math.round(accuracy))
          setForm(f => ({ ...f, latitude, longitude }))
        }
        if (accuracy <= 5) {
          clearTimeout(timer)
          finish(accuracy)
        }
      },
      () => {
        clearTimeout(timer)
        navigator.geolocation.clearWatch(watchId)
        setLocating(false)
        toast.error('Gagal mendapat lokasi GPS. Aktifkan izin lokasi.')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }, [])

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nama tidak boleh kosong')
    if (!form.telepon.trim()) return toast.error('No. Handphone tidak boleh kosong')
    if (!form.alamat.trim()) return toast.error('Alamat tidak boleh kosong')
    if (showPassForm && form.password) {
      if (form.password.length < 8) return toast.error('Password minimal 8 karakter')
      if (form.password !== form.password_confirmation) return toast.error('Konfirmasi password tidak cocok')
    }

    setLoading(true)
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        telepon: form.telepon,
        alamat: form.alamat,
        latitude: form.latitude,
        longitude: form.longitude,
      }
      if (user?.role === 'siswa') {
        payload.nis = form.nis
        payload.kelas = form.kelas
        payload.sekolah_id = form.sekolah_id
      }
      if (showPassForm && form.password) {
        payload.password = form.password
        payload.password_confirmation = form.password_confirmation
      }
      await authApi.updateProfil(payload)
      await refreshUser()
      toast.success('✅ Profil berhasil diperbarui!')
      setForm(f => ({ ...f, password: '', password_confirmation: '' }))
      setShowPassForm(false)
    } catch (e: any) {
      const errs = e.response?.data?.errors
      if (errs) {
        Object.values(errs).flat().forEach((msg: any) => toast.error(msg))
      } else {
        toast.error(e.response?.data?.message || 'Gagal menyimpan profil')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const isGoogleUser = !(user as any).has_password && !(user as any).password

  return (
    <div className="page-content animate-fadeInUp" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>👤 Edit Profil</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Kelola informasi pribadi dan keamanan akun Anda.
        </p>
      </div>

      {/* Status Kelayakan Banner */}
      <div className="card animate-fadeInUp" style={{
        marginBottom: '1.25rem',
        background: sudahLulus
          ? 'linear-gradient(135deg, #DCFCE7, #BBF7D0)'
          : 'linear-gradient(135deg, #FEF9C3, #FEF08A)',
        border: sudahLulus ? '1px solid #86EFAC' : '1px solid #FFD740',
      }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>{sudahLulus ? '🏆' : '📋'}</div>
          <div>
            <div style={{ fontWeight: 700, color: sudahLulus ? '#15803D' : '#4A3300' }}>
              {sudahLulus ? 'Status: LULUS Uji Kelayakan' : 'Status: Belum Lulus Uji Kelayakan'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: sudahLulus ? '#166534' : '#3D2B00', marginTop: '0.125rem' }}>
              {sudahLulus
                ? 'Anda dapat membuat laporan observasi.'
                : 'Selesaikan uji kelayakan untuk dapat membuat laporan.'}
            </div>
          </div>
          {!sudahLulus && (
            <button className="btn btn-sm" style={{ marginLeft: 'auto', background: '#FFC200', color: '#1A0F00', border: 'none' }}
              onClick={() => router.push('/self-assessment')}>
              Mulai Uji →
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Data Diri */}
        <div className="card animate-fadeInUp" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span>📝</span><h3>Informasi Pribadi</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              {/* Nama */}
              <div className="form-group">
                <label className="form-label">Nama Lengkap <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama lengkap Anda"
                />
              </div>

              {/* Email — dikunci */}
              <div className="form-group">
                <label className="form-label">
                  Email
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', background: 'var(--gray-100)', color: 'var(--gray-500)', padding: '2px 8px', borderRadius: 20 }}>
                    🔒 Dikunci
                  </span>
                </label>
                <input
                  className="form-input"
                  value={form.email}
                  readOnly
                  style={{ background: 'var(--gray-50)', color: 'var(--gray-400)', cursor: 'not-allowed' }}
                />
                <div className="form-hint">Email tidak dapat diubah karena terhubung dengan akun Anda.</div>
              </div>

              {/* No. HP */}
              <div className="form-group">
                <label className="form-label">No. Handphone <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.telepon}
                  onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                />
              </div>

              {user.role === 'siswa' && (
                <>
                  <div className="form-group">
                    <label className="form-label">NIS (Nomor Induk Siswa)</label>
                    <input
                      className="form-input"
                      value={form.nis}
                      onChange={e => setForm(f => ({ ...f, nis: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Masukkan NIS Anda"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelas</label>
                    <input
                      className="form-input"
                      value={form.kelas}
                      onChange={e => setForm(f => ({ ...f, kelas: e.target.value }))}
                      placeholder="Contoh: XII IPA 1"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Asal Sekolah</label>
                    <select
                      className="form-input"
                      value={form.sekolah_id || ''}
                      onChange={e => setForm(f => ({ ...f, sekolah_id: Number(e.target.value) }))}
                    >
                      <option value="" disabled>-- Pilih Sekolah --</option>
                      {(Array.isArray(sekolahs) ? sekolahs : []).map(s => (
                        <option key={s.id} value={s.id}>{s.nama}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Role */}
              <div className="form-group">
                <label className="form-label">
                  Peran
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', background: 'var(--gray-100)', color: 'var(--gray-500)', padding: '2px 8px', borderRadius: 20 }}>
                    🔒 Dikunci
                  </span>
                </label>
                <input
                  className="form-input"
                  value={user.role === 'siswa' ? 'Siswa' : 'Masyarakat Umum'}
                  readOnly
                  style={{ background: 'var(--gray-50)', color: 'var(--gray-400)', cursor: 'not-allowed' }}
                />
              </div>

              {/* Alamat */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Alamat Tempat Tinggal <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.alamat}
                  onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
                  placeholder="Jl. Nama Jalan, RT/RW, Kelurahan, Kecamatan..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Titik Tempat Tinggal (GPS) */}
        <div className="card animate-fadeInUp" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span>📍</span><h3>Titik Tempat Tinggal</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Latitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={e => setForm(f => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Longitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={e => setForm(f => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1.625rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={getLocation}
                  type="button"
                  disabled={locating}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {locating ? (
                    <>
                      <div className="spinner spinner-dark" style={{ width: 12, height: 12 }} />
                      {gpsAccuracy ? `±${gpsAccuracy}m…` : 'Mencari…'}
                    </>
                  ) : '📡 Gunakan GPS'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowMap(!showMap)}
                  type="button"
                >
                  🗺️ {showMap ? 'Tutup Peta' : 'Pilih di Peta'}
                </button>
              </div>
            </div>

            {form.latitude !== 0 && (
              <div style={{
                fontSize: '0.8125rem', color: 'var(--gray-500)',
                background: 'var(--gray-50)', padding: '0.5rem 0.875rem',
                borderRadius: 8, marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap',
              }}>
                <span>📍 {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</span>
                {gpsAccuracy !== null && (
                  <span className={`badge ${gpsAccuracy <= 10 ? 'badge-green' : gpsAccuracy <= 30 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: '0.6875rem' }}>
                    {gpsAccuracy <= 10 ? '✓' : '⚠'} Akurasi ±{gpsAccuracy} m
                  </span>
                )}
              </div>
            )}

            {showMap && (
              <div style={{ borderRadius: 12, overflow: 'hidden', height: 320, border: '2px solid var(--primary-light)' }}>
                <MapPicker
                  lat={form.latitude || -0.5}
                  lng={form.longitude || 117.15}
                  onChange={(pos) => setForm(f => ({ ...f, latitude: pos.lat, longitude: pos.lng }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Keamanan Akun */}
        <div className="card animate-fadeInUp" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span>🔐</span>
            <h3>Keamanan Akun</h3>
            <button
              className={`btn btn-sm ${showPassForm ? 'btn-ghost' : 'btn-outline'}`}
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowPassForm(!showPassForm)}
            >
              {showPassForm ? 'Batal' : '🔑 Ubah Password'}
            </button>
          </div>

          {showPassForm ? (
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Password Baru <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 karakter"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Konfirmasi Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-input"
                    type="password"
                    value={form.password_confirmation}
                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>
              {form.password && form.password !== form.password_confirmation && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  ⚠️ Password tidak cocok
                </div>
              )}
            </div>
          ) : (
            <div className="card-body" style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>
              Klik tombol <strong>Ubah Password</strong> untuk mengganti password akun Anda.
            </div>
          )}
        </div>

      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>Batal</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}
