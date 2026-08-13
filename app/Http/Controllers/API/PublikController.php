<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LaporanWawancara;
use Illuminate\Support\Facades\Cache;

class PublikController extends Controller
{
    /**
     * Data publik untuk landing page.
     */
    public function landing()
    {
        $stats = Cache::remember('publik_landing_stats', 300, function () {
            $total   = LaporanWawancara::whereNotIn('status_laporan', ['DRAFT'])->count();
            $selesai = LaporanWawancara::where('status_laporan', 'SELESAI')->count();
            $proses  = max(0, $total - $selesai);
            $rate    = $total > 0 ? round(($selesai / $total) * 100) : 0;

            return [
                'total_laporan' => $total,
                'laporan_selesai' => $selesai,
                'laporan_proses' => $proses,
                'tingkat_penyelesaian' => $rate,
            ];
        });

        // Ambil 5 laporan terbaru yang sudah disubmit (bukan DRAFT)
        $laporan = LaporanWawancara::with('user:id,name')
            ->whereNotIn('status_laporan', ['DRAFT'])
            ->whereNotNull('submitted_at')
            ->orderByDesc('submitted_at')
            ->limit(5)
            ->get()
            ->map(function ($l) {
                // Sensor nama: tampilkan inisial saja
                $nama = $l->user?->name ?? '';
                $bagian = explode(' ', trim($nama));
                $inisial = collect($bagian)->map(fn($b) => mb_substr($b, 0, 1) . '***')->implode(' ');

                return [
                    'kode_laporan'    => $l->kode_laporan,
                    'nama_sensor'     => $inisial ?: 'A***',
                    'kecamatan'       => $l->kecamatan ?? '—',
                    'kelurahan'       => $l->kelurahan ?? '—',
                    'kesimpulan'      => $l->kesimpulan_otomatis ?? '—',
                    'kategori_urusan' => $l->kategori_urusan ?? '—',
                    'status_laporan'  => $l->status_laporan,
                    'submitted_at'    => $l->submitted_at?->format('d M Y'),
                ];
            });

        return response()->json([
            'stats'   => $stats,
            'laporan' => $laporan,
        ]);
    }
}
