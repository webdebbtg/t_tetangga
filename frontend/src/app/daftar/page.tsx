'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal'

export default function DaftarPage() {
  const { setToken } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', telepon: '', password: '', password_confirmation: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPrivacy, setShowPrivacy] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Nama wajib diisi'
    if (!form.email.trim()) errs.email = 'Email wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Format email tidak valid'
    if (!form.telepon.trim()) errs.telepon = 'No. Handphone wajib diisi'
    else if (!/^[0-9+]{8,15}$/.test(form.telepon.trim())) errs.telepon = 'Format No. Handphone tidak valid'
    if (!form.password) errs.password = 'Password wajib diisi'
    else if (form.password.length < 8) errs.password = 'Password minimal 8 karakter'
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Konfirmasi password tidak cocok'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const res = await authApi.register(form)
      await setToken(res.data.token)
      toast.success('🎉 Akun berhasil dibuat! Lengkapi profil Anda.')
      router.push('/profil/lengkapi')
    } catch (err: any) {
      const data = err.response?.data
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK'
      if (isNetworkError) {
        toast.error('Gagal terhubung ke server backend. Pastikan server backend Anda sedang berjalan.')
      } else if (data?.errors) {
        const mapped: Record<string, string> = {}
        Object.entries(data.errors).forEach(([k, v]: any) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else {
        toast.error(data?.message || data?.error || 'Pendaftaran gagal. Coba lagi.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    try {
      const res = await authApi.googleRedirect()
      window.location.href = res.data.url
    } catch {
      toast.error('Gagal terhubung ke server.')
    }
  }

  const passwordStrength = (p: string) => {
    if (!p) return null
    if (p.length < 8) return { level: 'lemah', color: '#EF4444', width: '33%' }
    if (p.length < 12 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 'cukup', color: '#EA580C', width: '66%' }
    return { level: 'kuat', color: '#22C55E', width: '100%' }
  }
  const strength = passwordStrength(form.password)

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'white' }}>

      {/* Left Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #3D2B00 0%, #5C3E00 30%, #8B6800 65%, #FFC200 85%, #FFE566 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '2rem 2.25rem', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div className="animate-fadeInUp" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <img
              src="/logo.png?v=3"
              alt="Tengok Tetangga"
              width={56}
              height={56}
              style={{ display: 'block', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>Tengok Tetangga</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Kota Bontang</div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.25, marginBottom: '0.75rem', color: 'white' }}>
            Bergabung &<br />Buat Perbedaan
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.88, lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: 360 }}>
            Daftarkan diri dan mulai berkontribusi dalam program sosial Kota Bontang. Setiap laporan Anda berarti.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { step: '1', title: 'Buat Akun', desc: 'Daftar dengan email atau Google' },
              { step: '2', title: 'Uji Kelayakan', desc: 'Ikuti Self-Assessment singkat' },
              { step: '3', title: 'Buat Laporan', desc: 'Lakukan observasi & kirim laporan' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8125rem', flexShrink: 0 }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.82, marginTop: '0.0625rem' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>

      {/* Right Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#FEFCE8', overflowY: 'auto' }}>
        <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem', color: '#3D2B00' }}>Buat Akun Baru</h2>
            <p style={{ color: '#4A3300', fontSize: '0.8375rem', opacity: 0.8 }}>Gratis — hanya butuh beberapa menit</p>
          </div>

          {/* Google Register */}
          <button onClick={handleGoogle} className="btn-daftar-google" style={{ width: '100%', marginBottom: '0.875rem' }}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Daftar dengan Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,194,0,0.35)' }} />
            <span style={{ fontSize: '0.75rem', color: '#4A3300', opacity: 0.7 }}>atau daftar dengan email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,194,0,0.35)' }} />
          </div>

          <div className="card" style={{ padding: '1.25rem', boxShadow: '0 4px 24px rgba(148,115,0,0.10)', border: '1px solid rgba(255,194,0,0.3)', background: 'white', borderRadius: 14 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Nama */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', color: '#3D2B00', fontWeight: 600 }}>Nama Lengkap</label>
                <input className={`form-input daftar-input ${errors.name ? 'input-error' : ''}`} type="text" placeholder="Nama sesuai identitas" value={form.name} onChange={set('name')} autoComplete="name" />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', color: '#3D2B00', fontWeight: 600 }}>Alamat Email</label>
                <input className={`form-input daftar-input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="nama@email.com" value={form.email} onChange={set('email')} autoComplete="email" />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              {/* No. Handphone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', color: '#3D2B00', fontWeight: 600 }}>No. Handphone</label>
                <input className={`form-input daftar-input ${errors.telepon ? 'input-error' : ''}`} type="tel" placeholder="08xxxxxxxxxx" value={form.telepon} onChange={set('telepon')} />
                {errors.telepon && <div className="form-error">{errors.telepon}</div>}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', color: '#3D2B00', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className={`form-input daftar-input ${errors.password ? 'input-error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Minimal 8 karakter" value={form.password} onChange={set('password')} autoComplete="new-password" style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A5500', fontSize: '1rem', lineHeight: 1 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {strength && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{ height: 3, background: 'rgba(255,194,0,0.25)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: strength.color, marginTop: '0.1875rem', fontWeight: 600 }}>Kekuatan: {strength.level}</div>
                  </div>
                )}
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              {/* Konfirmasi Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', color: '#3D2B00', fontWeight: 600 }}>Konfirmasi Password</label>
                <div style={{ position: 'relative' }}>
                  <input className={`form-input daftar-input ${errors.password_confirmation ? 'input-error' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Ulangi password" value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A5500', fontSize: '1rem', lineHeight: 1 }}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password_confirmation && <div className="form-error">{errors.password_confirmation}</div>}
              </div>

              <button type="submit" className="btn-daftar-primary" disabled={submitting} style={{ marginTop: '0.25rem' }}>
                {submitting ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Membuat Akun...</> : '🚀 Buat Akun'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.875rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#4A3300' }}>Sudah punya akun? </span>
            <Link href="/login" style={{ fontSize: '0.875rem', color: '#A07800', fontWeight: 700, textDecoration: 'none' }}>
              Masuk di sini
            </Link>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#4A3300', opacity: 0.6, marginTop: '0.5rem', lineHeight: 1.6 }}>
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" style={{ color: '#A07800' }}>Syarat & Ketentuan</a> dan{' '}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              style={{ background: 'none', border: 'none', padding: 0, color: '#A07800', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Kebijakan Privasi
            </button>
            {' '}kami.
          </p>

          {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        </div>
      </div>

      <style>{`
        .input-error { border-color: var(--danger) !important; }
        .form-error { color: var(--danger); font-size: 0.75rem; margin-top: 0.2rem; }

        .daftar-input {
          border-color: rgba(255,194,0,0.4) !important;
          background: #FEFCE8 !important;
          font-size: 0.875rem !important;
          padding: 0.5rem 0.75rem !important;
          border-radius: 8px !important;
        }
        .daftar-input:focus {
          border-color: #FFC200 !important;
          box-shadow: 0 0 0 3px rgba(255,194,0,0.2) !important;
          outline: none !important;
        }

        .btn-daftar-primary {
          width: 100%;
          padding: 0.625rem 1rem;
          background: linear-gradient(135deg, #FFC200 0%, #CC9B00 100%);
          color: #1A0F00;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 4px 14px rgba(204,155,0,0.35);
        }
        .btn-daftar-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .btn-daftar-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-daftar-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.5625rem 1rem;
          background: white;
          border: 1.5px solid rgba(255,194,0,0.4);
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #3D2B00;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .btn-daftar-google:hover {
          background: #FFFDE0;
          border-color: #FFC200;
          box-shadow: 0 2px 8px rgba(255,194,0,0.15);
        }

        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; height: auto !important; overflow: auto !important; }
          div[style*="grid-template-columns: 1fr 1fr"] > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  )
}
