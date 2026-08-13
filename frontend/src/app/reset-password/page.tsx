'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      toast.error('Tautan tidak valid atau kadaluarsa.')
      router.push('/lupa-password')
    }
  }, [token])

  const passwordStrength = (p: string) => {
    if (!p) return null
    if (p.length < 8) return { level: 'lemah', color: '#EF4444', width: '33%' }
    if (p.length < 12 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 'cukup', color: '#EA580C', width: '66%' }
    return { level: 'kuat', color: '#22C55E', width: '100%' }
  }
  const strength = passwordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = 'Password minimal 8 karakter'
    if (password !== passwordConfirmation) errs.password_confirmation = 'Konfirmasi password tidak cocok'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await authApi.resetPassword({ token, email, password, password_confirmation: passwordConfirmation })
      setDone(true)
      toast.success('Password berhasil direset!')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.errors) {
        const mapped: Record<string, string> = {}
        Object.entries(data.errors).forEach(([k, v]: any) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else {
        toast.error(data?.error || data?.message || 'Token tidak valid atau kadaluarsa.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)', padding: '1.5rem' }}>
      <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png?v=3" alt="Tengok Tetangga" width={80} height={80} style={{ display: 'inline-block', marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#3D2B00' }}>Tengok Tetangga</div>
          <div style={{ fontSize: '0.8125rem', color: '#4A3300', opacity: 0.7 }}>Kota Bontang</div>
        </div>

        <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {!done ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔑</div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Buat Password Baru</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Masukkan password baru untuk akun Anda</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Email (readonly) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}
                    required
                  />
                </div>

                {/* Password baru */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                      autoComplete="new-password"
                      style={{ paddingRight: '2.75rem' }}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '1rem', lineHeight: 1 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: '0.375rem' }}>
                      <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'width 0.3s', borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: strength.color, marginTop: '0.25rem', fontWeight: 600 }}>Kekuatan: {strength.level}</div>
                    </div>
                  )}
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                {/* Konfirmasi */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Konfirmasi Password</label>
                  <input
                    className={`form-input ${errors.password_confirmation ? 'input-error' : ''}`}
                    type="password"
                    placeholder="Ulangi password baru"
                    value={passwordConfirmation}
                    onChange={e => { setPasswordConfirmation(e.target.value); setErrors(p => ({ ...p, password_confirmation: '' })) }}
                    autoComplete="new-password"
                    required
                  />
                  {errors.password_confirmation && <div className="form-error">{errors.password_confirmation}</div>}
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                  {submitting ? <><div className="spinner" /> Menyimpan...</> : '✅ Simpan Password Baru'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>Password Berhasil Direset!</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Password akun Anda telah diperbarui. Silakan masuk dengan password baru Anda.
              </p>
              <Link href="/login" className="btn btn-primary btn-full btn-lg" style={{ display: 'flex', justifyContent: 'center' }}>
                🔐 Masuk Sekarang
              </Link>
            </div>
          )}
        </div>

        {!done && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
              ← Kembali ke Login
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .input-error { border-color: var(--danger) !important; }
        .form-error { color: var(--danger); font-size: 0.8125rem; margin-top: 0.25rem; }
      `}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4' }}>
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}