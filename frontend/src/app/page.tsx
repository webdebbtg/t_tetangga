'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { publik } from '@/lib/api'

// ── Data statis urusan
const URUSAN = [
  { icon: '🏠', name: 'Tempat Tinggal Tidak Layak', iconBg: '#FFFDF5', iconBorder: '#F5E6C4' },
  { icon: '🍽️', name: 'Kerawanan Pangan', iconBg: '#FFF5F5', iconBorder: '#FAD2D2' },
  { icon: '🏥', name: 'Akses Kesehatan Terbatas', iconBg: '#F4FBF7', iconBorder: '#D2F2E1' },
  { icon: '📚', name: 'Putus Sekolah', iconBg: '#F5FAFE', iconBorder: '#D2E8FA' },
  { icon: '💼', name: 'Pengangguran', iconBg: '#F8F5FE', iconBorder: '#E2D6FB' },
  { icon: '👴', name: 'Lansia Terlantar', iconBg: '#F5FDFD', iconBorder: '#D2F3F3' },
  { icon: '♿', name: 'Disabilitas', iconBg: '#F5F6FE', iconBorder: '#D6DBFB' },
  { icon: '👶', name: 'Balita Stunting', iconBg: '#FFFDF0', iconBorder: '#F9EBAA' },
  { icon: '💧', name: 'Sanitasi & Air Bersih', iconBg: '#F0FDFA', iconBorder: '#CCFBF1' },
  { icon: '🌊', name: 'Korban Bencana', iconBg: '#EFF6FF', iconBorder: '#BFDBFE' },
  { icon: '🧠', name: 'Gangguan Jiwa', iconBg: '#FDF2F8', iconBorder: '#FBCFE8' },
  { icon: '👪', name: 'Kekerasan dalam Keluarga', iconBg: '#FFF5F5', iconBorder: '#FECACA' },
  { icon: '📦', name: 'Bansos Tidak Tepat Sasaran', iconBg: '#FFFBEB', iconBorder: '#FEF3C7' },
  { icon: '🤰', name: 'Ibu Hamil', iconBg: '#FFF5F5', iconBorder: '#FECACA' },
]

const FAQ_LIST = [
  {
    q: 'Siapa yang bisa menggunakan aplikasi ini?',
    a: 'Seluruh Masyarakat dan pelajar SMA/SMK/MA di Kota Bontang yang terdaftar dapat menggunakan aplikasi ini untuk melakukan observasi sosial di lingkungan sekitar tempat tinggal.',
  },
  {
    q: 'Apakah identitas pelapor dijaga kerahasiaannya?',
    a: 'Ya. Identitas pelapor tidak ditampilkan secara publik dan hanya diakses oleh instansi berwenang untuk keperluan verifikasi dan penanganan laporan.',
  },
  {
    q: 'Berapa lama laporan akan ditindaklanjuti?',
    a: 'Laporan yang telah diteruskan ke OPD terkait dengan SLA 2×24 jam untuk respons awal dan pembaruan status.',
  },
  {
    q: 'Bagaimana cara melacak status laporan saya?',
    a: 'Status laporan dapat dipantau secara real-time pada halaman utama atau pada menu "Laporan Terbaru".',
  },
  {
    q: 'Apa itu poin kegiatan dan bagaimana cara mendapatkannya?',
    a: 'Poin kegiatan diberikan guru pembimbing sebagai apresiasi atas laporan yang telah selesai diverifikasi dan ditindaklanjuti oleh OPD terkait.',
  },
  {
    q: 'Siapa yang memverifikasi laporan sebelum diteruskan ke OPD?',
    a: 'Guru pembimbing di sekolah masing-masing bertugas memverifikasi laporan siswa, memastikan keakuratan data, dan menentukan OPD tujuan yang tepat.',
  },
  {
    q: 'Apakah laporan bisa dibatalkan setelah dikirim?',
    a: 'Laporan yang sudah dikirim tidak dapat dibatalkan secara mandiri. Silakan hubungi guru pembimbing jika terdapat kesalahan data pada laporan Anda.',
  },
  {
    q: 'Apakah aplikasi ini tersedia di perangkat mobile?',
    a: 'Aplikasi ini dapat diakses melalui browser di smartphone maupun komputer. Tampilan sudah dioptimalkan untuk penggunaan di perangkat mobile.',
  },
]

