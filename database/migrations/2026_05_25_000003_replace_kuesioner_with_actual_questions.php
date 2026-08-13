<?php

use App\Models\PertanyaanKuesioner;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus kuesioner lama
        PertanyaanKuesioner::truncate();

        // 1. SELF-ASSESSMENT QUESTIONS
        $selfAssessment = [
            [
                'teks_pertanyaan' => 'Apakah Anda merasa hubungan Anda dengan tetangga di lingkungan sekitar sudah baik?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 1,
                'opsi_jawaban' => [
                    ['teks' => 'Sangat baik', 'nilai' => 4],
                    ['teks' => 'Cukup baik', 'nilai' => 3],
                    ['teks' => 'Kurang baik', 'nilai' => 2],
                    ['teks' => 'Tidak baik sama sekali', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Seberapa sering Anda berbicara atau berinteraksi dengan tetangga sekitar?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 2,
                'opsi_jawaban' => [
                    ['teks' => 'Sangat sering', 'nilai' => 4],
                    ['teks' => 'Kadang-kadang', 'nilai' => 3],
                    ['teks' => 'Jarang', 'nilai' => 2],
                    ['teks' => 'Tidak pernah', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apakah Anda mengetahui apakah ada tetangga yang membutuhkan bantuan di lingkungan Anda?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 3,
                'opsi_jawaban' => [
                    ['teks' => 'Ya, saya tahu banyak yang membutuhkan', 'nilai' => 4],
                    ['teks' => 'Ya, saya tahu beberapa yang membutuhkan', 'nilai' => 3],
                    ['teks' => 'Tidak banyak yang membutuhkan', 'nilai' => 2],
                    ['teks' => 'Tidak tahu sama sekali', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apakah Anda merasa penting untuk membantu tetangga yang membutuhkan?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 4,
                'opsi_jawaban' => [
                    ['teks' => 'Sangat penting', 'nilai' => 4],
                    ['teks' => 'Cukup penting', 'nilai' => 3],
                    ['teks' => 'Tidak terlalu penting', 'nilai' => 2],
                    ['teks' => 'Tidak penting sama sekali', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apa bentuk bantuan yang paling sering Anda berikan kepada tetangga yang membutuhkan?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 5,
                'opsi_jawaban' => [
                    ['teks' => 'Membantu pekerjaan rumah tangga', 'nilai' => 4],
                    ['teks' => 'Memberikan informasi atau dukungan moral', 'nilai' => 3],
                    ['teks' => 'Membantu dalam keadaan darurat', 'nilai' => 2],
                    ['teks' => 'Tidak pernah memberikan bantuan', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apakah Anda bersedia untuk berpartisipasi dalam kegiatan sosial seperti gotong royong bersama tetangga?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 6,
                'opsi_jawaban' => [
                    ['teks' => 'Sangat bersedia', 'nilai' => 4],
                    ['teks' => 'Bersedia', 'nilai' => 3],
                    ['teks' => 'Kurang bersedia', 'nilai' => 2],
                    ['teks' => 'Tidak bersedia', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apakah Anda tahu kondisi kesehatan atau kesejahteraan tetangga Anda yang membutuhkan perhatian khusus?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 7,
                'opsi_jawaban' => [
                    ['teks' => 'Ya, saya tahu dengan baik', 'nilai' => 4],
                    ['teks' => 'Cukup tahu', 'nilai' => 3],
                    ['teks' => 'Hanya sedikit tahu', 'nilai' => 2],
                    ['teks' => 'Tidak tahu sama sekali', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Menurut Anda, apa yang dapat dilakukan untuk mempererat hubungan dengan tetangga yang kurang dikenal?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 8,
                'opsi_jawaban' => [
                    ['teks' => 'Mengadakan acara silaturahmi atau kegiatan bersama', 'nilai' => 4],
                    ['teks' => 'Membantu mereka yang sedang membutuhkan', 'nilai' => 3],
                    ['teks' => 'Berbicara dan lebih mengenal satu sama lain', 'nilai' => 2],
                    ['teks' => 'Tidak tahu, tidak ada cara yang perlu dilakukan', 'nilai' => 1]
                ]
            ],
            [
                'teks_pertanyaan' => 'Apa manfaat utama yang Anda lihat dari saling membantu antar tetangga di lingkungan Anda?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 9,
                'opsi_jawaban' => [
                    ['teks' => 'Meningkatkan rasa persaudaraan dan kebersamaan', 'nilai' => 4],
                    ['teks' => 'Menciptakan lingkungan yang lebih harmonis', 'nilai' => 3],
                    ['teks' => 'Membantu mengurangi kesulitan yang dialami tetangga', 'nilai' => 2],
                    ['teks' => 'Semua jawaban di atas benar', 'nilai' => 4]
                ]
            ],
            [
                'teks_pertanyaan' => 'Jika ada program atau kegiatan yang mendukung saling membantu antar tetangga, apakah Anda akan berpartisipasi?',
                'jenis' => 'SELF_ASSESSMENT',
                'bobot_nilai' => 4,
                'urutan' => 10,
                'opsi_jawaban' => [
                    ['teks' => 'Pasti akan berpartisipasi', 'nilai' => 4],
                    ['teks' => 'Mungkin akan berpartisipasi', 'nilai' => 3],
                    ['teks' => 'Tidak yakin', 'nilai' => 2],
                    ['teks' => 'Tidak akan berpartisipasi', 'nilai' => 1]
                ]
            ],
        ];

        foreach ($selfAssessment as $q) {
            PertanyaanKuesioner::create($q);
        }

        // 2. WAWANCARA (CONDITIONS) QUESTIONS
        $wawancara = [
            [
                'teks_pertanyaan' => 'Lansia tinggal sendiri',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 1,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Urusan Jaminan Sosial / Lansia Terlantar']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga dengan disabilitas',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 2,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Rehabilitasi Sosial']
                ]
            ],
            [
                'teks_pertanyaan' => 'Berpenghasilan rendah',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 3,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Kesejahteraan Sosial - DTKS / Bansos']
                ]
            ],
            [
                'teks_pertanyaan' => 'Tidak memiliki penghasilan tetap',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 4,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Bansos']
                ]
            ],
            [
                'teks_pertanyaan' => 'Anak yatim/piatu',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 5,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Urusan Anak Terlantar / Panti Asuhan']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga yang terisolasi secara sosial (tidak memiliki hubungan baik dengan lingkungan sekitar)',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 6,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Pekerja Sosial']
                ]
            ],
            [
                'teks_pertanyaan' => 'Sakit/berpenyakit menahun',
                'jenis' => 'WAWANCARA',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 7,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Puskesmas setempat / Home Care']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga yang sakit kronis/menahun dan membutuhkan perawatan rutin',
                'jenis' => 'WAWANCARA',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 8,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Fasilitasi rujukan / BPJS PBI']
                ]
            ],
            [
                'teks_pertanyaan' => 'Memiliki anggota keluarga dengan gangguan jiwa (ODGJ)',
                'jenis' => 'WAWANCARA',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 9,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Penanganan medis psikiatri']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga dengan riwayat kekerasan dalam rumah tangga (KDRT)',
                'jenis' => 'WAWANCARA',
                'kategori' => 'SOSIAL',
                'bobot_nilai' => 1,
                'urutan' => 10,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'DP3AKB', 'opd_detail' => 'Perlindungan Perempuan dan Anak']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga dengan jumlah anggota tanggungan banyak dan penghasilan tidak mencukupi',
                'jenis' => 'WAWANCARA',
                'kategori' => 'EKONOMI',
                'bobot_nilai' => 1,
                'urutan' => 11,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinsos', 'opd_detail' => 'Bantuan ekonomi']
                ]
            ],
            [
                'teks_pertanyaan' => 'Keluarga yang tinggal di rumah tidak layak huni (RTLH)',
                'jenis' => 'WAWANCARA',
                'kategori' => 'PERMUKIMAN',
                'bobot_nilai' => 1,
                'urutan' => 12,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Disperkim', 'opd_detail' => 'Bedah Rumah dan Rusunawa']
                ]
            ],
            [
                'teks_pertanyaan' => 'Anak-anak putus sekolah karena keterbatasan biaya',
                'jenis' => 'WAWANCARA',
                'kategori' => 'PENDIDIKAN',
                'bobot_nilai' => 1,
                'urutan' => 13,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Disdik', 'opd_detail' => 'Program Kejar Paket atau Beasiswa / Bantuan Seragam']
                ]
            ],
            [
                'teks_pertanyaan' => 'Terdapat ibu hamil yang kurang mampu atau memerlukan pemeriksaan rutin',
                'jenis' => 'WAWANCARA',
                'kategori' => 'KESEHATAN',
                'bobot_nilai' => 1,
                'urutan' => 14,
                'opsi_jawaban' => [
                    ['teks' => 'Ya', 'nilai' => 1, 'opd' => 'Dinkes', 'opd_detail' => 'Kesehatan Ibu & Anak / Puskesmas']
                ]
            ],
        ];

        foreach ($wawancara as $q) {
            PertanyaanKuesioner::create($q);
        }

        // Clear cache
        cache()->forget('kondisi_opd_map_v2');
    }

    public function down(): void
    {
        PertanyaanKuesioner::truncate();
    }
};
