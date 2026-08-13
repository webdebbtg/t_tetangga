'use client'

interface Props {
  onClose: () => void
}

export default function PrivacyPolicyModal({ onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'white', borderRadius: 16, width: '100%', maxWidth: 680,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '1.125rem 1.5rem',
            borderBottom: '1px solid #FEF08A',
            background: 'linear-gradient(135deg, #3D2B00, #8B6800)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>Kebijakan Privasi</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.0625rem' }}>Aplikasi Tengok Tetangga — Kota Bontang</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700, flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ overflowY: 'auto', padding: '1.375rem 1.5rem', flex: 1, fontSize: '0.8375rem', lineHeight: 1.75, color: '#2D1A00' }}>

            <p style={{ background: '#FFFBEB', border: '1px solid #FEF08A', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#78350F', marginBottom: '1.25rem', lineHeight: 1.65 }}>
              Aplikasi Tengok Tetangga berkomitmen penuh terhadap pelindungan privasi dan data pribadi Anda serta masyarakat yang diobservasi.
            </p>

            {/* I */}
            <Section title="I. KETENTUAN UMUM">
              <p style={{ fontWeight: 700, color: '#7C2D12', marginBottom: '0.5rem' }}>
                MOHON UNTUK MEMBACA SELURUH KEBIJAKAN PRIVASI YANG TERLAMPIR DENGAN CERMAT DAN SEKSAMA SEBELUM MENGGUNAKAN SETIAP FITUR DAN/ATAU LAYANAN YANG TERSEDIA DALAM APLIKASI TENGOK TETANGGA.
              </p>
              <p>Kebijakan Privasi ini adalah perjanjian antara pengguna ("Pengguna") dan Penyelenggara Sistem Elektronik Aplikasi Tengok Tetangga ("Aplikasi") yang beroperasi di lingkungan Pemerintah Daerah guna memfasilitasi pelaporan kondisi sosial masyarakat secara terintegrasi. Kebijakan Privasi ini mengatur akses, pengumpulan, dan penggunaan data di dalam Aplikasi.</p>
              <p style={{ marginTop: '0.5rem' }}>Kebijakan Privasi ini merupakan bagian yang tidak terpisahkan dari Syarat dan Ketentuan Penggunaan. Dengan menggunakan Aplikasi, Pengguna dianggap setuju untuk terikat dengan ketentuan Kebijakan Privasi ini. Apabila Pengguna tidak setuju terhadap sebagian atau seluruh isi dari Kebijakan Privasi ini, maka Pengguna dipersilakan untuk tidak mengakses atau menggunakan Aplikasi.</p>
            </Section>

            {/* II */}
            <Section title="II. DEFINISI">
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>"Aplikasi"</strong> adalah sistem informasi "Tengok Tetangga" berbasis web/mobile yang dipergunakan untuk melakukan skrining kepedulian sosial, perekaman hasil observasi lapangan, dan pelaporan kondisi kerentanan sosial warga kepada Organisasi Perangkat Daerah (OPD) terkait.</li>
                <li><strong>"Pengguna"</strong> berarti setiap orang yang terautentikasi dan menggunakan Aplikasi, baik dengan peran sebagai Siswa, Masyarakat, Guru Verifikator, Admin, maupun Petugas OPD.</li>
                <li><strong>"Data Pribadi"</strong> berarti data terkait Pengguna (seperti nama, alamat e-mail, afiliasi instansi/sekolah, dan lokasi geospasial) serta data pihak ketiga/warga yang diobservasi (kondisi sosial ekonomi, kesehatan, dokumentasi foto, dan alamat tempat tinggal).</li>
              </ol>
            </Section>

            {/* III */}
            <Section title="III. CARA KERJA APLIKASI">
              <p style={{ marginBottom: '0.5rem' }}>Pada saat Pengguna menggunakan fitur-fitur tertentu, sistem akan meminta persetujuan untuk:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>Mengakses Lokasi (GPS):</strong> Digunakan pada saat Pengguna melakukan observasi lapangan untuk merekam titik koordinat (latitude/longitude) guna keperluan pemetaan wilayah (heatmap) kerentanan sosial.</li>
                <li><strong>Mengakses Kamera dan Penyimpanan Lokal (Storage):</strong> Digunakan untuk mengambil dan mengunggah foto dokumentasi kondisi riil masyarakat/tetangga yang diobservasi sebagai bukti validasi laporan ke OPD.</li>
                <li><strong>Autentikasi Akun (OAuth):</strong> Sistem menggunakan layanan otorisasi pihak ketiga (Google) untuk memvalidasi identitas Pengguna secara aman pada saat pendaftaran dan login.</li>
              </ul>
            </Section>

            {/* IV */}
            <Section title="IV. INFORMASI YANG DIKUMPULKAN">
              <p style={{ marginBottom: '0.5rem' }}>Dalam mengelola dan memberikan pelayanan publik yang tepat sasaran, Aplikasi mengumpulkan beberapa jenis data:</p>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>Data yang diserahkan secara sukarela:</strong> Data yang diberikan saat pendaftaran atau melengkapi profil, seperti nama lengkap, alamat e-mail (via otorisasi Google), peran pengguna (Siswa/Masyarakat), dan identitas sekolah (jika berlaku).</li>
                <li><strong>Data Observasi Sosial:</strong> Narasi wawancara, centang indikator kerentanan sosial (seperti kemiskinan, kesehatan, infrastruktur rumah), dan dokumentasi visual (foto) dari warga yang diobservasi.</li>
                <li><strong>Data Sistem yang terekam otomatis:</strong> Lokasi geospasial (titik koordinat), alamat IP, waktu login, log aktivitas pembuatan laporan, dan rekam jejak penyelesaian kasus (Service Level Agreement).</li>
              </ol>
            </Section>

            {/* V */}
            <Section title="V. RETENSI DATA PRIBADI">
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Data yang telah terekam akan disimpan dan diproses secara aman dalam database server terpusat menggunakan standar keamanan infrastruktur yang memadai.</li>
                <li>Aplikasi menerapkan mekanisme penyamaran data (Data Masking) pada saat penarikan laporan (export) oleh pihak yang tidak memiliki otorisasi penuh, demi menjaga kerahasiaan identitas warga yang diobservasi.</li>
                <li>Selama Aplikasi beroperasi dan menunjang program penuntasan masalah sosial daerah, riwayat data pelaporan akan tetap disimpan sebagai arsip analitik pemerintah.</li>
              </ol>
            </Section>

            {/* VI */}
            <Section title="VI. PENGGUNAAN DATA PRIBADI">
              <p style={{ marginBottom: '0.5rem' }}>Data yang dikumpulkan akan digunakan semata-mata untuk:</p>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>Perutean Otomatis (Auto-Routing):</strong> Menganalisis narasi dan indikator kerentanan untuk meneruskan laporan secara presisi kepada OPD yang membidangi urusan tersebut (misalnya Dinas Sosial, Dinas Kesehatan, dll).</li>
                <li><strong>Pemetaan Spasial:</strong> Mengolah titik koordinat untuk menampilkan sebaran kasus sosial berbasis wilayah.</li>
                <li><strong>Apresiasi Akademik:</strong> Khusus bagi Pengguna dengan peran Siswa, status penyelesaian laporan dapat diteruskan kepada sistem sekolah atau Guru Verifikator sebagai acuan pemberian poin kegiatan sosial.</li>
              </ol>
            </Section>

            {/* VII */}
            <Section title="VII. PENGIRIMAN DAN PENYEBARLUASAN DATA PRIBADI">
              <p style={{ marginBottom: '0.5rem' }}>Data Pribadi dan Data Observasi tidak akan disebarluaskan untuk kepentingan komersial. Data hanya akan didistribusikan secara tertutup (closed-loop) kepada:</p>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Instansi Pemerintah Daerah / Organisasi Perangkat Daerah (OPD) terkait yang berwenang menindaklanjuti dan menyelesaikan temuan kerentanan sosial di lapangan.</li>
                <li>Pihak sekolah (bagi pelapor Siswa) secara terbatas untuk keperluan administrasi penilaian tugas empati sosial.</li>
                <li>Aparat penegak hukum, hanya apabila terdapat permintaan yang sah berdasarkan ketentuan peraturan perundang-undangan.</li>
              </ol>
            </Section>

            {/* VIII */}
            <Section title="VIII. PENGELOLAAN AKSES DAN PENGHAPUSAN">
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Pengguna dapat mencabut izin akses atas lokasi atau kamera kapan pun melalui menu pengaturan (settings) pada peramban (browser) atau perangkat elektronik masing-masing.</li>
                <li>Karena data observasi yang dikirimkan terintegrasi langsung dengan tata kelola layanan pemerintah, permohonan penghapusan atau ralat data laporan yang sudah berstatus "Diproses" oleh OPD harus melalui mekanisme pengajuan administratif kepada Admin sistem.</li>
              </ol>
            </Section>

            {/* IX */}
            <Section title="IX. TAUTAN KE SITUS PIHAK KETIGA">
              <p>Aplikasi dapat memuat tautan menuju sistem atau portal layanan pemerintah lainnya dalam ekosistem layanan digital daerah. Aplikasi tidak bertanggung jawab atas kebijakan privasi di luar domain sistem Tengok Tetangga.</p>
            </Section>

            {/* X */}
            <Section title="X. PERUBAHAN ATAS KEBIJAKAN PRIVASI INI">
              <p>Kebijakan Privasi ini dapat diubah atau diperbaharui dari waktu ke waktu menyesuaikan dengan regulasi Sistem Pemerintahan Berbasis Elektronik (SPBE) atau Undang-Undang Pelindungan Data Pribadi (UU PDP). Pembaruan akan diinformasikan melalui notifikasi Aplikasi.</p>
            </Section>

            {/* XI */}
            <Section title="XI. PEMBERITAHUAN DAN KONTAK PENGADUAN">
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Dalam hal Pengguna menemukan celah keamanan sistem, Pengguna dilarang memanfaatkannya untuk kepentingan apa pun dan wajib segera melaporkan temuan tersebut kepada pengelola sistem.</li>
                <li>Segala pertanyaan, kendala operasional, atau pelaporan terkait keamanan data dapat disampaikan secara tertulis melalui e-mail pusat bantuan teknis instansi penyelenggara — <a href="mailto:diskominfo@bontangkota.go.id" style={{ color: '#A07800', fontWeight: 600 }}>diskominfo@bontangkota.go.id</a></li>
              </ol>
            </Section>

            {/* XII */}
            <Section title="XII. PENGAKUAN DAN PERSETUJUAN" last>
              <p style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 8, padding: '0.75rem 1rem', color: '#78350F', lineHeight: 1.7 }}>
                Dengan mencentang, menekan tombol pendaftaran, atau tetap mengakses Aplikasi, Pengguna mengakui bahwa telah membaca, memahami, dan memberikan <strong>Persetujuan Pemilik Data Pribadi</strong> kepada sistem Tengok Tetangga untuk memproses data sesuai dengan tujuan pelayanan sosial dan ketentuan peraturan perundang-undangan yang berlaku.
              </p>
            </Section>

          </div>

          {/* Footer sticky */}
          <div style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid #F3F4F6',
            background: '#FAFAFA',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              Berlaku sejak Mei 2026 · Berdasarkan UU PDP & SPBE
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(135deg, #FFC200, #CC9B00)',
                color: '#1A0F00', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(204,155,0,0.3)',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              ✓ Selesai Membaca
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* Helper Section */
function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : '1.25rem' }}>
      <div style={{
        fontWeight: 800, fontSize: '0.8rem', color: '#7C5200',
        textTransform: 'uppercase', letterSpacing: '0.04em',
        borderLeft: '3px solid #FFC200', paddingLeft: '0.625rem',
        marginBottom: '0.5rem',
      }}>
        {title}
      </div>
      <div style={{ paddingLeft: '0.25rem' }}>{children}</div>
    </div>
  )
}
