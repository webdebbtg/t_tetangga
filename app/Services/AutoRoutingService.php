<?php

namespace App\Services;

use App\Models\LaporanWawancara;
use App\Models\Opd;
use App\Services\KesimpulanService;
use Illuminate\Support\Facades\Log;

class AutoRoutingService
{
    /**
     * Auto-route laporan ke OPD yang tepat berdasarkan kondisi yang dipilih.
     * Setiap kondisi dipetakan langsung ke singkatan OPD via KesimpulanService::KONDISI_OPD_MAP.
     * Laporan bisa diarahkan ke beberapa OPD sekaligus (multi-OPD).
     */
    public function route(LaporanWawancara $laporan): LaporanWawancara
    {
        $opdIds = [];
        $alasan = null;

        try {
            [$opdIds, $alasan] = $this->kondisiBasedRouting($laporan);
        } catch (\Exception $e) {
            Log::warning('Kondisi-based routing gagal: ' . $e->getMessage());
        }

        // Fallback: gunakan kategori_urusan laporan
        if (empty($opdIds)) {
            [$opdIds, $alasan] = $this->fallbackRouting($laporan);
        }

        if (!empty($opdIds)) {
            $primaryOpdId = $opdIds[0]; // OPD prioritas tertinggi sebagai opd_tujuan_id
            $isForwardedNow = $laporan->status_laporan !== 'MENUNGGU_VERIFIKASI_GURU';

            $laporan->update([
                'opd_tujuan_id'   => $primaryOpdId,
                'alasan_routing'  => $alasan ?? 'Auto-routed berdasarkan kondisi laporan',
                'status_laporan'  => $isForwardedNow ? 'AUTO_ROUTED' : 'MENUNGGU_VERIFIKASI_GURU',
                // Reset deadline SLA = 2×24 jam sejak laporan diteruskan ke OPD
                'deadline_selesai' => $isForwardedNow ? now()->addHours(48) : $laporan->deadline_selesai,
                'status_sla'       => $isForwardedNow ? 'ON_TIME' : $laporan->status_sla,
            ]);
            $laporan->opdList()->sync($opdIds);
        }

        return $laporan->fresh();
    }

    /**
     * Routing berbasis label kondisi (exact-match dengan KONDISI_OPD_MAP).
     * Mengembalikan array OPD ID yang sudah diurutkan berdasarkan prioritas.
     *
     * @return array{array<int>, string|null}
     */
    private function kondisiBasedRouting(LaporanWawancara $laporan): array
    {
        $detail  = $laporan->jawaban_wawancara_detail ?? [];
        $kondisi = $detail['kondisi'] ?? [];

        if (empty($kondisi)) {
            return [[], null];
        }

        // Kumpulkan singkatan OPD unik dari kondisi yang dipilih
        $singkatanSet = [];
        $kondisiOpdMap = KesimpulanService::getKondisiOpdMap();
        foreach ($kondisi as $k) {
            $label     = trim($k['label'] ?? '');
            $singkatan = $kondisiOpdMap[$label] ?? null;
            if ($singkatan) {
                $singkatanSet[$singkatan] = true;
            }
        }

        if (empty($singkatanSet)) {
            return [[], null];
        }

        $singkatanList = array_keys($singkatanSet);

        // Ambil OPD yang aktif dari daftar singkatan
        $opds = Opd::whereIn('singkatan', $singkatanList)
            ->where('aktif', true)
            ->get();

        if ($opds->isEmpty()) {
            return [[], null];
        }

        // Prioritas: Dinkes > DP3AKB > Dinsos > Disperkim > Disdik > lainnya
        $prioritas = ['Dinkes' => 1, 'DP3AKB' => 2, 'Dinsos' => 3, 'Disperkim' => 4, 'Disdik' => 5];
        $sorted    = $opds->sortBy(fn($o) => $prioritas[$o->singkatan] ?? 99);

        $opdIds   = $sorted->pluck('id')->toArray();
        $namaList = $sorted->pluck('nama')->toArray();
        $alasan   = 'Routing berdasarkan kondisi → ' . implode(', ', $namaList);

        return [$opdIds, $alasan];
    }

    /**
     * Fallback: routing berbasis kategori_urusan laporan.
     *
     * @return array{array<int>, string|null}
     */
    private function fallbackRouting(LaporanWawancara $laporan): array
    {
        $kategori = $laporan->kategori_urusan ?? 'EKONOMI';
        $kesimpulan = $laporan->kesimpulan_otomatis;

        // Gunakan peta kesimpulan untuk laporan lama
        $kesimpulanMap  = KesimpulanService::getKesimpulanKategoriMap();
        $targetKategori = $kesimpulanMap[$kesimpulan] ?? $kategori;

        // Khusus nilai null pada peta → pakai kategori laporan
        if ($targetKategori === null) {
            $targetKategori = $kategori;
        }

        $opd = Opd::where('kategori_urusan', $targetKategori)->where('aktif', true)->first()
            ?? Opd::where('aktif', true)->first();

        if (!$opd) {
            return [[], null];
        }

        $alasan = "Fallback routing: Kesimpulan '{$kesimpulan}' → Kategori '{$targetKategori}' → {$opd->nama}";
        return [[$opd->id], $alasan];
    }
}
