'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { guruApi, User } from '@/lib/api'
import Pagination from '@/components/Pagination'

interface SiswaItem extends User {
  laporan_count: number
  laporan_selesai_count: number
}

interface SiswaResponse {
  data: SiswaItem[]
  current_page: number
  last_page: number
  total: number
}

export default function GuruSiswaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<SiswaResponse | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!loading && user?.role !== 'guru') {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const loadData = (pageNum = 1) => {
    if (!user || user.role !== 'guru') return
    
    setLoadingData(true)
    guruApi.siswa({ page: pageNum.toString() })
      .then((res: any) => {
        setData(res.data)
        setPage(pageNum)
      })
      .catch(err => {
        console.error(err)
        setError('Gagal mengambil daftar siswa')
      })
      .finally(() => {
        setLoadingData(false)
      })
  }

  useEffect(() => {
    loadData(page)
  }, [user, page])

  if (loading) {
    return (
      <div className="layout-content container">
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>Memuat...</div>
      </div>
    )
  }

  return (
    <div className="layout-content container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ margin: 0, color: 'var(--gray-900)' }}>Daftar Siswa</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--gray-500)', fontSize: '0.9375rem' }}>
            Pantau aktivitas siswa dari sekolah Anda yang mendaftar program
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loadingData && !data ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--gray-500)' }}>Memuat daftar siswa...</div>
        ) : data?.data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ color: 'var(--gray-600)', fontWeight: 500 }}>Belum ada siswa yang mendaftar</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left', color: 'var(--gray-600)' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Nama Siswa</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>NIS</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Kelas</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>Status Kelayakan</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>Total Laporan</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>Selesai</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((siswa, i) => (
                <tr key={siswa.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--gray-900)' }}>
                    <div style={{ fontWeight: 500 }}>{siswa.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{siswa.email}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>{siswa.nis || '-'}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>{siswa.kelas || '-'}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    {siswa.status_kelayakan === 'LULUS' ? (
                      <span className="badge badge-green">LULUS</span>
                    ) : siswa.status_kelayakan === 'TIDAK_LULUS' ? (
                      <span className="badge badge-red">TIDAK LULUS</span>
                    ) : (
                      <span className="badge badge-yellow">BELUM</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                    {siswa.laporan_count || 0}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>
                    {siswa.laporan_selesai_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.last_page > 1 && (
          <div style={{ marginTop: '2rem' }}>
            <Pagination
              currentPage={data.current_page}
              lastPage={data.last_page}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
