<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('id');
            $table->string('avatar')->nullable()->after('email');
            $table->string('password')->nullable()->change();
            $table->string('nis', 20)->nullable()->unique()->after('name'); // untuk siswa
            $table->string('telepon')->nullable()->after('nis');
            $table->text('alamat')->nullable()->after('telepon');
            $table->decimal('latitude', 10, 8)->nullable()->after('alamat');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->enum('role', ['admin', 'siswa', 'masyarakat', 'guru', 'opd'])->default('masyarakat')->after('longitude');
            $table->foreignId('sekolah_id')->nullable()->constrained('sekolah')->nullOnDelete()->after('role');
            $table->foreignId('opd_id')->nullable()->constrained('opd')->nullOnDelete()->after('sekolah_id');
            $table->boolean('profil_lengkap')->default(false)->after('opd_id');
            $table->string('kelas')->nullable()->after('profil_lengkap'); // untuk siswa
            $table->enum('status_kelayakan', ['BELUM', 'LULUS', 'TIDAK_LULUS'])->default('BELUM')->after('kelas');
            $table->timestamp('kelayakan_at')->nullable()->after('status_kelayakan');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_id', 'avatar', 'nis', 'telepon', 'alamat', 'latitude', 'longitude', 'role',
                'sekolah_id', 'opd_id', 'profil_lengkap', 'kelas',
                'status_kelayakan', 'kelayakan_at'
            ]);
        });
    }
};
