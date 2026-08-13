'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, User } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'badge-red' },
  siswa: { label: 'Siswa', cls: 'badge-primary' },
  masyarakat: { label: 'Masyarakat', cls: 'badge-blue' },
  guru: { label: 'Guru', cls: 'badge-yellow' },
  opd: { label: 'OPD', cls: 'badge-primary' },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterLulus, setFilterLulus] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: '', sekolah_id: '', opd_id: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [opdList, setOpdList] = useState<{ id: number; nama: string; singkatan: string }[]>([])
  const [sekolahList, setSekolahList] = useState<{ id: number; nama: string; npsn?: string }[]>([])

  useEffect(() => {
    adminApi.opdList().then(r => setOpdList(r.data.opd || []))
    adminApi.sekolahList().then(r => setSekolahList(r.data.sekolah || []))
  }, [])

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(p), per_page: '20' }
      if (search) params.search = search
      if (filterRole) params.role = filterRole
      if (filterLulus) params.lulus = filterLulus
      const res = await adminApi.users(params)
      setUsers(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch { } finally { setLoading(false) }
  }, [search, filterRole, filterLulus])

  useEffect(() => { fetchUsers(page) }, [page, search, filterRole, filterLulus])

  const handleSaveUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      await adminApi.updateUser(editUser.id, {
        name: editForm.name,
        role: editForm.role as any,
        sekolah_id: ['siswa', 'guru'].includes(editForm.role) && editForm.sekolah_id ? Number(editForm.sekolah_id) : undefined,
        opd_id: editForm.role === 'opd' && editForm.opd_id ? Number(editForm.opd_id) : undefined,
        password: editForm.password || undefined,
      })
      toast.success('Data pengguna berhasil diperbarui')
      setEditUser(null)
      fetchUsers(page)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memperbarui data pengguna')
    } finally { setSaving(false) }
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setEditForm({
      name: u.name || '',
      role: u.role,
      sekolah_id: u.sekolah_id ? String(u.sekolah_id) : '',
      opd_id: u.opd_id ? String(u.opd_id) : '',
      password: '',
    })
  }

  // Stats
  const statsByRole = Object.entries(ROLE_CFG).reduce<Record<string, number>>((acc, [k]) => {
    acc[k] = users.filter(u => u.role === k).length
    return acc
  }, {})

  return (
    <div className="page-content">
      {/* Header */}
      <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>👥 Manajemen Pengguna</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Kelola akun dan role seluruh pengguna platform.
        </p>
      </div>

      {/* Role stats mini */}
      <div className="animate-fadeInUp" style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(ROLE_CFG).map(([role, cfg]) => (
          <div key={role} className="card" style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => setFilterRole(filterRole === role ? '' : role)}>
            <span className={`badge ${filterRole === role ? cfg.cls : 'badge-gray'}`}>{cfg.label}</span>
            <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>
              {meta?.role_counts?.[role] ?? statsByRole[role] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ maxWidth: 280 }}
            placeholder="🔍 Cari nama atau email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="form-select" style={{ maxWidth: 180 }} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}>
            <option value="">Semua Role</option>
            {Object.entries(ROLE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: 200 }} value={filterLulus} onChange={e => { setFilterLulus(e.target.value); setPage(1) }}>
            <option value="">Semua Status Kelayakan</option>
            <option value="LULUS">✅ Lulus Assessment</option>
            <option value="TIDAK_LULUS">❌ Tidak Lulus</option>
            <option value="BELUM">⏳ Belum Assessment</option>
          </select>
          {(search || filterRole || filterLulus) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterRole(''); setFilterLulus(''); setPage(1) }}>
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card animate-fadeInUp">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
            <p>Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Sekolah / OPD</th>
                    <th>Kelayakan</th>
                    <th>Total Laporan</th>
                    <th>Bergabung</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const roleCfg = ROLE_CFG[u.role] || { label: u.role, cls: 'badge-gray' }
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            {u.avatar
                              ? <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-dark)', flexShrink: 0 }}>{u.name[0]}</div>
                            }
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                              {u.nik && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>NIK: {u.nik.substring(0, 6)}••••••</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{u.email}</td>
                        <td><span className={`badge ${roleCfg.cls}`}>{roleCfg.label}</span></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                          {u.sekolah?.nama || u.opd?.nama || '—'}
                        </td>
                        <td>
                          {['admin', 'guru', 'opd'].includes(u.role) ? (
                            <span style={{ color: 'var(--gray-400)' }}>—</span>
                          ) : u.status_kelayakan === 'LULUS'
                            ? <span className="badge badge-green">✅ Lulus</span>
                            : u.status_kelayakan === 'TIDAK_LULUS'
                              ? <span className="badge badge-red">❌ Tidak Lulus</span>
                              : <span className="badge badge-gray">⏳ Belum</span>
                          }
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                          {(u as any).total_laporan ?? 0}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                          {(u as any).created_at ? format(new Date((u as any).created_at), 'dd MMM yyyy', { locale: localeId }) : '—'}
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="pagination" style={{ padding: '1rem' }}>
                <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  {page} / {meta.last_page}
                </span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
                <button className="page-btn" onClick={() => setPage(meta.last_page)} disabled={page === meta.last_page}>»</button>
              </div>
            )}
            {meta && (
              <div style={{ padding: '0 1rem 0.875rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                Total: {meta.total} pengguna
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Edit User */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>✏️ Edit Pengguna</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' }}>✕</button>
            </div>
            <div className="modal-body">
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'var(--gray-50)', borderRadius: 10, padding: '0.875rem', marginBottom: '1.25rem' }}>
                {editUser.avatar
                  ? <img src={editUser.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>{editUser.name[0]}</div>
                }
                <div>
                  <div style={{ fontWeight: 700 }}>{editUser.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{editUser.email}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Lengkap <span>*</span></label>
                <input
                  className="form-input"
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Baru <span>*</span></label>
                <select className="form-select" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                  {Object.entries(ROLE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {['siswa', 'guru'].includes(editForm.role) && (
                <div className="form-group">
                  <label className="form-label">Sekolah / Tempat Tugas <span>*</span></label>
                  <select className="form-select" value={editForm.sekolah_id} onChange={e => setEditForm(p => ({ ...p, sekolah_id: e.target.value }))}>
                    <option value="">— Pilih Sekolah —</option>
                    {sekolahList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>
                </div>
              )}

              {editForm.role === 'opd' && (
                <div className="form-group">
                  <label className="form-label">Instansi OPD <span>*</span></label>
                  <select className="form-select" value={editForm.opd_id} onChange={e => setEditForm(p => ({ ...p, opd_id: e.target.value }))}>
                    <option value="">— Pilih OPD —</option>
                    {opdList.map(o => <option key={o.id} value={o.id}>{o.nama} ({o.singkatan})</option>)}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ganti Password (Kosongkan jika tidak ingin diubah)</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Masukkan password baru"
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              {editForm.role === 'admin' && (
                <div className="alert alert-warning" style={{ marginTop: '0.75rem' }}>
                  ⚠️ Role <strong>Admin</strong> memberikan akses penuh ke semua fitur platform. Pastikan Anda yakin.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveUser} disabled={saving || !editForm.name || (['siswa', 'guru'].includes(editForm.role) && !editForm.sekolah_id) || (editForm.role === 'opd' && !editForm.opd_id)}>
                {saving ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
