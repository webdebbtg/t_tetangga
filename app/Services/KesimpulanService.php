<?php

namespace App\Services;

/**
 * Service untuk menghitung kesimpulan otomatis dan routing OPD
 * berdasarkan kondisi-kondisi yang dipilih saat observasi lapangan.
 *
 * Pendekatan v2 (count-based):
 *  1. Setiap label kondisi dipetakan langsung ke singkatan OPD tujuan.
 *  2. Tingkat keparahan ditentukan dari JUMLAH kondisi yang dipilih:
 *       0        → Kondisi Normal   / NORMAL
 *       1        → Kasus Tunggal    / RINGAN
 *       2 – 4    → Kasus Rentan     / SEDANG
 *       5 – 9    → Kasus Kompleks   / TINGGI
 *       ≥ 10     → Kasus Darurat    / EKSTREM
 *  3. OPD tujuan ditentukan langsung dari label kondisi yang dipilih.
 *  4. Kategori urusan = OPD dengan prioritas tertinggi di antara OPD terpilih.
 */
class KesimpulanService
{
    /**
     * Dapatkan peta label kondisi ke singkatan OPD secara dinamis dari database.
     */
    public static function getKondisiOpdMap(): array
    {
        return cache()->remember('kondisi_opd_map_v2', 300, function () {
            $map = self::KONDISI_OPD_MAP; // Start with fallback hardcoded values
            
            try {
                // Query active WAWANCARA questions from database
                $pertanyaanList = \App\Models\PertanyaanKuesioner::wawancara()->get();
                foreach ($pertanyaanList as $p) {
                    $opd = null;
                    if (is_array($p->opsi_jawaban)) {
                        foreach ($p->opsi_jawaban as $opt) {
                            if (isset($opt['opd']) && !empty($opt['opd'])) {
                                $opd = $opt['opd'];
                                break;
                            }
                        }
                    }
                    if ($opd) {
                        $map[trim($p->teks_pertanyaan)] = $opd;
                    }
                }
            } catch (\Exception $e) {
                // If DB is not ready during migrations/seeding
            }

            return $map;
        });
    }

    /**
     * Peta label kondisi (exact-match) → singkatan OPD tujuan.
     * Dipublikan agar AutoRoutingService bisa pakai langsung.
     */
    public const KONDISI_OPD_MAP = [
        'Lansia tinggal sendiri'
            => 'Dinsos',
        'Memiliki anggota keluarga dengan disabilitas'
            => 'Dinsos',
        'Berpenghasilan rendah'
            => 'Dinsos',
        'Tidak memiliki penghasilan tetap'
            => 'Dinsos',
        'Anak yatim/piatu'
            => 'Dinsos',
        'Keluarga yang terisolasi secara sosial (tidak memiliki hubungan baik dengan lingkungan sekitar)'
            => 'Dinsos',
        'Sakit/berpenyakit menahun'
            => 'Dinkes',
        'Memiliki anggota keluarga yang sakit kronis/menahun dan membutuhkan perawatan rutin'
            => 'Dinkes',
        'Memiliki anggota keluarga dengan gangguan jiwa (ODGJ)'
            => 'Dinkes',
        'Keluarga dengan riwayat kekerasan dalam rumah tangga (KDRT)'
            => 'DP3AKB',
        'Keluarga dengan jumlah anggota tanggungan banyak dan penghasilan tidak mencukupi'
            => 'Dinsos',
        'Keluarga yang tinggal di rumah tidak layak huni (RTLH)'
            => 'Disperkim',
        'Anak-anak putus sekolah karena keterbatasan biaya'
            => 'Disdik',
    ];

    /**
     * Peta singkatan OPD → kategori urusan laporan.
     */
    private const OPD_KATEGORI_MAP = [
        'Dinkes'    => 'KESEHATAN',
        'DP3AKB'    => 'SOSIAL',
        'Dinsos'    => 'EKONOMI',
        'Disperkim' => 'PERMUKIMAN',
        'Disdik'    => 'PENDIDIKAN',
        'BPBD'      => 'UMUM',
    ];

    /**
     * Urutan prioritas OPD untuk menentukan kategori_urusan utama.
     * Semakin kecil angka = semakin prioritas.
     */
    private const OPD_PRIORITAS = [
        'Dinkes'    => 1,
        'DP3AKB'    => 2,
        'Dinsos'    => 3,
        'Disperkim' => 4,
        'Disdik'    => 5,
        'BPBD'      => 6,
    ];

