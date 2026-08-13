'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'

interface NavItem { href: string; label: string; icon: string; roles?: string[] }

const ALL_ROLES = ['siswa', 'masyarakat', 'guru', 'opd', 'admin']

const NAV_ITEMS: NavItem[] = [
  // Siswa / Masyarakat
  { href: '/dashboard',       label: 'Beranda',           icon: '🏠', roles: ['siswa', 'masyarakat'] },
  { href: '/self-assessment', label: 'Uji Kelayakan',     icon: '📋', roles: ['siswa', 'masyarakat'] },
  { href: '/observasi',       label: 'Buat Laporan',      icon: '📝', roles: ['siswa', 'masyarakat'] },
  { href: '/laporan',         label: 'Laporan Saya',      icon: '📂', roles: ['siswa', 'masyarakat'] },
  // Guru
  { href: '/guru/dashboard',  label: 'Dashboard Guru',    icon: '📊', roles: ['guru'] },
  { href: '/guru/laporan',    label: 'Verifikasi Laporan',icon: '✅', roles: ['guru'] },
  { href: '/guru/siswa',      label: 'Daftar Siswa',      icon: '👥', roles: ['guru'] },
  // OPD
  { href: '/opd/dashboard',   label: 'Dashboard',         icon: '🏛️', roles: ['opd'] },
  { href: '/opd/laporan',     label: 'Kelola Laporan',    icon: '📋', roles: ['opd'] },
  { href: '/opd/cetak',       label: 'Cetak Laporan',     icon: '🖨️', roles: ['opd'] },
  // Admin
  { href: '/admin/dashboard',  label: 'Dashboard',     icon: '📊', roles: ['admin'] },
  { href: '/admin/laporan',    label: 'Semua Laporan', icon: '📂', roles: ['admin'] },
  { href: '/admin/pengaturan', label: 'Pengaturan',    icon: '⚙️', roles: ['admin'] },
  // Profil — semua role
  { href: '/profil',           label: 'Profil',            icon: '👤', roles: ALL_ROLES },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout, sudahLulus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/')
    // Hanya siswa & masyarakat yang harus melengkapi profil — OPD/Guru/Admin dikonfigurasi oleh admin
    if (!loading && user && !user.profil_lengkap && !['admin', 'guru', 'opd'].includes(user.role)) router.push('/profil/lengkapi')
    // Redirect admin away from user-facing pages
    if (!loading && user?.role === 'admin' && !pathname.startsWith('/admin') && !pathname.startsWith('/profil') && !pathname.startsWith('/laporan/')) {
      router.push('/admin/dashboard')
    }
  }, [user, loading, pathname])

  if (loading || !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FEFCE8', gap: '1.5rem' }}>
        <img
          src="/logo.png?v=3"
          alt="Tengok Tetangga"
          width={80}
          height={80}
          style={{ display: 'block', objectFit: 'contain', animation: 'pulse 2s ease-in-out infinite' }}
        />
        <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  const visibleNav = NAV_ITEMS.filter(item => item.roles?.includes(user.role) ?? false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : undefined,
        height: '100vh', zIndex: 200,
        boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }} className="sidebar sidebar-premium">
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.5rem' }} className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo.png?v=3"
              alt="Tengok Tetangga"
              width={48}
              height={48}
              style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem' }} className="sidebar-logo-title">Tengok Tetangga</div>
              <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sidebar-logo-subtitle">Kota Bontang</div>
            </div>
          </div>
        </div>

        {/* User info — hanya tampilan, akses profil via menu sidebar */}
        <div style={{ padding: '1rem 1.5rem' }} className="sidebar-user-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-text)', fontWeight: 700, fontSize: '0.9rem' }}>{user.name[0]}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} className="sidebar-user-name">{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                <span className={`badge ${user.role === 'admin' ? 'badge-red' : user.role === 'guru' ? 'badge-blue' : user.role === 'opd' ? 'badge-yellow' : 'badge-primary'}`} style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                  {user.role.toUpperCase()}
                </span>
                {['siswa', 'masyarakat'].includes(user.role) && sudahLulus && <span className="badge badge-green" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>✓ LULUS</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          {visibleNav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '1rem' }} className="sidebar-footer">
          <button onClick={logout} className="btn btn-ghost btn-full sidebar-btn-logout">
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199,
        }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-h)', background: 'white',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 6 }}
            id="mobile-menu-btn"
          >☰</button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {['siswa', 'masyarakat'].includes(user.role) && (sudahLulus
              ? <span className="badge badge-green">✓ Lulus Assessment</span>
              : <span className="badge badge-yellow">⚠ Belum Assessment</span>
            )}
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          div[style*="margin-left: var(--sidebar-w)"] { margin-left: 0 !important; }
          #mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}
