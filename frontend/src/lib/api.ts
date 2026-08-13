import axios from 'axios'

const getBaseURL = () => {
  // 1. Prioritaskan environment variable jika diset
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Jika di client-side (browser), deteksi host secara dinamis
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // Jika diakses lewat IP/domain selain localhost
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Jika diakses menggunakan port frontend standar (3000), arahkan ke port backend 8080
      if (port === '3000') {
        return `${protocol}//${hostname}:8080/api`;
      }
      // Jika diakses di port standar web (80/443), gunakan path relatif /api
      return '/api';
    }
  }
  
  // 3. Fallback default untuk local development
  return 'http://localhost:8080/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
})

// Request interceptor — tambahkan JWT token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tt_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  // Jika mengirim FormData, hapus Content-Type agar browser otomatis menambahkan boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  
  return config
})

// Response interceptor — handle token expired
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const code = error.response?.data?.code
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'TOKEN_ABSENT') {
        localStorage.removeItem('tt_token')
        localStorage.removeItem('tt_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──
export const authApi = {
  googleRedirect: (frontendUrl?: string) => api.get<{ url: string }>('/auth/google', { params: { frontend_url: frontendUrl } }),
  login: (email: string, password: string, captchaToken?: string) =>
    api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
      ...(captchaToken ? { cf_turnstile_response: captchaToken } : {}),
    }),
  register: (data: { name: string; email: string; telepon: string; password: string; password_confirmation: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),
  me: () => api.get<{ user: User; sudah_lulus: boolean; profil_lengkap: boolean }>('/me'),
  updateProfil: (data: Partial<User>) => api.put('/me/profil', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
}

// ── Assessment ──
export const assessmentApi = {
  getPertanyaan: () => api.get('/assessment/pertanyaan'),
  submit: (jawaban: JawabanItem[]) => api.post('/assessment/submit', { jawaban }),
  riwayat: () => api.get('/assessment/riwayat'),
}

// ── Observasi ──
export const observasiApi = {
  getPertanyaan: () => api.get('/observasi/pertanyaan'),
  submit: (data: FormData) => api.post('/observasi', data),
  index: (params?: Record<string, string | number>) => api.get('/observasi', { params }),
  show: (id: number) => api.get(`/observasi/${id}`),
}

// ── OPD ──
export const opdApi = {
  dashboard: () => api.get('/opd/dashboard'),
  laporan: (params?: Record<string, string>) => api.get('/opd/laporan', { params }),
  show: (id: number) => api.get(`/opd/laporan/${id}`),
  aksi: (id: number, data: { aksi: string; keterangan?: string; opd_limpah_id?: number; opd_kolaborasi_ids?: number[] }) =>
    api.post(`/opd/laporan/${id}/aksi`, data),
}

// ── Guru ──
export const guruApi = {
  dashboard: () => api.get('/guru/dashboard'),
  siswa: (params?: Record<string, string>) => api.get('/guru/siswa', { params }),
  laporanSiswa: (params?: Record<string, string>) => api.get('/guru/laporan-siswa', { params }),
  verifikasi: (id: number, data: { aksi: string; catatan?: string; opd_ids?: number[]; kategori_urusan?: string }) =>
    api.post(`/guru/laporan/${id}/verifikasi`, data),
  inputPoin: (id: number, data: { poin: number; catatan?: string }) =>
    api.post(`/guru/laporan/${id}/poin`, data),
}

// ── Admin ──
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  tren: (params?: Record<string, string>) => api.get('/admin/tren', { params }),
  heatmap: (params?: Record<string, string>) => api.get('/admin/heatmap', { params }),
  laporan: (params?: Record<string, string | number>) => api.get('/admin/laporan', { params }),
  updateLaporan: (id: number, data: any) => api.put(`/admin/laporan/${id}`, data),
  deleteLaporan: (id: number) => api.delete(`/admin/laporan/${id}`),
  ekspor: (params?: Record<string, string | boolean>) => api.get('/admin/ekspor', { params, responseType: 'arraybuffer' }),
  // Kuesioner
  kuesioner: (jenis: string) => api.get('/admin/kuesioner', { params: { jenis } }),
  storeKuesioner: (data: Partial<PertanyaanKuesioner>) => api.post('/admin/kuesioner', data),
  updateKuesioner: (id: number, data: Partial<PertanyaanKuesioner>) => api.put(`/admin/kuesioner/${id}`, data),
  deleteKuesioner: (id: number) => api.delete(`/admin/kuesioner/${id}`),
  // OPD & Sekolah
  opdList: () => api.get('/admin/opd'),
  storeOpd: (data: Partial<Opd>) => api.post('/admin/opd', data),
  updateOpd: (id: number, data: Partial<Opd>) => api.put(`/admin/opd/${id}`, data),
  sekolahList: () => api.get('/admin/sekolah'),
  storeSekolah: (data: Partial<Sekolah>) => api.post('/admin/sekolah', data),
  // Users
  users: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  updateUser: (id: number, data: { name: string; role: string; sekolah_id?: number; opd_id?: number; password?: string }) =>
    api.put(`/admin/users/${id}`, data),
  // Konfigurasi
  getKonfigurasi: () => api.get('/admin/konfigurasi'),
  updateKonfigurasi: (data: Record<string, string>) => api.put('/admin/konfigurasi', { konfigurasi: data }),
}

// ── Push Notification ──
export const pushApi = {
  subscribe: (subscription: PushSubscriptionJSON) => api.post('/push/subscribe', { subscription }),
  unsubscribe: () => api.delete('/push/unsubscribe'),
  test: () => api.post('/push/test'),
}

// ── Publik ──
export const publik = {
  sekolah: () => api.get('/sekolah'),
  opd: () => api.get('/opd'),
  landing: () => api.get<{
    stats: { total_laporan: number; laporan_selesai: number; laporan_proses: number; tingkat_penyelesaian: number }
    laporan: Array<{
      kode_laporan: string; nama_sensor: string; kecamatan: string
      kelurahan: string; kategori_urusan: string; status_laporan: string; submitted_at: string
    }>
  }>('/publik/landing'),
}

// ── Types ──
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  nis?: string
  nik?: string
  telepon?: string
  alamat?: string
  latitude?: number
  longitude?: number
  role: 'admin' | 'siswa' | 'masyarakat' | 'guru' | 'opd'
  sekolah_id?: number
  opd_id?: number
  profil_lengkap: boolean
  kelas?: string
  status_kelayakan: 'BELUM' | 'LULUS' | 'TIDAK_LULUS'
  kelayakan_at?: string
  sekolah?: Sekolah
  opd?: Opd
}

