<?php

namespace App\Console\Commands;

use App\Models\LaporanWawancara;
use App\Services\KesimpulanService;
use Illuminate\Console\Command;

class RecalculateKesimpulanCommand extends Command
{
    protected $signature   = 'laporan:recalculate-kesimpulan {--id= : ID laporan spesifik (opsional)}';
    protected $description = 'Hitung ulang kesimpulan_otomatis dan kategori_urusan semua laporan menggunakan logika terbaru';

    public function __construct(private KesimpulanService $kesimpulanService)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $query = LaporanWawancara::whereNotNull('jawaban_wawancara_detail');

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        }

        $laporan = $query->get();
        $total   = $laporan->count();

        $this->info("Memproses {$total} laporan...");
        $this->newLine();

        $updated = 0;
        $skipped = 0;

        foreach ($laporan as $l) {
            $detail  = $l->jawaban_wawancara_detail;
            $kondisi = $detail['kondisi'] ?? [];

            if (empty($kondisi)) {
                $this->warn("  ⚠  Laporan #{$l->id} ({$l->kode_laporan}): tidak ada data kondisi, dilewati.");
                $skipped++;
                continue;
            }

            $hasil = $this->kesimpulanService->hitung($kondisi);

            $lama = $l->kesimpulan_otomatis;
            $baru = $hasil['kesimpulan'];

            $l->update([
                'kesimpulan_otomatis' => $baru,
                'kategori_urusan'     => $hasil['kategori_urusan'],
            ]);

            $icon = $lama !== $baru ? '✅' : '—';
            $this->line(sprintf(
                "  %s  #%d %-25s | kondisi: %d | tingkat: %-6s | %s → %s",
                $icon,
                $l->id,
                $l->kode_laporan,
                count($kondisi),
                $hasil['tingkat_keparahan'],
                $lama ?? '(kosong)',
                $baru
            ));

            $updated++;
        }

        $this->newLine();
        $this->info("Selesai. {$updated} laporan diproses, {$skipped} dilewati.");
    }
}
