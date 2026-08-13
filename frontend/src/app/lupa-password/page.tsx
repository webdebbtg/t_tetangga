'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Masukkan alamat email Anda'); return }
    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message
      if (err.response?.status === 422 || msg?.includes('tidak ditemukan') || msg?.includes('not found')) {
        toast.error('Email tidak terdaftar.')
      } else {
        toast.error(msg || 'Gagal mengirim. Coba lagi.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)', padding: '1.5rem' }}>
      <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png?v=3" alt="Tengok Tetangga" width={80} height={80} style={{ display: 'inline-block', marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#3D2B00' }}>Tengok Tetangga</div>
          <div style={{ fontSize: '0.8125rem', color: '#4A3300', opacity: 0.7 }}>Kota Bontang</div>
        </div>

        <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {!sent ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.5rem' }}>Lupa Password?</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mereset password Anda.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Alamat Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                  {submitting ? <><div className="spinner" /> Mengirim...</> : '📧 Kirim Tautan Reset'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>Email Terkirim!</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Kami telah mengirimkan tautan reset password ke <strong>{email}</strong>.<br />
                Periksa kotak masuk (dan folder spam) Anda.
              </p>
              <div className="alert alert-info" style={{ marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.875rem' }}>
                💡 Tautan akan kadaluarsa dalam <strong>60 menit</strong>. Jika tidak menerima email, periksa folder spam atau coba lagi.
              </div>
              <button onClick={() => { setSent(false); setEmail('') }} className="btn btn-ghost btn-full" style={{ color: 'var(--primary)' }}>
                Kirim ulang ke email lain
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            ← Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  )
}
