<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reset status kelayakan semua user dengan role siswa/masyarakat
 * agar mereka wajib mengulang Self-Assessment dari awal.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereIn('role', ['siswa', 'masyarakat'])
            ->update([
                'status_kelayakan' => 'BELUM',
                'kelayakan_at'     => null,
            ]);
    }

    public function down(): void
    {
        // Tidak bisa di-rollback otomatis karena data asal tidak diketahui
    }
};
