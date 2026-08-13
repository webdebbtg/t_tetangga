'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'

export default function PengaturanPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'kuesioner' | 'opd' | 'config'>('kuesioner')

  const TABS = [
    { id: 'kuesioner', label: '📋 Pengaturan Kuesioner' },
    { id: 'opd',       label: '🏛️ Manajemen OPD' },
    { id: 'config',    label: '⚙️ Konfigurasi Sistem' },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div className="animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>⚙️ Pengaturan</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Kelola data master dan konfigurasi sistem Tengok Tetangga.
          </p>
        </div>
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/admin/users')}>👥 Manajemen User</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="animate-fadeInUp" style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: 'white', padding: '0.375rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-100)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TABS */}
      {activeTab === 'kuesioner' && <KuesionerManager />}
      {activeTab === 'opd' && <OpdManager />}
      {activeTab === 'config' && <KonfigurasiPanel />}
    </div>
  )
}

// ── Kuesioner Manager ──────────────────────────────────
function KuesionerManager() {
  const [jenis, setJenis] = useState<'SELF_ASSESSMENT' | 'WAWANCARA'>('SELF_ASSESSMENT')
  const [pertanyaan, setPertanyaan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [form, setForm] = useState({ 
    teks_pertanyaan: '', 
    bobot_nilai: 1, 
    kategori: '', 
    urutan: 0, 
    opsi_jawaban: [{ teks: '', nilai: 10 }, { teks: '', nilai: 5 }, { teks: '', nilai: 0 }] 
  })
  const [targetOpd, setTargetOpd] = useState('Dinsos')
  const [targetOpdDetail, setTargetOpdDetail] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setForm({ 
      teks_pertanyaan: '', 
      bobot_nilai: jenis === 'WAWANCARA' ? 1 : 4, 
      kategori: '', 
      urutan: 0, 
      opsi_jawaban: [{ teks: 'Sangat baik', nilai: 4 }, { teks: 'Cukup baik', nilai: 3 }, { teks: 'Kurang baik', nilai: 2 }, { teks: 'Tidak baik sama sekali', nilai: 1 }] 
    })
    setTargetOpd('Dinsos')
    setTargetOpdDetail('')
  }

  const fetch = () => {
    setLoading(true)
    adminApi.kuesioner(jenis).then(r => setPertanyaan(r.data.pertanyaan)).finally(() => setLoading(false))
  }

  useEffect(() => { 
    resetForm()
    fetch() 
  }, [jenis])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        jenis,
        opsi_jawaban: jenis === 'WAWANCARA'
          ? [{ teks: 'Ya', nilai: form.bobot_nilai || 1, opd: targetOpd, opd_detail: targetOpdDetail }]
          : form.opsi_jawaban
      }

      if (editingId) {
        await adminApi.updateKuesioner(editingId, payload)
      } else {
        await adminApi.storeKuesioner(payload)
      }

      setShowForm(false)
      resetForm()
      fetch()
    } catch { } finally { setSaving(false) }
  }

  const handleEdit = (p: any) => {
    setEditingId(p.id)
    let opdVal = 'Dinsos'
    let opdDetailVal = ''
    if (Array.isArray(p.opsi_jawaban)) {
      const opt = p.opsi_jawaban.find((o: any) => o.opd)
      if (opt) {
        opdVal = opt.opd
        opdDetailVal = opt.opd_detail || ''
      }
    }
    setForm({
      teks_pertanyaan: p.teks_pertanyaan,
      bobot_nilai: p.bobot_nilai,
      kategori: p.kategori || '',
      urutan: p.urutan || 0,
      opsi_jawaban: p.opsi_jawaban || []
    })
    setTargetOpd(opdVal)
    setTargetOpdDetail(opdDetailVal)
    setShowForm(true)
  }

  const handleToggleAktif = async (p: any) => {
    await adminApi.updateKuesioner(p.id, { aktif: !p.aktif })
    fetch()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pertanyaan ini?')) return
    await adminApi.deleteKuesioner(id)
    fetch()
  }

  return (
    <div className="animate-fadeInUp">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['SELF_ASSESSMENT', 'WAWANCARA'] as const).map(j => (
            <button key={j} className={`btn btn-sm ${jenis === j ? 'btn-primary' : 'btn-outline'}`} onClick={() => setJenis(j)}>
              {j === 'SELF_ASSESSMENT' ? '📋 Self-Assessment' : '🗒️ Wawancara Lapangan'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? '✗ Sembunyikan Form' : '+ Tambah Pertanyaan'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', border: '2px solid var(--primary-light)' }}>
          <div className="card-header"><span>✏️</span><h3>{editingId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Teks Pertanyaan / Kondisi <span>*</span></label>
              <textarea className="form-textarea" rows={2} value={form.teks_pertanyaan} onChange={e => setForm(p => ({ ...p, teks_pertanyaan: e.target.value }))} placeholder={jenis === 'WAWANCARA' ? "Contoh: Lansia tinggal sendiri" : "Tulis pertanyaan..."} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bobot Nilai</label>
                <input className="form-input" type="number" min={1} max={100} value={form.bobot_nilai} onChange={e => setForm(p => ({ ...p, bobot_nilai: Number(e.target.value) }))} />
              </div>

              {jenis === 'WAWANCARA' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target OPD</label>
                    <select className="form-select" value={targetOpd} onChange={e => setTargetOpd(e.target.value)}>
                      {['Dinsos', 'Dinkes', 'DP3AKB', 'Disperkim', 'Disdik', 'BPBD'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0, marginTop: '0.5rem' }}>
                    <label className="form-label">Detail Bidang / Urusan OPD</label>
                    <input className="form-input" placeholder="Contoh: Urusan Jaminan Sosial / Lansia Terlantar" value={targetOpdDetail} onChange={e => setTargetOpdDetail(e.target.value)} />
                  </div>
                </>
              )}

              {jenis === 'SELF_ASSESSMENT' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Urutan Tampil</label>
                  <input className="form-input" type="number" min={0} value={form.urutan} onChange={e => setForm(p => ({ ...p, urutan: Number(e.target.value) }))} />
                </div>
              )}
            </div>

            {jenis === 'SELF_ASSESSMENT' && (
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Opsi Jawaban & Skor</label>
                {form.opsi_jawaban.map((o, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="form-input" placeholder={`Teks Pilihan ${i + 1}`} value={o.teks} onChange={e => { const ops = [...form.opsi_jawaban]; ops[i].teks = e.target.value; setForm(p => ({ ...p, opsi_jawaban: ops })) }} />
                    <input className="form-input" type="number" placeholder="Skor" value={o.nilai} onChange={e => { const ops = [...form.opsi_jawaban]; ops[i].nilai = Number(e.target.value); setForm(p => ({ ...p, opsi_jawaban: ops })) }} />
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, opsi_jawaban: [...p.opsi_jawaban, { teks: '', nilai: 0 }] }))}>+ Tambah Opsi Pilihan</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.teks_pertanyaan}>
                {saving ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Pertanyaan / Kondisi</th>
                  {jenis === 'WAWANCARA' && <th>Target OPD</th>}
                  <th style={{ width: 80 }}>Bobot/Skor</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pertanyaan.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>{i + 1}</td>
                    <td style={{ fontSize: '0.9rem', maxWidth: 400 }}>
                      <div style={{ fontWeight: 600 }}>{p.teks_pertanyaan}</div>
                      {jenis === 'SELF_ASSESSMENT' && p.opsi_jawaban && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {p.opsi_jawaban.map((o: any, idx: number) => (
                            <span key={idx} style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', background: 'var(--gray-100)', borderRadius: 4, color: 'var(--gray-600)' }}>
                              {o.teks} ({o.nilai})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {jenis === 'WAWANCARA' && (
                      <td>
                        {(() => {
                          const opt = p.opsi_jawaban?.find?.((o: any) => o.opd) || p.opsi_jawaban?.[0]
                          return opt?.opd ? (
                            <div>
                              <span className="badge badge-primary" style={{ background: 'var(--primary)', color: 'var(--primary-text)', fontWeight: 700 }}>{opt.opd}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} title={opt.opd_detail}>
                                {opt.opd_detail}
                              </div>
                            </div>
                          ) : '—'
                        })()}
                      </td>
                    )}
                    <td style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.bobot_nilai}</span></td>
                    <td>
                      <button onClick={() => handleToggleAktif(p)} className={`badge ${p.aktif ? 'badge-green' : 'badge-red'}`} style={{ border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                        {p.aktif ? '✓ Aktif' : '✗ Nonaktif'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)} style={{ color: 'var(--primary)', padding: '0.25rem 0.5rem' }}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pertanyaan.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>Belum ada pertanyaan</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── OPD Manager ──────────────────────────────────
function OpdManager() {
  const [opd, setOpd] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nama: '', singkatan: '', email: '', telepon: '', kategori_urusan: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.opdList().then(r => setOpd(r.data.opd)).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.storeOpd(form)
      setShowForm(false)
      adminApi.opdList().then(r => setOpd(r.data.opd))
    } catch { } finally { setSaving(false) }
  }

  const toggleAktif = async (o: any) => {
    await adminApi.updateOpd(o.id, { aktif: !o.aktif })
    adminApi.opdList().then(r => setOpd(r.data.opd))
  }

  return (
    <div className="animate-fadeInUp">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Tambah OPD</button>
      </div>

      {showForm && (
        <div className="card animate-fadeInUp" style={{ marginBottom: '1rem', border: '2px solid var(--primary-light)' }}>
          <div className="card-header"><span>🏛️</span><h3>Tambah OPD Baru</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[{ key: 'nama', label: 'Nama OPD', ph: 'Dinas Sosial...' }, { key: 'singkatan', label: 'Singkatan', ph: 'Dinsos' }, { key: 'email', label: 'Email', ph: 'dinsos@...' }, { key: 'telepon', label: 'Telepon', ph: '0xxxxxxx' }].map(f => (
                <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" placeholder={f.ph} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Kategori Urusan</label>
                <select className="form-select" value={form.kategori_urusan} onChange={e => setForm(p => ({ ...p, kategori_urusan: e.target.value }))}>
                  <option value="">Pilih...</option>
                  {['EKONOMI', 'KESEHATAN', 'PERMUKIMAN', 'PENDIDIKAN', 'SOSIAL', 'UMUM'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nama}>{saving ? <><div className="spinner" />Menyimpan...</> : '💾 Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nama OPD</th><th>Singkatan</th><th>Kategori</th><th>Email</th><th>Total Laporan</th><th>Status</th></tr></thead>
              <tbody>
                {opd.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.nama}</td>
                    <td><span className="badge badge-blue">{o.singkatan}</span></td>
                    <td><span className="badge badge-primary">{o.kategori_urusan || '—'}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{o.email || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{o.total_laporan || 0}</td>
                    <td>
                      <button onClick={() => toggleAktif(o)} className={`badge ${o.aktif ? 'badge-green' : 'badge-red'}`} style={{ border: 'none', cursor: 'pointer' }}>
                        {o.aktif ? '✓ Aktif' : '✗ Nonaktif'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Konfigurasi Panel ──────────────────────────────────
function KonfigurasiPanel() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getKonfigurasi().then(r => setConfig(r.data.konfigurasi)).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateKonfigurasi(config)
      alert('Konfigurasi berhasil disimpan!')
    } catch { } finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>

  const CONFIG_LABELS: Record<string, { label: string; hint: string; type: string }> = {
    self_assessment_passing_grade: { label: 'Passing Grade Self-Assessment (%)', hint: 'Persentase minimum untuk lulus (0-100)', type: 'number' },
    sla_jam: { label: 'SLA Penanganan (Jam)', hint: 'Waktu maksimal penanganan laporan dalam jam', type: 'number' },
    max_ulang_assessment: { label: 'Maks. Pengulangan Assessment/Hari', hint: 'Berapa kali user bisa mengulang self-assessment per hari', type: 'number' },
    nama_aplikasi: { label: 'Nama Aplikasi', hint: 'Nama yang tampil di header aplikasi', type: 'text' },
    versi_aplikasi: { label: 'Versi Aplikasi', hint: 'Versi release saat ini', type: 'text' },
  }

  return (
    <div className="card animate-fadeInUp">
      <div className="card-header"><span>⚙️</span><h3>Konfigurasi Sistem</h3></div>
      <div className="card-body">
        <div style={{ display: 'grid', gap: '1.25rem', maxWidth: 560 }}>
          {Object.entries(config).map(([key, val]) => {
            const info = CONFIG_LABELS[key] || { label: key, hint: '', type: 'text' }
            return (
              <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{info.label}</label>
                <input className="form-input" type={info.type} value={val} onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))} />
                {info.hint && <div className="form-hint">{info.hint}</div>}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan Konfigurasi'}
          </button>
        </div>
      </div>
    </div>
  )
}