export interface JawabanItem {
  pertanyaan_id: number
  nilai: number
}

export interface PertanyaanKuesioner {
  id: number
  teks_pertanyaan: string
  jenis: 'SELF_ASSESSMENT' | 'WAWANCARA'
  kategori?: string
  bobot_nilai: number
  opsi_jawaban?: { teks: string; nilai: number }[]
  aktif: boolean
  urutan: number
}

export interface LaporanWawancara {
  id: number
  kode_laporan: string
  user_id: number
  opd_tujuan_id?: number
  latitude?: number
  longitude?: number
  alamat_laporan?: string
  kelurahan?: string
  kecamatan?: string
  dokumentasi_foto?: string[]
  catatan_observasi?: string
  skor_akhir: number
  skor_maksimal: number
  kesimpulan_otomatis?: string
  kategori_urusan?: string
  status_laporan: string
  submitted_at?: string
  deadline_selesai?: string
  status_sla: 'ON_TIME' | 'OVERDUE'
  poin_kegiatan?: number
  catatan_guru?: string
  user?: User
  opd_tujuan?: Opd
  opdTujuan?: Opd
  opd_list?: Opd[]
  verifikator?: User
  log_tindak_lanjut?: LogTindakLanjut[]
  jawaban_wawancara_detail?: {
    nama_tetangga: string
    kondisi: { label: string; keterangan?: string }[]
  }
}

export interface Sekolah {
  id: number
  nama: string
  npsn?: string
  alamat?: string
  kecamatan?: string
}

export interface Opd {
  id: number
  nama: string
  singkatan?: string
  email?: string
  telepon?: string
  alamat?: string
  aktif?: boolean
  kategori_urusan?: string
}

export interface LogTindakLanjut {
  id: number
  laporan_wawancara_id: number
  opd_id?: number
  user_id: number
  aksi: string
  keterangan?: string
  opd_limpah_id?: number
  created_at: string
  user?: User
  opd?: Opd
  opd_limpah?: Opd
}
