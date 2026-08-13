<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah selesai_at ke pivot laporan_opd_tujuan
        // untuk tracking OPD mana yang sudah tandai selesai
        Schema::table('laporan_opd_tujuan', function (Blueprint $table) {
            $table->timestamp('selesai_at')->nullable()->after('opd_id');
        });

        // Tambah opd_id ke log_tindak_lanjut
        // untuk grouping timeline per-OPD
        Schema::table('log_tindak_lanjut', function (Blueprint $table) {
            $table->foreignId('opd_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('opd')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('laporan_opd_tujuan', function (Blueprint $table) {
            $table->dropColumn('selesai_at');
        });

        Schema::table('log_tindak_lanjut', function (Blueprint $table) {
            $table->dropForeign(['opd_id']);
            $table->dropColumn('opd_id');
        });
    }
};
