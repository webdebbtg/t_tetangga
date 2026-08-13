<?php

namespace App\Policies;

use App\Models\LaporanWawancara;
use App\Models\User;

class LaporanWawancaraPolicy
{
    /**
     * Admin dapat melihat semua laporan.
     */
    public function before(User $user): ?bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        return null;
    }

    /**
     * User boleh melihat laporan jika:
     * - Dia adalah pemilik laporan
     * - Dia adalah guru dan laporan dibuat oleh siswanya
     * - Dia adalah OPD yang ditugaskan untuk laporan tersebut
     */
    public function view(User $user, LaporanWawancara $laporan): bool
    {
        // Pemilik laporan
        if ($laporan->user_id === $user->id) {
            return true;
        }

        // OPD yang ditugaskan
        if ($user->role === 'opd' && $laporan->opd_tujuan_id === $user->opd_id) {
            return true;
        }

        // Guru — boleh melihat laporan siswa dari sekolahnya
        if ($user->role === 'guru') {
            $pelapor = $laporan->user;
            if ($pelapor && $pelapor->role === 'siswa' && $pelapor->sekolah_id === $user->sekolah_id) {
                return true;
            }
        }

        return false;
    }

    /**
     * Hanya pemilik laporan yang boleh mengubah (jika masih DRAFT).
     */
    public function update(User $user, LaporanWawancara $laporan): bool
    {
        return $laporan->user_id === $user->id && $laporan->status_laporan === 'DRAFT';
    }

    /**
     * Hanya pemilik laporan yang boleh menghapus (jika masih DRAFT).
     */
    public function delete(User $user, LaporanWawancara $laporan): bool
    {
        return $laporan->user_id === $user->id && $laporan->status_laporan === 'DRAFT';
    }
}
