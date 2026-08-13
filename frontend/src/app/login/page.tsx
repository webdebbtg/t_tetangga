'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal'

/* ── Tipe global untuk Cloudflare Turnstile ───────────────────────── */
declare global {
  interface Window {
    turnstile: {
      render:  (el: HTMLElement, params: Record<string, unknown>) => string
      reset:   (widgetId: string) => void
      remove:  (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const TURNSTILE_SITE_KEY = '0x4AAAAAADVPwMVsl7SL3WFt'

/* ── LoginForm (dipisah untuk Suspense / useSearchParams) ─────────── */
function LoginForm() {
  const { user, loading, setToken } = useAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* Turnstile */
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef  = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>('')
  const [showPrivacy, setShowPrivacy] = useState(false)

  /* ── Inisialisasi widget Turnstile ──────────────────────────────── */
  const renderTurnstile = () => {
    if (!captchaRef.current || typeof window.turnstile === 'undefined') return
    if (widgetIdRef.current) {
      try { window.turnstile.remove(widgetIdRef.current) } catch {}
      widgetIdRef.current = ''
    }
    widgetIdRef.current = window.turnstile.render(captchaRef.current, {
      sitekey:            TURNSTILE_SITE_KEY,
      theme:              'light',
      language:           'id',
      callback:           (token: string)  => setCaptchaToken(token),
      'expired-callback': ()               => setCaptchaToken(''),
      'error-callback':   ()               => setCaptchaToken(''),
    })
  }

  useEffect(() => {
    /* Callback yang dipanggil setelah script Turnstile selesai dimuat */
    window.onTurnstileLoad = renderTurnstile
    /* Jika script sudah ada di cache dan langsung tersedia */
    if (typeof window.turnstile !== 'undefined') renderTurnstile()

    return () => {
      if (widgetIdRef.current && typeof window.turnstile !== 'undefined') {
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
      }
    }
  }, [])

  /* ── Google OAuth error dari redirect ──────────────────────────── */
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'google_failed') {
      const detail = searchParams.get('detail')
      toast.error(
        detail ? `Login Google gagal: ${decodeURIComponent(detail)}` : 'Login Google gagal. Cek log backend.',
        { duration: 10000 },
      )
    }
  }, [])

  /* ── Redirect kalau sudah login ─────────────────────────────────── */
  useEffect(() => {
    if (!loading && user) redirectByRole(user.role)
  }, [user, loading])

  const redirectByRole = (role: string) => {
    if (role === 'admin')    router.push('/admin/dashboard')
    else if (role === 'opd') router.push('/opd/dashboard')
    else if (role === 'guru')router.push('/guru/laporan')
    else                     router.push('/dashboard')
  }

  /* ── Google login ──────────────────────────────────────────────── */
  const handleGoogleLogin = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const res = await authApi.googleRedirect(origin)
      window.location.href = res.data.url
    } catch {
      toast.error('Gagal terhubung ke server.')
    }
  }

  /* ── Email / Password login ─────────────────────────────────────── */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Email dan password wajib diisi'); return }
    if (!captchaToken) {
      toast.error('Selesaikan verifikasi CAPTCHA terlebih dahulu.')
      return
    }

    setSubmitting(true)
    try {
      const res = await authApi.login(email, password, captchaToken)
      await setToken(res.data.token)
      toast.success('Selamat datang!')
      redirectByRole(res.data.user.role)
    } catch (err: any) {
      /* Reset captcha agar user bisa coba lagi */
      if (widgetIdRef.current && typeof window.turnstile !== 'undefined') {
        window.turnstile.reset(widgetIdRef.current)
      }
      setCaptchaToken('')

      const data = err.response?.data
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK'
      const errMsg = isNetworkError
        ? 'Gagal terhubung ke server backend. Pastikan server backend Anda sedang berjalan.'
        : (data?.error ||
           data?.message ||
           (data?.errors?.cf_turnstile_response
             ? 'Verifikasi CAPTCHA gagal. Muat ulang halaman dan coba lagi.'
             : null) ||
           (data?.errors?.email?.[0]) ||
           (data?.errors?.password?.[0]) ||
           'Login gagal. Periksa email dan password Anda.')

      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Script Cloudflare Turnstile — muat setelah halaman interaktif */}
      <Script
        src={`https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit`}
        strategy="afterInteractive"
      />

      <div
        className="login-container"
        style={{ height: '100vh', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'white' }}
      >
        {/* ── Left Hero ─────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #3D2B00 0%, #5C3E00 20%, #8B6800 50%, #FFC200 75%, #FFE566 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '2rem 2.25rem', color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,229,102,0.15)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(204,155,0,0.14)' }} />
          <div style={{ position: 'absolute', top: '42%', right: '8%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <div className="animate-fadeInUp" style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer' }}
              onClick={() => router.push('/')}
              title="Kembali ke Beranda"
            >
              <img
                src="/logo.png?v=3"
                alt="Tengok Tetangga"
                width={56}
                height={56}
                style={{ display: 'block', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Tengok Tetangga</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Kota Bontang</div>
              </div>
            </div>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.625rem', color: 'white', letterSpacing: '-0.02em' }}>
              Peduli, Laporkan,<br />
              <span style={{ color: '#FFE566' }}>Ubah Bersama</span>
            </h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 380 }}>
              Platform pelaporan kondisi sosial warga berbasis data. Setiap laporan berkontribusi nyata dalam pengambilan keputusan pemerintah.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { icon: '🎯', title: 'Self-Assessment Terstandarisasi',  desc: 'Uji kelayakan pelapor sebelum observasi lapangan' },
                { icon: '📍', title: 'Observasi Berbasis GPS & Foto',     desc: 'Akurasi lokasi tinggi dengan dokumentasi visual' },
                { icon: '🏛️', title: 'Terhubung Langsung ke OPD',        desc: 'Laporan diteruskan ke dinas yang tepat dan bertanggung jawab' },
                { icon: '⏱️', title: 'Pemantauan SLA 2×24 Jam',          desc: 'Pastikan setiap laporan ditangani tepat waktu' },
              ].map((f) => (
                <div key={f.icon} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 10, padding: '0.625rem 0.875rem',
                }}>
                  <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, lineHeight: 1.3 }}>{f.title}</div>
                    <div style={{ fontSize: '0.7375rem', opacity: 0.75, marginTop: '0.125rem', lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Login ──────────────────────────────── */}
        <div
          className="login-right-panel"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#FEFCE8', overflowY: 'auto' }}
        >
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 400 }}>

            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', color: '#3D2B00' }}>Masuk ke Akun Anda</h2>
              <p style={{ color: '#4A3300', opacity: 0.65, fontSize: '0.875rem' }}>Masukkan email dan password Anda</p>
            </div>

            <div className="card" style={{ padding: '1.375rem', boxShadow: '0 8px 32px rgba(148,115,0,0.13)', marginBottom: '0.75rem', border: '1px solid rgba(255,194,0,0.25)', background: 'white' }}>
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#3D2B00', fontWeight: 600 }}>Alamat Email</label>
                  <input
                    className="form-input login-input"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <label className="form-label" style={{ margin: 0, color: '#3D2B00', fontWeight: 600 }}>Password</label>
                    <Link href="/lupa-password" style={{ fontSize: '0.8125rem', color: '#A07800', fontWeight: 600, textDecoration: 'none' }}>
                      Lupa Password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input login-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A5500', fontSize: '1rem', lineHeight: 1 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* ── Cloudflare Turnstile CAPTCHA ────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div
                    ref={captchaRef}
                    style={{ minHeight: 65 }}
                    aria-label="Verifikasi keamanan CAPTCHA"
                  />
                  {!captchaToken && (
                    <p style={{ fontSize: '0.7rem', color: '#7A5500', opacity: 0.7, margin: 0, lineHeight: 1.4 }}>
                      🔒 Selesaikan verifikasi di atas untuk melanjutkan
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !captchaToken}
                  className="btn-login-primary"
                  style={{ marginTop: '0.125rem' }}
                >
                  {submitting
                    ? <><div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Memverifikasi...</>
                    : '🔐 Masuk'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,194,0,0.3)' }} />
                <span style={{ fontSize: '0.8125rem', color: '#7A5500', whiteSpace: 'nowrap' }}>atau masuk dengan</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,194,0,0.3)' }} />
              </div>

              <button onClick={handleGoogleLogin} className="btn-login-google">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '0.625rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#4A3300', opacity: 0.7 }}>Belum punya akun? </span>
              <Link href="/daftar" style={{ fontSize: '0.875rem', color: '#A07800', fontWeight: 700, textDecoration: 'none' }}>
                Daftar Sekarang
              </Link>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#7A5500', opacity: 0.55, marginTop: '0.5rem', lineHeight: 1.6 }}>
              Dengan masuk, Anda menyetujui{' '}
              <a href="#" style={{ color: '#A07800', opacity: 1 }}>Syarat & Ketentuan</a> dan{' '}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#A07800', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', opacity: 1 }}
              >
                Kebijakan Privasi
              </button>
              {' '}Tengok Tetangga.
            </p>

            {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
          </div>
        </div>

        <style>{`
          /* Tombol utama — kuning Golkar */
          .btn-login-primary {
            padding: 0.75rem;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            font-weight: 700;
            font-size: 1rem;
            background: linear-gradient(135deg, #FFC200 0%, #CC9B00 100%);
            color: #1A0F00;
            box-shadow: 0 4px 16px rgba(204,155,0,0.38);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
          }
          .btn-login-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #FFD740 0%, #CC9B00 100%);
            box-shadow: 0 6px 20px rgba(204,155,0,0.48);
            transform: translateY(-1px);
          }
          .btn-login-primary:disabled {
            background: #D1D5DB;
            box-shadow: none;
            cursor: not-allowed;
            opacity: 0.75;
            color: #6B7280;
          }

          /* Tombol Google */
          .btn-login-google {
            width: 100%;
            padding: 0.6875rem;
            border-radius: 10px;
            border: 1.5px solid rgba(255,194,0,0.4);
            background: white;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9375rem;
            color: #3D2B00;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            transition: all 0.2s ease;
          }
          .btn-login-google:hover {
            background: #FFFDE0;
            border-color: #FFC200;
          }

          /* Input focus */
          .login-input:focus {
            border-color: #FFC200 !important;
            box-shadow: 0 0 0 3px rgba(255,194,0,0.2) !important;
            outline: none;
          }

          /* ── Mobile Responsiveness ─────────────────── */
          @media (max-width: 768px) {
            .login-container {
              grid-template-columns: 1fr !important;
              height: auto !important;
              min-height: 100dvh !important;
              overflow-y: auto !important;
            }
            /* Sembunyikan hero di mobile */
            .login-container > div:first-child {
              display: none !important;
            }
            /* Panel form memenuhi layar */
            .login-right-panel {
              min-height: 100dvh !important;
              align-items: flex-start !important;
              padding: 2rem 1.25rem !important;
              overflow-y: auto !important;
            }
          }

          /* Landscape mode — sedikit lebih compact */
          @media (max-width: 768px) and (orientation: landscape) {
            .login-right-panel {
              padding: 1.25rem !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}

/* ── Halaman utama — dibungkus Suspense untuk useSearchParams ─────── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEFCE8' }}>
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
