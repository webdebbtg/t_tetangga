'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { assessmentApi, PertanyaanKuesioner } from '@/lib/api'
import toast from 'react-hot-toast'

interface JawabanState { [pertanyaanId: number]: number }

export default function SelfAssessmentPage() {
  const { user, sudahLulus, refreshUser } = useAuth()
  const router = useRouter()
  const [pertanyaan, setPertanyaan] = useState<PertanyaanKuesioner[]>([])
  const [passingGrade, setPassingGrade] = useState(70)
  const [jawaban, setJawaban] = useState<JawabanState>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [result, setResult] = useState<null | { status: string; persentase: number; total_skor: number; skor_maksimal: number; pesan: string }>(null)

  useEffect(() => {
    if (user && !['siswa', 'masyarakat'].includes(user.role)) {
      if (user.role === 'admin') router.push('/admin/dashboard')
      else if (user.role === 'opd') router.push('/opd/dashboard')
      else if (user.role === 'guru') router.push('/guru/laporan')
      return
    }
    assessmentApi.getPertanyaan()
      .then(res => {
        setPertanyaan(res.data.pertanyaan)
        setPassingGrade(res.data.passing_grade)
      })
      .catch(() => toast.error('Gagal memuat pertanyaan'))
      .finally(() => setLoading(false))
  }, [user])

  const skorSaatIni = useCallback(() => {
    return Object.values(jawaban).reduce((a, b) => a + b, 0)
  }, [jawaban])

  const skorMaksimal = pertanyaan.reduce((a, p) => a + p.bobot_nilai, 0)
  const persentaseSaatIni = skorMaksimal > 0 ? (skorSaatIni() / skorMaksimal) * 100 : 0
  const sudahJawabSemua = pertanyaan.length > 0 && pertanyaan.every(p => jawaban[p.id] !== undefined)

  const handleSubmit = async () => {
    setAttemptedSubmit(true)
    if (!sudahJawabSemua) { 
      const missingNumbers = pertanyaan
        .map((p, idx) => jawaban[p.id] === undefined ? idx + 1 : null)
        .filter(n => n !== null)
      
      toast.error(`Ada pertanyaan yang belum dijawab: Nomor ${missingNumbers.join(', ')}`)
      return 
    }
    setSubmitting(true)
    try {
      const jawabanArr = Object.entries(jawaban).map(([id, nilai]) => ({ pertanyaan_id: Number(id), nilai }))
      const res = await assessmentApi.submit(jawabanArr)
      setResult(res.data)
      await refreshUser()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
    </div>
  )

  // Sudah lulus — tampilkan pesan, jangan perbolehkan mengulang
  if (sudahLulus) {
    return (
      <div className="page-content" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="animate-fadeInUp card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
            Anda Sudah Lulus!
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Selamat! Anda telah dinyatakan lulus uji kelayakan dan dapat mengakses fitur pembuatan laporan observasi.
          </p>

          <div style={{
            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
            borderRadius: 12, padding: '1.25rem', marginBottom: '2rem',
            border: '1px solid #86EFAC',
          }}>
            <div style={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 600, marginBottom: '0.25rem' }}>STATUS KELAYAKAN</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803D' }}>✅ LULUS</div>
            <div style={{ fontSize: '0.8125rem', color: '#166534', marginTop: '0.25rem' }}>
              Silahkan membuat laporan observasi Anda
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/observasi')}>
              📝 Buat Laporan Sekarang →
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Hasil sudah ada
  if (result) {
    const lulus = result.status === 'LULUS'
    return (
      <div className="page-content" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="animate-fadeInUp card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{lulus ? '🎉' : '😞'}</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: lulus ? 'var(--primary-dark)' : 'var(--danger)' }}>
            {lulus ? 'LULUS!' : 'BELUM LULUS'}
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', fontSize: '0.9375rem', lineHeight: 1.7 }}>{result.pesan}</p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: lulus ? 'var(--primary)' : 'var(--danger)' }}>{Math.round(result.persentase)}%</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>Skor Anda</div>
            </div>
            <div style={{ width: 1, background: 'var(--gray-200)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-600)' }}>{passingGrade}%</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>Passing Grade</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar" style={{ margin: '0 auto 2rem', height: 12 }}>
            <div className="progress-fill" style={{
              width: `${Math.min(result.persentase, 100)}%`,
              background: lulus ? undefined : 'linear-gradient(90deg, var(--danger), #F87171)',
            }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {lulus && (
              <button className="btn btn-primary" onClick={() => router.push('/observasi')}>
                📝 Mulai Observasi →
              </button>
            )}
            {!lulus && (
              <button className="btn btn-outline" onClick={() => { setResult(null); setJawaban({}) }}>
                🔄 Coba Lagi
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>Kembali</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>📋 Uji Kelayakan Self-Assessment</h1>
          {sudahLulus && <span className="badge badge-green">✓ Anda sudah lulus</span>}
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem' }}>
          Jawab semua pertanyaan di bawah ini dengan jujur. Skor ≥ {passingGrade}% untuk lulus.
        </p>
      </div>

      {/* Progress live */}
      <div className="card animate-fadeInUp" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            Progres: {Object.keys(jawaban).length}/{pertanyaan.length} dijawab
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: pertanyaan.length > 0 ? `${(Object.keys(jawaban).length / pertanyaan.length) * 100}%` : '0%',
            background: 'var(--primary)',
          }} />
        </div>
      </div>

      {/* Pertanyaan */}
      {pertanyaan.map((p, idx) => {
        const isUnanswered = attemptedSubmit && jawaban[p.id] === undefined
        return (
        <div 
          key={p.id} 
          className={`assessment-question animate-fadeInUp ${jawaban[p.id] !== undefined ? 'answered' : ''}`} 
          style={{ 
            animationDelay: `${idx * 0.05}s`,
            border: isUnanswered ? '1px solid var(--danger)' : undefined,
            backgroundColor: isUnanswered ? '#FEF2F2' : undefined 
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: jawaban[p.id] !== undefined ? 'var(--primary)' : 'var(--gray-200)',
              color: jawaban[p.id] !== undefined ? 'white' : 'var(--gray-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8125rem', fontWeight: 700, transition: 'all 0.3s',
            }}>
              {jawaban[p.id] !== undefined ? '✓' : idx + 1}
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.6, flex: 1 }}>{p.teks_pertanyaan}</p>
          </div>

          <div style={{ paddingLeft: '2.25rem' }}>
            {p.opsi_jawaban?.map((opsi, oi) => (
              <label key={oi} className={`assessment-option ${jawaban[p.id] === opsi.nilai ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`q_${p.id}`}
                  value={opsi.nilai}
                  checked={jawaban[p.id] === opsi.nilai}
                  onChange={() => setJawaban(prev => ({ ...prev, [p.id]: opsi.nilai }))}
                />
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{opsi.teks}</span>
              </label>
            ))}
            {isUnanswered && <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.5rem', fontWeight: 600 }}>Pilih salah satu jawaban di atas</div>}
          </div>
        </div>
      )})}

      {/* Submit */}
      <div className="animate-fadeInUp" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>Batalkan</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <><div className="spinner" /> Menghitung...</> : '✅ Submit Assessment'}
        </button>
      </div>
    </div>
  )
}
