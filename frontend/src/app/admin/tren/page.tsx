'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts'

const KATEGORI_COLORS: Record<string, string> = {
  EKONOMI:    '#FFC200',
  KESEHATAN:  '#EF4444',
  PERMUKIMAN: '#8B5CF6',
  PENDIDIKAN: '#0EA5E9',
  SOSIAL:     '#16A34A',
  UMUM:       '#6B7280',
}

export default function TrenAnalitikPage() {
  const [tren, setTren] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [view, setView] = useState<'bulanan' | 'kategori' | 'sla'>('bulanan')

  useEffect(() => {
    setLoading(true)
    adminApi.tren({ tahun }).then(res => {
      setTren(res.data)
    }).catch(() => {
      // Data will be provided by real DB endpoint
    }).finally(() => setLoading(false))
  }, [tahun])

  const tahunOpts = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i))

  if (loading) return (
    <div className="page-content" style={{ padding: '3rem', textAlign: 'center' }}>
      <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
    </div>
  )
  if (!tren) return (
    <div className="page-content">
      <div className="alert alert-warning">Gagal memuat data analitik.</div>
    </div>
  )

  const r = tren.ringkasan || {}

  return (
    <div className="page-content animate-fadeInUp">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>📈 Tren & Analitik</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Analisis mendalam mengenai laporan dan performa penanganan kasus di Kota Bontang.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['bulanan','kategori','sla'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-outline'}`}>
              {v === 'bulanan' ? '📅 Per Bulan' : v === 'kategori' ? '🏷️ Kategori' : '⏱️ SLA'}
            </button>
          ))}
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={tahun} onChange={e => setTahun(e.target.value)}>
          {tahunOpts.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { icon: '📋', label: `Total Laporan ${tahun}`,  value: r.total_tahun ?? '—',                     color: '#8B5CF6', bg: '#EDE9FE' },
          { icon: '✅', label: 'Tingkat Penyelesaian',     value: `${r.pct_selesai ?? '—'}%`,               color: '#16A34A', bg: '#DCFCE7' },
          { icon: '🔴', label: 'Tingkat Overdue',          value: `${r.pct_overdue ?? '—'}%`,               color: '#EF4444', bg: '#FEE2E2' },
          { icon: '⏱️', label: 'Rata-rata Penyelesaian',   value: `${r.rata_penyelesaian_hari ?? '—'} hari`, color: '#FFC200', bg: '#FEF9C3' },
        ].map((k, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="stat-icon" style={{ background: k.bg }}><span style={{ fontSize: '1.25rem' }}>{k.icon}</span></div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: k.color, fontSize: '1.375rem' }}>{k.value}</div>
              <div className="stat-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div className="card">
        <div className="card-header">
          <span>{view === 'bulanan' ? '📅' : view === 'kategori' ? '🏷️' : '⏱️'}</span>
          <h3>
            {view === 'bulanan'  && `Tren Laporan Bulanan ${tahun}`}
            {view === 'kategori' && `Distribusi per Kategori ${tahun}`}
            {view === 'sla'      && `Kepatuhan SLA ${tahun}`}
          </h3>
        </div>
        <div className="card-body">

          {view === 'bulanan' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tren.bulanan || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: '0.8125rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="total"   name="Total"   fill="#8B5CF6" radius={[4,4,0,0]} />
                <Bar dataKey="selesai" name="Selesai" fill="#16A34A" radius={[4,4,0,0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {view === 'kategori' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tren.per_kategori || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: '0.8125rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                {Object.entries(KATEGORI_COLORS).map(([k, c]) => (
                  <Bar key={k} dataKey={k} name={k} fill={c} radius={[4,4,0,0]} stackId="a" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {view === 'sla' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={tren.sla || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" label={({ value }: any) => `${value}%`}>
                    {(tren.sla || []).map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(tren.sla || []).map((s: any, i: number) => (
                  <div key={i} style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.375rem', color: s.color }}>{s.value}%</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{s.name}</div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', lineHeight: 1.6 }}>
                  SLA dihitung berdasarkan konfigurasi jam penyelesaian yang ditetapkan admin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
