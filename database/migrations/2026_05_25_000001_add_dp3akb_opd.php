<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah OPD DP3AKB jika belum ada
        $exists = DB::table('opd')->where('singkatan', 'DP3AKB')->exists();
        if (!$exists) {
            DB::table('opd')->insert([
                'nama'            => 'Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga Berencana',
                'singkatan'       => 'DP3AKB',
                'email'           => 'dp3akb@bontang.go.id',
                'telepon'         => null,
                'kategori_urusan' => 'SOSIAL',
                'aktif'           => true,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('opd')->where('singkatan', 'DP3AKB')->delete();
    }
};
