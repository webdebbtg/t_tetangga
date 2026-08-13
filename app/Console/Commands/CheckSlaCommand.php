<?php

namespace App\Console\Commands;

use App\Models\LaporanWawancara;
use App\Models\LogTindakLanjut;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckSlaCommand extends Command
{
    protected $signature = 'sla:check';
    protected $description = 'Periksa laporan yang melewati SLA 7x24 jam';

    public function handle(): void
    {
        $this->info('Memeriksa SLA laporan...');

        $overdueCount = 0;

        // Laporan yang deadline sudah lewat dan belum selesai
        LaporanWawancara::overdue()
            ->chunk(100, function ($laporan) use (&$overdueCount) {
                foreach ($laporan as $l) {
                    $l->update(['status_sla' => 'OVERDUE']);

                    // Log eskalasi
                    if (!$l->eskalasi_dikirim) {
                        LogTindakLanjut::create([
                            'laporan_id' => $l->id,
                            'user_id' => 1, // system user
                            'aksi' => 'ESKALASI',
                            'keterangan' => 'SLA 7x24 jam terlampaui. Eskalasi otomatis ke Inspektorat.',
                        ]);

                        $l->update(['eskalasi_dikirim' => true]);

                        // TODO: Send notification ke inspektorat/pimpinan
                        Log::warning("SLA OVERDUE: Laporan {$l->kode_laporan} telah melampaui batas 7x24 jam.");
                    }

                    $overdueCount++;
                }
            });

        $this->info("Selesai. {$overdueCount} laporan ditandai OVERDUE.");
    }
}
