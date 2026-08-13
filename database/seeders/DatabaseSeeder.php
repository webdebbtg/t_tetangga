<?php

namespace Database\Seeders;

use App\Models\KonfigurasiSistem;
use App\Models\Opd;
use App\Models\PertanyaanKuesioner;
use App\Models\Sekolah;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ===== SEKOLAH =====
        $sekolah = [
            ['nama' => 'SMA Negeri 1 Bontang',  'npsn' => '30400001', 'kecamatan' => 'Bontang Utara'],
            ['nama' => 'SMA Negeri 2 Bontang',  'npsn' => '30400002', 'kecamatan' => 'Bontang Selatan'],
            ['nama' => 'SMA Negeri 3 Bontang',  'npsn' => '30400006', 'kecamatan' => 'Bontang Barat'],
            ['nama' => 'SMK Negeri 1 Bontang',  'npsn' => '30400003', 'kecamatan' => 'Bontang Barat'],
            ['nama' => 'MAN Bontang',            'npsn' => '30400004', 'kecamatan' => 'Bontang Utara'],
            ['nama' => 'SMA YPK Bontang',        'npsn' => '30400007', 'kecamatan' => 'Bontang Utara'],
            ['nama' => 'SMA YPVDP Bontang',      'npsn' => '30400008', 'kecamatan' => 'Bontang Barat'],
        ];
        foreach ($sekolah as $s) {
            Sekolah::updateOrCreate(['npsn' => $s['npsn']], $s);
        }

        // ===== OPD =====
        $opd = [
            ['nama' => 'Dinas Sosial', 'singkatan' => 'Dinsos', 'kategori_urusan' => 'EKONOMI', 'email' => 'dinsos@bontang.go.id'],
            ['nama' => 'Dinas Kesehatan', 'singkatan' => 'Dinkes', 'kategori_urusan' => 'KESEHATAN', 'email' => 'dinkes@bontang.go.id'],
            ['nama' => 'Dinas Perumahan & Permukiman', 'singkatan' => 'Disperkim', 'kategori_urusan' => 'PERMUKIMAN', 'email' => 'disperkim@bontang.go.id'],
            ['nama' => 'Dinas Pendidikan', 'singkatan' => 'Disdik', 'kategori_urusan' => 'PENDIDIKAN', 'email' => 'disdik@bontang.go.id'],
            ['nama' => 'Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga Berencana', 'singkatan' => 'DP3AKB', 'kategori_urusan' => 'SOSIAL', 'email' => 'dp3akb@bontang.go.id'],
            ['nama' => 'BPBD', 'singkatan' => 'BPBD', 'kategori_urusan' => 'UMUM', 'email' => 'bpbd@bontang.go.id'],
        ];
        foreach ($opd as $o) {
            Opd::firstOrCreate(['singkatan' => $o['singkatan']], $o);
        }

        // ===== USERS SISTEM (permanent — tidak akan hilang saat re-seed) =====
        // Gunakan updateOrCreate agar data selalu sinkron, tapi TIDAK menimpa password
        // jika user sudah ada (cek kolom `name` saja yang di-update)

        $adminExist = User::where('email', 'admin@tengoktetangga.id')->first();
        if (!$adminExist) {
            User::create([
                'name'             => 'Administrator',
                'email'            => 'admin@tengoktetangga.id',
                'password'         => Hash::make('Admin@2025!'),
                'role'             => 'admin',
                'profil_lengkap'   => true,
                'status_kelayakan' => 'LULUS',
                'email_verified_at'=> now(),
            ]);
        } else {
            $adminExist->update(['role' => 'admin', 'profil_lengkap' => true]);
        }

        // ── 4 OPD users ──
        $opdAccounts = [
            ['email' => 'dinsos@tengoktetangga.id',    'name' => 'Petugas Dinas Sosial',             'singkatan' => 'Dinsos'],
            ['email' => 'dinkes@tengoktetangga.id',    'name' => 'Petugas Dinas Kesehatan',          'singkatan' => 'Dinkes'],
            ['email' => 'disperkim@tengoktetangga.id', 'name' => 'Petugas Dinas Perumahan & Perkim', 'singkatan' => 'Disperkim'],
            ['email' => 'disdik@tengoktetangga.id',    'name' => 'Petugas Dinas Pendidikan',         'singkatan' => 'Disdik'],
            ['email' => 'dp3akb@tengoktetangga.id',    'name' => 'Petugas DP3AKB',                   'singkatan' => 'DP3AKB'],
        ];
        foreach ($opdAccounts as $a) {
            $opdUser = User::where('email', $a['email'])->first();
            if (!$opdUser) {
                User::create([
                    'name'            => $a['name'],
                    'email'           => $a['email'],
                    'password'        => Hash::make('Opd@2025!'),
                    'role'            => 'opd',
                    'opd_id'          => Opd::where('singkatan', $a['singkatan'])->first()?->id,
                    'profil_lengkap'  => true,
                    'email_verified_at'=> now(),
                ]);
            } else {
                $opdUser->update([
                    'role'    => 'opd',
                    'opd_id'  => Opd::where('singkatan', $a['singkatan'])->first()?->id,
                    'profil_lengkap' => true,
                ]);
            }
        }

        // ── Guru ──
        $guruExist = User::where('email', 'guru@tengoktetangga.id')->first();
        if (!$guruExist) {
            User::create([
                'name'             => 'Budi Santoso, S.Pd',
                'email'            => 'guru@tengoktetangga.id',
                'password'         => Hash::make('Guru@2025!'),
                'role'             => 'guru',
                'sekolah_id'       => Sekolah::where('npsn', '30400001')->first()?->id,
                'profil_lengkap'   => true,
                'email_verified_at'=> now(),
            ]);
        } else {
            $guruExist->update(['role' => 'guru', 'profil_lengkap' => true]);
        }

        // ── Siswa (status_kelayakan=BELUM agar wajib ulang assessment) ──
        $siswaExist = User::where('email', 'siswa@tengoktetangga.id')->first();
        if (!$siswaExist) {
            User::create([
                'name'             => 'Anisa Putri',
                'email'            => 'siswa@tengoktetangga.id',
                'password'         => Hash::make('Siswa@2025!'),
                'role'             => 'siswa',
                'sekolah_id'       => Sekolah::where('npsn', '30400001')->first()?->id,
                'kelas'            => 'XII IPS 1',
                'nis'              => '202410101',
                'telepon'          => '081234567890',
                'alamat'           => 'Jl. Awang Long No.12, Bontang Baru',
                'latitude'         => 0.133333,
                'longitude'        => 117.483333,
                'profil_lengkap'   => true,
                'status_kelayakan' => 'BELUM',
                'kelayakan_at'     => null,
                'email_verified_at'=> now(),
            ]);
        }

        // ── Masyarakat (status_kelayakan=BELUM agar wajib ulang assessment) ──
        $wargaExist = User::where('email', 'warga@tengoktetangga.id')->first();
        if (!$wargaExist) {
            User::create([
                'name'             => 'Siti Rahayu',
                'email'            => 'warga@tengoktetangga.id',
                'password'         => Hash::make('Warga@2025!'),
                'role'             => 'masyarakat',
                'telepon'          => '082345678901',
                'alamat'           => 'Jl. R.E. Martadinata No.5, Loktuan',
                'latitude'         => 0.145678,
                'longitude'        => 117.491234,
                'profil_lengkap'   => true,
                'status_kelayakan' => 'BELUM',
                'kelayakan_at'     => null,
                'email_verified_at'=> now(),
            ]);
        }

        // ===== KONFIGURASI SISTEM =====
        $configs = [
            ['kunci' => 'self_assessment_passing_grade', 'nilai' => '90', 'deskripsi' => 'Passing grade Self-Assessment (persentase 0-100)'],
            ['kunci' => 'max_ulang_assessment', 'nilai' => '3', 'deskripsi' => 'Maksimum pengulangan Self-Assessment per hari'],
            ['kunci' => 'sla_jam', 'nilai' => '168', 'deskripsi' => 'SLA penanganan laporan dalam jam (7x24 = 168)'],
            ['kunci' => 'nama_aplikasi', 'nilai' => 'Tengok Tetangga', 'deskripsi' => 'Nama aplikasi'],
            ['kunci' => 'versi_aplikasi', 'nilai' => '1.0.0', 'deskripsi' => 'Versi aplikasi'],
        ];
        foreach ($configs as $c) {
            KonfigurasiSistem::firstOrCreate(['kunci' => $c['kunci']], $c);
        }

        // ===== PERTANYAAN SELF-ASSESSMENT =====
        $selfAssessment = [
            ['teks_pertanyaan' => 'Apakah Anda merasa hubungan Anda dengan tetangga di lingkungan sekitar sudah baik?', 'bobot_nilai' => 4, 'urutan' => 1, 'opsi_jawaban' => [['teks' => 'Sangat baik', 'nilai' => 4], ['teks' => 'Cukup baik', 'nilai' => 3], ['teks' => 'Kurang baik', 'nilai' => 2], ['teks' => 'Tidak baik sama sekali', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Seberapa sering Anda berbicara atau berinteraksi dengan tetangga sekitar?', 'bobot_nilai' => 4, 'urutan' => 2, 'opsi_jawaban' => [['teks' => 'Sangat sering', 'nilai' => 4], ['teks' => 'Kadang-kadang', 'nilai' => 3], ['teks' => 'Jarang', 'nilai' => 2], ['teks' => 'Tidak pernah', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apakah Anda mengetahui apakah ada tetangga yang membutuhkan bantuan di lingkungan Anda?', 'bobot_nilai' => 4, 'urutan' => 3, 'opsi_jawaban' => [['teks' => 'Ya, saya tahu banyak yang membutuhkan', 'nilai' => 4], ['teks' => 'Ya, saya tahu beberapa yang membutuhkan', 'nilai' => 3], ['teks' => 'Tidak banyak yang membutuhkan', 'nilai' => 2], ['teks' => 'Tidak tahu sama sekali', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apakah Anda merasa penting untuk membantu tetangga yang membutuhkan?', 'bobot_nilai' => 4, 'urutan' => 4, 'opsi_jawaban' => [['teks' => 'Sangat penting', 'nilai' => 4], ['teks' => 'Cukup penting', 'nilai' => 3], ['teks' => 'Tidak terlalu penting', 'nilai' => 2], ['teks' => 'Tidak penting sama sekali', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apa bentuk bantuan yang paling sering Anda berikan kepada tetangga yang membutuhkan?', 'bobot_nilai' => 4, 'urutan' => 5, 'opsi_jawaban' => [['teks' => 'Membantu pekerjaan rumah tangga', 'nilai' => 4], ['teks' => 'Memberikan informasi atau dukungan moral', 'nilai' => 3], ['teks' => 'Membantu dalam keadaan darurat', 'nilai' => 2], ['teks' => 'Tidak pernah memberikan bantuan', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apakah Anda bersedia untuk berpartisipasi dalam kegiatan sosial seperti gotong royong bersama tetangga?', 'bobot_nilai' => 4, 'urutan' => 6, 'opsi_jawaban' => [['teks' => 'Sangat bersedia', 'nilai' => 4], ['teks' => 'Bersedia', 'nilai' => 3], ['teks' => 'Kurang bersedia', 'nilai' => 2], ['teks' => 'Tidak bersedia', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apakah Anda tahu kondisi kesehatan atau kesejahteraan tetangga Anda yang membutuhkan perhatian khusus?', 'bobot_nilai' => 4, 'urutan' => 7, 'opsi_jawaban' => [['teks' => 'Ya, saya tahu dengan baik', 'nilai' => 4], ['teks' => 'Cukup tahu', 'nilai' => 3], ['teks' => 'Hanya sedikit tahu', 'nilai' => 2], ['teks' => 'Tidak tahu sama sekali', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Menurut Anda, apa yang dapat dilakukan untuk mempererat hubungan dengan tetangga yang kurang dikenal?', 'bobot_nilai' => 4, 'urutan' => 8, 'opsi_jawaban' => [['teks' => 'Mengadakan acara silaturahmi atau kegiatan bersama', 'nilai' => 4], ['teks' => 'Membantu mereka yang sedang membutuhkan', 'nilai' => 3], ['teks' => 'Berbicara dan lebih mengenal satu sama lain', 'nilai' => 2], ['teks' => 'Tidak tahu, tidak ada cara yang perlu dilakukan', 'nilai' => 1]]],
            ['teks_pertanyaan' => 'Apa manfaat utama yang Anda lihat dari saling membantu antar tetangga di lingkungan Anda?', 'bobot_nilai' => 4, 'urutan' => 9, 'opsi_jawaban' => [['teks' => 'Meningkatkan rasa persaudaraan dan kebersamaan', 'nilai' => 4], ['teks' => 'Menciptakan lingkungan yang lebih harmonis', 'nilai' => 3], ['teks' => 'Membantu mengurangi kesulitan yang dialami tetangga', 'nilai' => 2], ['teks' => 'Semua jawaban di atas benar', 'nilai' => 4]]],
            ['teks_pertanyaan' => 'Jika ada program atau kegiatan yang mendukung saling membantu antar tetangga, apakah Anda akan berpartisipasi?', 'bobot_nilai' => 4, 'urutan' => 10, 'opsi_jawaban' => [['teks' => 'Pasti akan berpartisipasi', 'nilai' => 4], ['teks' => 'Mungkin akan berpartisipasi', 'nilai' => 3], ['teks' => 'Tidak yakin', 'nilai' => 2], ['teks' => 'Tidak akan berpartisipasi', 'nilai' => 1]]],
        ];
        foreach ($selfAssessment as $q) {
            PertanyaanKuesioner::firstOrCreate(
                ['teks_pertanyaan' => $q['teks_pertanyaan'], 'jenis' => 'SELF_ASSESSMENT'],
                array_merge($q, ['jenis' => 'SELF_ASSESSMENT'])
            );
        }

        // ===== PERTANYAAN WAWANCARA LAPANGAN =====
        $wawancara = [
            [
                'teks_pertanyaan' => 'Lansia tinggal sendiri',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 1,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Urusan Jaminan Sosial / Lansia Terlantar']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga dengan disabilitas',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 2,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Rehabilitasi Sosial']
                ]
            ],
            [
                'teks_pertanyaan' => 'Berpenghasilan rendah',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 3,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Kesejahteraan Sosial - DTKS / Bansos']
                ]
            ],
            [
                'teks_pertanyaan' => 'Tidak memiliki penghasilan tetap',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 4,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Bansos']
                ]
            ],
            [
                'teks_pertanyaan' => 'Anak yatim/piatu',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 5,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Urusan Anak Terlantar / Panti Asuhan']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga yang terisolasi secara sosial (tidak memiliki hubungan baik dengan lingkungan sekitar)',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 6,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Pekerja Sosial']
                ]
            ],
            [
                'teks_pertanyaan' => 'Sakit/berpenyakit menahun',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 7,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Puskesmas setempat / Home Care']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga yang sakit kronis/menahun dan membutuhkan perawatan rutin',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 8,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Fasilitasi rujukan / BPJS PBI']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga dengan gangguan jiwa (ODGJ)',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 9,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Penanganan medis psikiatri']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga dengan riwayat kekerasan dalam rumah tangga (KDRT)',
                'kategori' => 'SOSIAL',
                'bobot_nilai' => 1,
                'urutan' => 10,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'DP3AKB', 'opd_detail' => 'Perlindungan Perempuan dan Anak']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga dengan jumlah anggota tanggungan banyak dan penghasilan tidak mencukupi',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 11,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Bantuan ekonomi']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga yang tinggal di rumah tidak layak huni (RTLH)',
                'kategori' => 'PERMUKIMAN',
                'bobot_nilai' => 1,
                'urutan' => 12,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Disperkim', 'opd_detail' => 'Bedah Rumah dan Rusunawa']
                ]
            ],
            [
                'teks_pertanyaan' => 'Anak-anak putus sekolah karena keterbatasan biaya',
                'kategori' => 'PENDIDIKAN',
                'bobot_nilai' => 1,
                'urutan' => 13,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Disdik', 'opd_detail' => 'Program Kejar Paket atau Beasiswa / Bantuan Seragam']
                ]
            ],
            [
                'teks_pertanyaan' => 'Terdapat ibu hamil yang kurang mampu atau memerlukan pemeriksaan rutin',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 14,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Kesehatan Ibu & Anak / Puskesmas']
                ]
            ],
        ];
        foreach ($wawancara as $q) {
            PertanyaanKuesioner::firstOrCreate(
                ['teks_pertanyaan' => $q['teks_pertanyaan'], 'jenis' => 'WAWANCARA'],
                array_merge($q, ['jenis' => 'WAWANCARA'])
            );
        }

        // ===== LAPORAN WAWANCARA (RESTORING 5 ORIGINAL REPORTS FROM SCREENSHOT) =====
        $siswa = User::where('email', 'siswa@tengoktetangga.id')->first();
        $diskominfo = User::where('email', 'diskominfo@bontangkota.go.id')->first();
        if (!$diskominfo) {
            $diskominfo = User::create([
                'name'             => 'Diskominfo Kota Bontang',
                'email'            => 'diskominfo@bontangkota.go.id',
                'password'         => Hash::make('Diskominfo@2025!'),
                'role'             => 'masyarakat',
                'profil_lengkap'   => true,
                'status_kelayakan' => 'LULUS',
                'email_verified_at'=> now(),
            ]);
        }

        if ($siswa && $diskominfo) {
            $mockReports = [
                [
                    'kode_laporan' => 'TT-20260526-0002',
                    'user_id' => $diskominfo->id,
                    'opds' => ['Dinsos'],
                    'latitude' => 0.133333,
                    'longitude' => 117.483333,
                    'alamat_laporan' => 'Jl. Awang Long No.12, Bontang Baru',
                    'kelurahan' => 'Bontang Baru',
                    'kecamatan' => 'Bontang Utara',
                    'catatan_observasi' => 'Ditemukan lansia kurang mampu memerlukan jaminan sosial dari dinas sosial di Kelurahan Bontang Baru.',
                    'skor_akhir' => 1,
                    'skor_maksimal' => 5,
                    'kesimpulan_otomatis' => 'KASUS_RENTAN',
                    'kategori_urusan' => 'EKONOMI',
                    'status_laporan' => 'AUTO_ROUTED',
                    'submitted_at' => \Carbon\Carbon::create(2026, 5, 26, 10, 0, 0),
                    'status_sla' => 'ON_TIME',
                ],
                [
                    'kode_laporan' => 'TT-20260526-0001',
                    'user_id' => $diskominfo->id,
                    'opds' => ['Dinsos'],
                    'latitude' => 0.145678,
                    'longitude' => 117.491234,
                    'alamat_laporan' => 'Jl. R.E. Martadinata No.5, Loktuan',
                    'kelurahan' => 'Loktuan',
                    'kecamatan' => 'Bontang Utara',
                    'catatan_observasi' => 'Anak yatim piatu piatu terlantar yang memerlukan bantuan sosial tunai dari Dinsos.',
                    'skor_akhir' => 1,
                    'skor_maksimal' => 5,
                    'kesimpulan_otomatis' => 'KASUS_TUNGGAL',
                    'kategori_urusan' => 'EKONOMI',
                    'status_laporan' => 'SELESAI',
                    'submitted_at' => \Carbon\Carbon::create(2026, 5, 26, 9, 0, 0),
                    'verified_at' => \Carbon\Carbon::create(2026, 5, 26, 17, 0, 0),
                    'status_sla' => 'ON_TIME',
                ],
                [
                    'kode_laporan' => 'TT-20260525-0003',
                    'user_id' => $diskominfo->id,
                    'opds' => ['Dinsos', 'Disperkim', 'Disdik'],
                    'latitude' => 0.125000,
                    'longitude' => 117.460000,
                    'alamat_laporan' => 'Jl. Bhayangkara, Gunung Elai',
                    'kelurahan' => 'Gunung Elai',
                    'kecamatan' => 'Bontang Utara',
                    'catatan_observasi' => 'Keluarga rentan dengan atap rumah bocor dan anak putus sekolah memerlukan bantuan terpadu.',
                    'skor_akhir' => 1,
                    'skor_maksimal' => 5,
                    'kesimpulan_otomatis' => 'KASUS_RENTAN',
                    'kategori_urusan' => 'EKONOMI',
                    'status_laporan' => 'SELESAI',
                    'submitted_at' => \Carbon\Carbon::create(2026, 5, 25, 11, 0, 0),
                    'verified_at' => \Carbon\Carbon::create(2026, 5, 25, 18, 0, 0),
                    'status_sla' => 'ON_TIME',
                ],
                [
                    'kode_laporan' => 'TT-20260525-0002',
                    'user_id' => $siswa->id,
                    'opds' => ['Dinsos', 'Dinkes', 'Disperkim', 'Disdik'],
                    'latitude' => 0.134567,
                    'longitude' => 117.472345,
                    'alamat_laporan' => 'Jl. Bhayangkara Gang IV, Gunung Elai',
                    'kelurahan' => 'Gunung Elai',
                    'kecamatan' => 'Bontang Utara',
                    'catatan_observasi' => 'Kasus kompleks: ibu hamil berisiko tinggi tanpa jaminan kesehatan, anak putus sekolah, dan kondisi rumah tidak layak huni.',
                    'skor_akhir' => 1,
                    'skor_maksimal' => 5,
                    'kesimpulan_otomatis' => 'KASUS_KOMPLEKS',
                    'kategori_urusan' => 'SOSIAL',
                    'status_laporan' => 'SELESAI',
                    'submitted_at' => \Carbon\Carbon::create(2026, 5, 25, 10, 0, 0),
                    'verified_at' => \Carbon\Carbon::create(2026, 5, 25, 16, 0, 0),
                    'status_sla' => 'ON_TIME',
                ],
                [
                    'kode_laporan' => 'TT-20260525-0001',
                    'user_id' => $siswa->id,
                    'opds' => ['Dinsos', 'Dinkes', 'Disperkim'],
                    'latitude' => 0.141234,
                    'longitude' => 117.481234,
                    'alamat_laporan' => 'Jl. Kapal Selam, Loktuan',
                    'kelurahan' => 'Loktuan',
                    'kecamatan' => 'Bontang Utara',
                    'catatan_observasi' => 'Ibu hamil kurang mampu yang memerlukan bantuan kesehatan serta bantuan perbaikan rumah tidak layak huni.',
                    'skor_akhir' => 1,
                    'skor_maksimal' => 5,
                    'kesimpulan_otomatis' => 'KASUS_RENTAN',
                    'kategori_urusan' => 'KESEHATAN',
                    'status_laporan' => 'SELESAI',
                    'submitted_at' => \Carbon\Carbon::create(2026, 5, 25, 8, 0, 0),
                    'verified_at' => \Carbon\Carbon::create(2026, 5, 25, 15, 0, 0),
                    'status_sla' => 'ON_TIME',
                ]
            ];

            foreach ($mockReports as $rep) {
                // Determine first OPD and sync opd_tujuan_id
                $firstOpdSingkatan = $rep['opds'][0] ?? null;
                $firstOpd = $firstOpdSingkatan ? Opd::where('singkatan', $firstOpdSingkatan)->first() : null;

                // Build target OPD list IDs
                $opdIds = [];
                foreach ($rep['opds'] as $singkatan) {
                    $o = Opd::where('singkatan', $singkatan)->first();
                    if ($o) {
                        $opdIds[] = $o->id;
                    }
                }

                // Prepare clean array for insert
                $dataToInsert = $rep;
                unset($dataToInsert['opds']);
                $dataToInsert['opd_tujuan_id'] = $firstOpd?->id;

                $laporan = \App\Models\LaporanWawancara::updateOrCreate(
                    ['kode_laporan' => $rep['kode_laporan']],
                    $dataToInsert
                );

                $laporan->opdList()->sync($opdIds);
            }
        }

        $this->command->info('✅ Seeder selesai: Sekolah, OPD, Users, Konfigurasi, dan Pertanyaan Kuesioner berhasil dibuat.');
    }
}
