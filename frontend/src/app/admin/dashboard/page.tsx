'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

/* ── Warna Kerentanan ───────────────────────────────────────────────── */
const KERENTANAN_COLOR: Record<string, string> = {
  Ringan:  '#22C55E',
  Sedang:  '#FFC200',
  Tinggi:  '#F97316',
  Ekstrem: '#EF4444',
}

/* ── Tooltip Kustom untuk Line Chart ───────────────────────────────── */
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--gray-700)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--gray-600)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Tooltip Kustom untuk Stacked Bar ──────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--gray-700)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
          <span style={{ color: 'var(--gray-600)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--gray-100)', marginTop: '0.375rem', paddingTop: '0.375rem', fontWeight: 700 }}>
        Total: {total}
      </div>
    </div>
  )
}

const PERIODE_OPTS = [
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan',  label: 'Bulanan'  },
  { value: 'tahunan',  label: 'Tahunan'  },
]

export default function AdminDashboardPage() {
  const router = useRouter()

  const [stats,            setStats]            = useState<any>(null)
  const [kerentanan,       setKerentanan]       = useState<any[]>([])
  const [sebaranWilayah,   setSebaranWilayah]   = useState<any[]>([])
  const [sebaranKelurahan, setSebaranKelurahan] = useState<any[]>([])
  const [kinerjaOpd,       setKinerjaOpd]       = useState<any[]>([])
  const [loadingDash,      setLoadingDash]      = useState(true)
  const [errorDash,        setErrorDash]        = useState(false)

  const [trenData,    setTrenData]    = useState<any[]>([])
  const [loadingTren, setLoadingTren] = useState(true)
  const [periode,     setPeriode]     = useState('bulanan')
  const [tahun,       setTahun]       = useState(new Date().getFullYear().toString())

  /* Fetch dashboard once */
  useEffect(() => {
    adminApi.dashboard()
      .then(res => {
        const d = res.data
        setStats(d.stats)
        setKerentanan(d.kerentanan || [])
        setSebaranWilayah(d.sebaran_wilayah || [])
        setSebaranKelurahan(d.sebaran_kelurahan || [])
        setKinerjaOpd(d.kinerja_opd || [])
      })
      .catch(() => setErrorDash(true))
      .finally(() => setLoadingDash(false))
  }, [])

  /* Fetch tren when periode/tahun changes */
  useEffect(() => {
    setLoadingTren(true)
    adminApi.tren({ periode, tahun })
      .then(res => setTrenData(res.data.data || []))
      .catch(() => setTrenData([]))
      .finally(() => setLoadingTren(false))
  }, [periode, tahun])

  if (loadingDash) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (errorDash || !stats) return (
    <div className="page-content">
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ fontWeight: 600 }}>Gagal memuat data dashboard</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
          Coba Lagi
        </button>
      </div>
    </div>
  )

  const bulanIni = format(new Date(), 'MMMM yyyy', { locale: localeId })
  const thisYear = new Date().getFullYear()
  const tahunOpts = Array.from({ length: 5 }, (_, i) => (thisYear - i).toString())
  const maxSebaran = sebaranWilayah[0]?.total || 1

  /* Warna intensitas sebaran */
  const intensityColor = (pct: number) =>
    pct > 75 ? '#EF4444' : pct > 50 ? '#F97316' : pct > 25 ? '#FFC200' : '#22C55E'

  /* Label donut kerentanan */
  const totalKerentanan = kerentanan.reduce((s: number, k: any) => s + k.count, 0)
  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.06) return null
    const R = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.55
    const x = cx + r * Math.cos(-midAngle * R)
    const y = cy + r * Math.sin(-midAngle * R)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '0.6875rem', fontWeight: 700 }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const emptyState = (msg: string) => (
    <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '2.5rem 0', fontSize: '0.875rem' }}>{msg}</p>
  )

  return (
    <div className="page-content">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>📊 Admin Dashboard</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Pantau seluruh aktivitas platform Tengok Tetangga secara real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/admin/laporan')}>📂 Semua Laporan</button>
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/admin/pengaturan')}>⚙️ Pengaturan</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          1. RINGKASAN EKSEKUTIF
      ══════════════════════════════════════════════════════════════ */}
      <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1rem' }}>📌</span>
          <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gray-700)' }}>Ringkasan Eksekutif</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400 }}>— {bulanIni}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>

          {/* Card 1: Total Laporan Bulan Ini */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #8B5CF6', background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F3FF 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Laporan Masuk
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4C1D95', lineHeight: 1 }}>
                  {(stats.laporan_bulan_ini ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#7C3AED', marginTop: '0.5rem' }}>
                  Bulan ini
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.75rem' }}>📥</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid #DDD6FE', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--gray-500)' }}>Total semua waktu</span>
              <span style={{ fontWeight: 700, color: '#4C1D95' }}>{(stats.total_laporan ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Laporan Selesai Bulan Ini */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #16A34A', background: 'linear-gradient(135deg, #FAFAFA 0%, #F0FDF4 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Berhasil Ditangani
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#14532D', lineHeight: 1 }}>
                  {(stats.laporan_selesai_bulan_ini ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#16A34A', marginTop: '0.5rem' }}>
                  Selesai bulan ini
                  {stats.laporan_bulan_ini > 0 && (
                    <span style={{ marginLeft: '0.375rem', fontWeight: 700 }}>
                      ({Math.round((stats.laporan_selesai_bulan_ini / stats.laporan_bulan_ini) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.75rem' }}>✅</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--gray-500)' }}>Total selesai semua waktu</span>
              <span style={{ fontWeight: 700, color: '#14532D' }}>{(stats.laporan_selesai ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Card 3: Kasus Darurat / Eskalasi */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #EF4444', background: stats.laporan_overdue > 0 ? 'linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #FAFAFA 0%, #FFF5F5 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Kasus Eskalasi
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#7F1D1D', lineHeight: 1 }}>
                  {(stats.laporan_overdue ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#DC2626', marginTop: '0.5rem' }}>
                  Melewati batas SLA 2×24 jam
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.75rem' }}>🚨</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--gray-500)' }}>Sedang diproses OPD</span>
              <span style={{ fontWeight: 700, color: '#7F1D1D' }}>{(stats.laporan_proses ?? 0).toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. KERENTANAN SOSIAL + 3. SEBARAN WILAYAH
      ══════════════════════════════════════════════════════════════ */}
      <div className="animate-fadeInUp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Donut Chart — Kerentanan */}
        <div className="card">
          <div className="card-header">
            <span>🎯</span>
            <div>
              <h3>Tingkat Kerentanan Sosial</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, margin: 0 }}>
                Berdasarkan jumlah kondisi yang ditemukan
              </p>
            </div>
          </div>
          <div className="card-body">
            {totalKerentanan === 0 ? emptyState('Belum ada data kerentanan') : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={kerentanan}
                        cx="50%" cy="50%"
                        innerRadius={62} outerRadius={98}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="level"
                        labelLine={false}
                        label={renderDonutLabel}
                      >
                        {kerentanan.map((k: any, i: number) => (
                          <Cell key={i} fill={k.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${val} laporan (${totalKerentanan > 0 ? ((val / totalKerentanan) * 100).toFixed(1) : 0}%)`,
                          name,
                        ]}
                        wrapperStyle={{ zIndex: 10 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center total */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--gray-800)', lineHeight: 1 }}>{totalKerentanan}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>total</div>
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.25rem', width: '100%', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-100)' }}>
                  {kerentanan.map((k: any) => (
                    <div key={k.level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: 6, background: `${k.color}12` }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: k.color, flexShrink: 0, display: 'inline-block' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-800)' }}>{k.level}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{k.range}</div>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: k.color }}>{k.count}</span>
                    </div>
                  ))}
                </div>
                {/* Highlight kritis */}
                {(() => {
                  const ekstrem = kerentanan.find((k: any) => k.level === 'Ekstrem')?.count || 0
                  const tinggi  = kerentanan.find((k: any) => k.level === 'Tinggi')?.count || 0
                  const kritis  = ekstrem + tinggi
                  const pctKritis = totalKerentanan > 0 ? ((kritis / totalKerentanan) * 100).toFixed(1) : '0'
                  if (kritis === 0) return null
                  return (
                    <div style={{ marginTop: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.5rem 0.875rem', width: '100%', textAlign: 'center', fontSize: '0.8rem' }}>
                      <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠️ {pctKritis}% warga</span>
                      <span style={{ color: '#7F1D1D' }}> dalam kondisi Tinggi / Ekstrem — butuh intervensi segera</span>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Peta Sebaran Wilayah */}
        <div className="card">
          <div className="card-header">
            <span>🗺️</span>
            <div>
              <h3>Sebaran Laporan per Kecamatan</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, margin: 0 }}>
                Intensitas warna = jumlah laporan. Merah = prioritas intervensi
              </p>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '0.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {sebaranWilayah.length === 0 ? emptyState('Belum ada data wilayah (field kecamatan kosong)') : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-evenly' }}>
                {sebaranWilayah.map((k: any, i: number) => {
                  const pct = (k.total / maxSebaran) * 100
                  const barColor = intensityColor(pct)
                  const pctSelesai = k.total > 0 ? Math.round((k.selesai / k.total) * 100) : 0
                  const sisaProses = k.total - k.selesai - k.overdue
                  return (
                    <div key={k.kecamatan} style={{
                      padding: '0.75rem 0',
                      borderBottom: i < sebaranWilayah.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    }}>
                      {/* Baris atas: rank + nama + angka besar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800, color: 'white',
                            background: barColor, borderRadius: 99,
                            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-800)' }}>{k.kecamatan}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: barColor, lineHeight: 1 }}>{k.total}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: '0.25rem' }}>laporan</span>
                        </div>
                      </div>

                      {/* Bar intensitas tebal */}
                      <div style={{ height: 16, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${barColor}CC, ${barColor})`, borderRadius: 99, transition: 'width 0.8s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: pct > 15 ? '0.375rem' : 0 }}>
                          {pct > 20 && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>{Math.round(pct)}%</span>}
                        </div>
                      </div>

                      {/* Stat pills bawah */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', background: '#DCFCE7', color: '#15803D', borderRadius: 99, padding: '0.1875rem 0.625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          ✅ {k.selesai} selesai ({pctSelesai}%)
                        </span>
                        {sisaProses > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#EDE9FE', color: '#6D28D9', borderRadius: 99, padding: '0.1875rem 0.625rem', fontWeight: 600 }}>
                            ⚙️ {sisaProses} proses
                          </span>
                        )}
                        {k.overdue > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#FEE2E2', color: '#DC2626', borderRadius: 99, padding: '0.1875rem 0.625rem', fontWeight: 600 }}>
                            🔴 {k.overdue} overdue
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                </div>

                {/* Legenda intensitas + total */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--gray-100)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                    {[['#22C55E', 'Rendah'], ['#FFC200', 'Sedang'], ['#F97316', 'Tinggi'], ['#EF4444', 'Kritis']].map(([c, l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: 10, height: 10, background: c, borderRadius: 2, display: 'inline-block' }} />
                        {l}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    Total: <strong style={{ color: 'var(--gray-700)' }}>{sebaranWilayah.reduce((s: number, k: any) => s + k.total, 0)}</strong> laporan
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SEBARAN LAPORAN PER KELURAHAN — Stacked Bar
      ══════════════════════════════════════════════════════════════ */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏘️</span>
            <div>
              <h3>Sebaran Laporan per Kelurahan</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, margin: 0 }}>
                Distribusi 15 Kelurahan Kota Bontang — Selesai, Proses, dan Overdue SLA
              </p>
            </div>
          </div>
        </div>
        <div className="card-body">
          {sebaranKelurahan.length === 0 ? emptyState('Belum ada data sebaran kelurahan') : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={sebaranKelurahan.map(k => ({
                  ...k,
                  proses: Math.max(0, k.total - k.selesai - k.overdue)
                }))}
                margin={{ top: 12, right: 16, left: -10, bottom: 8 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                <XAxis
                  dataKey="kelurahan"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                />
                <YAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.25rem' }} />
                <Bar dataKey="proses"   name="Sedang Diproses"  stackId="a" fill="#8B5CF6" />
                <Bar dataKey="overdue"  name="Overdue SLA"      stackId="a" fill="#EF4444" />
                <Bar dataKey="selesai"  name="Selesai"          stackId="a" fill="#16A34A" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. KINERJA PENANGANAN PER OPD — Stacked Bar
      ══════════════════════════════════════════════════════════════ */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏛️</span>
            <div>
              <h3>Kinerja Penanganan per OPD</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, margin: 0 }}>
                Transparansi respons — OPD mana yang cepat, mana yang menumpuk
              </p>
            </div>
          </div>
        </div>
        <div className="card-body">
          {kinerjaOpd.length === 0 ? emptyState('Belum ada data kinerja OPD') : (
            <ResponsiveContainer width="100%" height={Math.max(180, kinerjaOpd.length * 48)}>
              <BarChart
                data={kinerjaOpd}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="nama" tick={{ fontSize: 11 }} width={70} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                <Bar dataKey="menunggu" name="Menunggu Aksi"    stackId="a" fill="#FFC200" />
                <Bar dataKey="proses"   name="Sedang Diproses"  stackId="a" fill="#8B5CF6" />
                <Bar dataKey="selesai"  name="Selesai"          stackId="a" fill="#16A34A" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          5. TREN LAPORAN — Line Chart
      ══════════════════════════════════════════════════════════════ */}
      <div className="card animate-fadeInUp">
        <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📈</span>
            <div>
              <h3>Tren Laporan Waktu ke Waktu</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, margin: 0 }}>
                Pergerakan jumlah laporan — identifikasi puncak dan tren penanganan
              </p>
            </div>
          </div>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {PERIODE_OPTS.map(opt => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${periode === opt.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPeriode(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {periode !== 'tahunan' && (
              <select
                className="form-select"
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                style={{ marginBottom: 0, minWidth: 90, height: 34, padding: '0 0.625rem', fontSize: '0.875rem' }}
              >
                {tahunOpts.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {loadingTren && <div className="spinner spinner-dark" style={{ width: 18, height: 18 }} />}
          </div>
        </div>
        <div className="card-body">
          {loadingTren ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="spinner spinner-dark" />
            </div>
          ) : trenData.length === 0 ? emptyState('Belum ada data untuk periode ini') : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trenData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={periode === 'mingguan' ? -35 : 0}
                  textAnchor={periode === 'mingguan' ? 'end' : 'middle'}
                  height={periode === 'mingguan' ? 50 : 24}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                <Line
                  type="monotone" dataKey="total" name="Total Masuk"
                  stroke="#8B5CF6" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="selesai" name="Selesai"
                  stroke="#16A34A" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16A34A' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="overdue" name="Overdue SLA"
                  stroke="#EF4444" strokeWidth={2} strokeDasharray="4 3"
                  dot={{ r: 3, fill: '#EF4444' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          div[style*="repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="1fr 1.4fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="1fr 1.4fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
