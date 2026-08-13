<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Update password user-user sistem ke password baru yang lebih kuat.
 * Hanya berlaku untuk akun seed bawaan — tidak menyentuh akun Google OAuth
 * (yang passwordnya null) maupun akun user biasa lainnya.
 */
return new class extends Migration
{
    private array $seedPasswords = [
        'admin@tengoktetangga.id'     => 'Admin@2025!',
        'dinsos@tengoktetangga.id'    => 'Opd@2025!',
        'dinkes@tengoktetangga.id'    => 'Opd@2025!',
        'disperkim@tengoktetangga.id' => 'Opd@2025!',
        'disdik@tengoktetangga.id'    => 'Opd@2025!',
        'guru@tengoktetangga.id'      => 'Guru@2025!',
        'siswa@tengoktetangga.id'     => 'Siswa@2025!',
        'warga@tengoktetangga.id'     => 'Warga@2025!',
    ];

    public function up(): void
    {
        foreach ($this->seedPasswords as $email => $password) {
            DB::table('users')
                ->where('email', $email)
                ->update(['password' => Hash::make($password)]);
        }
    }

    public function down(): void
    {
        // Kembalikan ke password lama jika perlu rollback
        $oldPassword = Hash::make('password123');
        foreach (array_keys($this->seedPasswords) as $email) {
            DB::table('users')
                ->where('email', $email)
                ->update(['password' => $oldPassword]);
        }
    }
};