    /**
     * Hitung kesimpulan dan kategori urusan dari array kondisi.
     *
     * @param  array  $kondisiList  Array of ['label' => string, 'keterangan' => string|null]
     * @return array {
     *   kesimpulan: string,
     *   kategori_urusan: string,
     *   tingkat_keparahan: string,
     *   opd_singkatan_list: string[],
     *   jumlah_kondisi: int,
     *   skor_per_kategori: array,   // kosong, dipertahankan untuk backward-compat
     * }
     */
    public function hitung(array $kondisiList): array
    {
        $jumlah = count($kondisiList);

        // ── Tingkat keparahan & kesimpulan berdasarkan jumlah kondisi ────────
        if ($jumlah === 0) {
            $tingkat    = 'NORMAL';
            $kesimpulan = 'Kondisi_Normal';
        } elseif ($jumlah === 1) {
            $tingkat    = 'RINGAN';
            $kesimpulan = 'Kasus_Tunggal';
        } elseif ($jumlah <= 4) {
            $tingkat    = 'SEDANG';
            $kesimpulan = 'Kasus_Rentan';
        } elseif ($jumlah <= 9) {
            $tingkat    = 'TINGGI';
            $kesimpulan = 'Kasus_Kompleks';
        } else {
            $tingkat    = 'EKSTREM';
            $kesimpulan = 'Kasus_Darurat';
        }

        // ── OPD terlibat dari label kondisi (exact-match) ────────────────────
        $opdSet = [];
        $kondisiOpdMap = self::getKondisiOpdMap();
        foreach ($kondisiList as $k) {
            $label = trim($k['label'] ?? '');
            $opd   = $kondisiOpdMap[$label] ?? null;
            if ($opd) {
                $opdSet[$opd] = true;
            }
        }
        $opdList = array_keys($opdSet);

        // Urutkan berdasarkan prioritas
        usort($opdList, fn($a, $b) =>
            (self::OPD_PRIORITAS[$a] ?? 99) <=> (self::OPD_PRIORITAS[$b] ?? 99)
        );

        // Kategori urusan = OPD prioritas tertinggi
        $opdUtama      = $opdList[0] ?? 'Dinsos';
        $kategoriUtama = self::OPD_KATEGORI_MAP[$opdUtama] ?? 'EKONOMI';

        return [
            'kesimpulan'         => $kesimpulan,
            'kategori_urusan'    => $kategoriUtama,
            'tingkat_keparahan'  => $tingkat,
            'opd_singkatan_list' => $opdList,
            'jumlah_kondisi'     => $jumlah,
            'skor_per_kategori'  => [], // backward-compat (tidak dipakai lagi)
        ];
    }

    /**
     * Kembalikan peta kesimpulan → kategori OPD.
     * Dipertahankan untuk backward-compatibility (misal RecalculateCommand).
     */
    public static function getKesimpulanKategoriMap(): array
    {
        return [
            'Kasus_Tunggal'  => null,
            'Kasus_Rentan'   => null,
            'Kasus_Kompleks' => null,
            'Kasus_Darurat'  => null,
            'Kondisi_Normal' => 'UMUM',
            // Legacy values (laporan lama)
            'Kemiskinan_Ekstrem'              => 'EKONOMI',
            'Darurat_Kesehatan'               => 'KESEHATAN',
            'Permukiman_Tidak_Layak'          => 'PERMUKIMAN',
            'Putus_Sekolah_Kritis'            => 'PENDIDIKAN',
            'Kerentanan_Sosial_Berat'         => 'SOSIAL',
            'Kondisi_Kritis'                  => 'SOSIAL',
            'Rentan_Miskin'                   => 'EKONOMI',
            'Perlu_Bantuan_Kesehatan'         => 'KESEHATAN',
            'Permukiman_Kurang_Layak'         => 'PERMUKIMAN',
            'Risiko_Putus_Sekolah'            => 'PENDIDIKAN',
            'Kerentanan_Sosial_Sedang'        => 'SOSIAL',
            'Perlu_Intervensi'                => 'SOSIAL',
            'Potensi_Masalah_Ekonomi'         => 'EKONOMI',
            'Perlu_Pemantauan_Kesehatan'      => 'KESEHATAN',
            'Perlu_Perbaikan_Permukiman'      => 'PERMUKIMAN',
            'Perlu_Perhatian_Pendidikan'      => 'PENDIDIKAN',
            'Kondisi_Sosial_Perlu_Perhatian'  => 'SOSIAL',
            'Kondisi_Perlu_Perhatian'         => 'SOSIAL',
            'Multi_Masalah_Kompleks'          => null,
        ];
    }
}
