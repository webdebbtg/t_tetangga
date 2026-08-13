'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authApi, User } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface AuthContextValue {
  user: User | null
  loading: boolean
  sudahLulus: boolean
  profilLengkap: boolean
  setUser: (u: User | null) => void
  setToken: (token: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAdmin: () => boolean
  isSiswa: () => boolean
  isGuru: () => boolean
  isOpd: () => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sudahLulus, setSudahLulus] = useState(false)
  const [profilLengkap, setProfilLengkap] = useState(false)
  const router = useRouter()

  const refreshUser = async () => {
    const token = localStorage.getItem('tt_token')
    if (!token) { setLoading(false); return }
    try {
      const res = await authApi.me()
      setUser(res.data.user)
      setSudahLulus(res.data.sudah_lulus)
      setProfilLengkap(res.data.profil_lengkap)
    } catch {
      localStorage.removeItem('tt_token')
      localStorage.removeItem('tt_user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refreshUser() }, [])

  const logout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('tt_token')
    localStorage.removeItem('tt_user')
    setUser(null)
    window.location.href = '/'
  }

  const setToken = async (token: string) => {
    localStorage.setItem('tt_token', token)
    await refreshUser()
  }

  const value: AuthContextValue = {
    user, loading, sudahLulus, profilLengkap, setUser, setToken, logout, refreshUser,
    isAdmin: () => user?.role === 'admin',
    isSiswa: () => user?.role === 'siswa',
    isGuru: () => user?.role === 'guru',
    isOpd: () => user?.role === 'opd',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
