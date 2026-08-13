<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * OPD, Guru, dan Admin dikonfigurasi langsung oleh admin — mereka tidak
 * melewati alur profil/lengkapi. Pastikan profil_lengkap = true agar
 * guard dashboard tidak mengarahkan mereka ke halaman pengisian profil.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereIn('role', ['opd', 'guru', 'admin'])
            ->where('profil_lengkap', false)
            ->update(['profil_lengkap' => true]);
    }

    public function down(): void
    {
        // Tidak ada rollback — tidak aman membalik data profil_lengkap secara massal.
    }
};