const STATUS_CONFIG: Record<string, { color: string; label: string; textColor: string }> = {
  DRAFT:                    { color: '#6B7280', label: 'Draft',      textColor: '#374151' },
  MENUNGGU_VERIFIKASI_GURU: { color: '#F59E0B', label: 'Menunggu Guru',textColor: '#92400E' },
  TERVERIFIKASI:            { color: '#3B82F6', label: 'Terverifikasi',textColor: '#1D4ED8' },
  AUTO_ROUTED:              { color: '#3B82F6', label: 'Diteruskan OPD',textColor: '#1D4ED8' },
  DALAM_PENANGANAN:         { color: '#F59E0B', label: 'Diproses',   textColor: '#92400E' },
  DILIMPAHKAN:              { color: '#EF4444', label: 'Dilimpahkan', textColor: '#991B1B' },
  KOLABORASI:               { color: '#10B981', label: 'Kolaborasi', textColor: '#065F46' },
  SELESAI:                  { color: '#10B981', label: 'Selesai',    textColor: '#065F46' },
  DITOLAK:                  { color: '#EF4444', label: 'Ditolak',    textColor: '#991B1B' },
}

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [stats, setStats] = useState({ total_laporan: 0, laporan_selesai: 0, laporan_proses: 0, tingkat_penyelesaian: 0 })
  const [laporan, setLaporan] = useState<any[]>([])
  const [navScrolled, setNavScrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publik.landing().then(res => {
      setStats(res.data.stats)
      setLaporan(res.data.laporan)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const getStatus = (s: string) => STATUS_CONFIG[s] ?? { color: '#9CA3AF', label: s, textColor: '#374151' }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FDFCF7', color: '#1C1400', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        padding: '0 6%', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navScrolled ? 'rgba(253,252,247,0.96)' : 'linear-gradient(to bottom,rgba(0,0,0,0.48),transparent)',
        borderBottom: navScrolled ? '1px solid #EDE4C0' : 'none',
        backdropFilter: navScrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img
            src="/logo.png?v=3"
            alt="Logo Tengok Tetangga"
            style={{
              width: 42,
              height: 42,
              objectFit: 'contain',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: navScrolled ? '#1C1400' : 'white', letterSpacing: '-0.01em', transition: 'color 0.3s' }}>
            Tengok<span style={{ color: '#FFC200' }}>Tetangga</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Beranda',         id: 'hero-section' },
            { label: 'Jenis Urusan',    id: 'urusan-section' },
            { label: 'Laporan Terbaru', id: 'laporan-section' },
          ].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} style={{
              color: navScrolled ? '#4A3B10' : 'rgba(255,255,255,0.82)',
              fontSize: '0.85rem', fontWeight: 500,
              padding: '7px 14px', borderRadius: 7,
              border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}>{item.label}</button>
          ))}
          <button onClick={() => router.push('/login')} style={{
            background: 'rgba(255,194,0,0.9)', color: '#1C1400',
            fontSize: '0.85rem', fontWeight: 700,
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            marginLeft: 4, transition: 'all 0.2s',
          }}>Masuk →</button>
        </div>
      </nav>

      {/* ── HERO (full video bg) ── */}
      <div id="hero-section" style={{
        position: 'relative', width: '100%', height: '100vh', minHeight: 560,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Local Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
          Browser Anda tidak mendukung tag video HTML5.
        </video>
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom,rgba(10,7,0,0.52) 0%,rgba(10,7,0,0.38) 40%,rgba(10,7,0,0.60) 100%)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,194,0,0.14)', border: '1px solid rgba(255,194,0,0.35)',
            color: '#FFD84D', fontSize: '0.72rem', fontWeight: 700,
            padding: '5px 14px', borderRadius: 999,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            marginBottom: 20, backdropFilter: 'blur(8px)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFC200', display: 'inline-block' }} />
            Kota Bontang — Kesejahteraan Sosial
          </div>

          <h1 style={{
            fontSize: 'clamp(2.75rem,7vw,5.5rem)',
            fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.035em',
            color: 'white', marginBottom: 16,
            textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}>
            Pantau.<br />
            <span style={{ background: 'linear-gradient(135deg,#FFD84D,#FFC200)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Laporkan.
            </span><br />
            Selesaikan.
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.72)', fontSize: '1.0625rem',
            lineHeight: 1.6, marginBottom: 36, maxWidth: 500,
            textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          }}>
            Platform digital observasi kondisi sosial warga Kota Bontang.<br />
            Bersama kita jaga kepedulian antartetangga.
          </p>

          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'rgba(255,194,0,0.92)', color: '#1C1400',
              fontWeight: 800, fontSize: '1rem',
              padding: '14px 40px', border: 'none', borderRadius: 40, cursor: 'pointer',
              boxShadow: '0 0 0 6px rgba(255,194,0,0.2),0 8px 28px rgba(0,0,0,0.25)',
              letterSpacing: '0.01em', transition: 'all 0.25s',
            }}
          >
            Akses Layanan
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%',
          zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem',
          animation: 'bobble 2.5s ease-in-out infinite',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
          }}>↓</div>
        </div>
      </div>

      {/* ── STATS SECTION ── */}
      <section style={{
        padding: '48px 6% 24px 6%',
        background: '#FDFCF7',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {[
            {
              n: stats.total_laporan.toLocaleString('id-ID'),
              l: 'Total Laporan Masuk',
              icon: '📊',
              iconBg: '#FFFBEB',
              iconBorder: '#F0D87A',
            },
            {
              n: stats.laporan_selesai.toLocaleString('id-ID'),
              l: 'Total Laporan Selesai',
              icon: '✅',
              iconBg: '#F0FDF4',
              iconBorder: '#BBF7D0',
            },
            {
              n: stats.laporan_proses.toLocaleString('id-ID'),
              l: 'Laporan Proses',
              icon: '🔄',
              iconBg: '#EFF6FF',
              iconBorder: '#BFDBFE',
            },
            {
              n: `${stats.tingkat_penyelesaian}%`,
              l: 'Laporan Ditindaklanjuti',
              icon: '🎯',
              iconBg: '#FDF2F8',
              iconBorder: '#FBCFE8',
            },
          ].map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{
                background: 'white',
                border: '1.5px solid #EDE4C0',
                borderRadius: '9999px',
                padding: '16px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 20px rgba(74, 59, 16, 0.04)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: s.iconBg,
                border: `1px solid ${s.iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: '#D4A000',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#8A7040',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}>
                  {s.l}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JENIS URUSAN (logo wall) ── */}
      <section id="urusan-section" style={{ padding: '52px 6%', background: '#FDFCF7' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
            Cakupan Layanan
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.375rem,2.5vw,1.875rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 6 }}>
            Urusan Sosial
          </h2>
          <p style={{ color: '#8A7040', fontSize: '0.875rem', margin: 0, maxWidth: 600 }}>
            Setiap laporan dikategorikan berdasarkan jenis kebutuhan sosial warga untuk penanganan yang tepat dan cepat.
          </p>
        </div>

        <div className="urusan-grid">
          {URUSAN.map((u, i) => (
            <div
              key={i}
              className="urusan-card"
              style={{
                background: 'white',
                border: '1.5px solid #EDE4C0',
                borderRadius: '9999px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(28, 20, 0, 0.02)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: u.iconBg,
                border: `1px solid ${u.iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {u.icon}
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#4A3B10',
                lineHeight: 1.25,
                textAlign: 'left',
              }}>
                {u.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LAPORAN TERBARU (5 kartu) ── */}
      <section id="laporan-section" style={{ padding: '52px 6%', background: 'white', borderTop: '1px solid #EDE4C0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
            Transparansi Data
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.375rem,2.5vw,1.875rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
            Laporan Terbaru
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {Array(5).fill(null).map((_, i) => (
              <div key={i} style={{
                background: '#FDFCF7', border: '1.5px solid #EDE4C0',
                borderRadius: 12, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#FFC200,#D4A000)' }} />
                {[70, 85, 60, 55, 40].map((w, j) => (
                  <div key={j} style={{ height: j === 0 ? 20 : 12, borderRadius: 4, width: `${w}%`, background: '#F0E8CC' }} />
                ))}
              </div>
            ))}
          </div>
        ) : laporan.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#FDFCF7', border: '1.5px solid #EDE4C0', borderRadius: 12,
            color: '#8A7040', fontSize: '0.9rem', fontWeight: 600
          }}>
            📭 Belum ada laporan terbaru yang masuk.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {laporan.map((l, i) => {
              const st = getStatus(l.status_laporan)
              return (
                <div key={i} style={{
                  background: '#FDFCF7', border: '1.5px solid #EDE4C0',
                  borderRadius: 12, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#FFC200,#D4A000)' }} />
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: '#7A5500', background: '#FFFBEB', padding: '3px 7px', borderRadius: 5, border: '1px solid #F0D87A', width: 'fit-content' }}>
                    {l.kode_laporan}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#4A3B10', display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {l.kecamatan}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8A7040', paddingLeft: 16 }}>Kel. {l.kelurahan}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.62rem', color: '#8A7040', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Kesimpulan:</span>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#7A5500',
                      background: '#FFFDF5',
                      border: '1px solid #EDE4C0',
                      padding: '4px 8px',
                      borderRadius: 6,
                      lineHeight: 1.2
                    }}>
                      {l.kesimpulan?.replace(/_/g, ' ') || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: st.textColor }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: '0.67rem', color: '#8A7040', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #EDE4C0' }}>
                    📅 {l.submitted_at}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button onClick={() => router.push('/login')} style={{
            color: '#8A7040', fontSize: '0.8rem', fontWeight: 700,
            padding: '10px 24px', border: '1.5px solid #EDE4C0',
            borderRadius: 8, background: 'white', cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: '0 2px 4px rgba(28, 20, 0, 0.02)',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#FFC200';
              e.currentTarget.style.color = '#D4A000';
              e.currentTarget.style.background = '#FFFBEB';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#EDE4C0';
              e.currentTarget.style.color = '#8A7040';
              e.currentTarget.style.background = 'white';
            }}
          >
            Lihat Semua Laporan →
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '52px 6%', background: '#F9F5E8', borderTop: '1px solid #EDE4C0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
            FAQ
            <span style={{ width: 16, height: 2, background: '#FFC200', borderRadius: 2, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.375rem,2.5vw,1.875rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
            Pertanyaan Umum (FAQ)
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          {/* Kolom kiri: FAQ_LIST[0..3] */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FAQ_LIST.slice(0, 4).map((item, i) => (
              <div key={i} style={{
                background: 'white',
                border: `1.5px solid ${openFaq === i ? '#F0D87A' : '#EDE4C0'}`,
                borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  textAlign: 'left',
                }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1C1400', lineHeight: 1.3 }}>
                    {item.q}
                  </span>
                  <span style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    background: openFaq === i ? '#FFFBEB' : '#F9F5E8',
                    border: `1px solid ${openFaq === i ? '#F0D87A' : '#EDE4C0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', color: openFaq === i ? '#D4A000' : '#8A7040',
                    fontWeight: 700,
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                    transition: 'all 0.25s',
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: openFaq === i ? 200 : 0,
                  overflow: 'hidden', transition: 'max-height 0.3s ease',
                  padding: openFaq === i ? '0 16px 14px' : '0 16px',
                  fontSize: '0.82rem', color: '#8A7040', lineHeight: 1.65,
                }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
          {/* Kolom kanan: FAQ_LIST[4..7] */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FAQ_LIST.slice(4, 8).map((item, i) => {
              const idx = i + 4
              return (
                <div key={idx} style={{
                  background: 'white',
                  border: `1.5px solid ${openFaq === idx ? '#F0D87A' : '#EDE4C0'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
                }}>
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    textAlign: 'left',
                  }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1C1400', lineHeight: 1.3 }}>
                      {item.q}
                    </span>
                    <span style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      background: openFaq === idx ? '#FFFBEB' : '#F9F5E8',
                      border: `1px solid ${openFaq === idx ? '#F0D87A' : '#EDE4C0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', color: openFaq === idx ? '#D4A000' : '#8A7040',
                      fontWeight: 700,
                      transform: openFaq === idx ? 'rotate(45deg)' : 'none',
                      transition: 'all 0.25s',
                    }}>+</span>
                  </button>
                  <div style={{
                    maxHeight: openFaq === idx ? 200 : 0,
                    overflow: 'hidden', transition: 'max-height 0.3s ease',
                    padding: openFaq === idx ? '0 16px 14px' : '0 16px',
                    fontSize: '0.82rem', color: '#8A7040', lineHeight: 1.65,
                  }}>
                    {item.a}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1C1400', borderTop: '1px solid rgba(255,194,0,0.1)', padding: '20px 6%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.png?v=3" alt="Tengok Tetangga" width={32} height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>
              Tengok<span style={{ color: '#FFC200' }}>Tetangga</span>
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>
            © 2026 <span style={{ color: 'rgba(255,194,0,0.4)' }}>TengokTetangga</span> — Dinas Komunikasi dan Informatika — Pemerintah Kota Bontang
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bobble {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(6px); }
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(212, 160, 0, 0.12) !important;
          border-color: #FFC200 !important;
        }
        .urusan-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 1200px) {
          .urusan-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 768px) {
          .urusan-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .urusan-grid {
            grid-template-columns: 1fr;
          }
        }
        .urusan-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .urusan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(212, 160, 0, 0.1) !important;
          border-color: #FFC200 !important;
          background: #FFFDF5 !important;
        }
      `}</style>
    </div>
  )
}
