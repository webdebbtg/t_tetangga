<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * Field yang aman untuk mass assignment — field sensitif wajib diassign secara eksplisit.
     * JANGAN tambahkan: role, status_kelayakan, opd_id, email_verified_at, profil_lengkap
     */
    protected $fillable = [
        'name', 'email', 'password', 'google_id', 'avatar',
        'nis', 'telepon', 'alamat', 'latitude', 'longitude',
        'sekolah_id', 'kelas',
    ];

    /**
     * Field sensitif yang wajib diassign eksplisit via forceFill() atau column assignment langsung.
     * Ini mencegah privilege escalation via mass assignment.
     */
    protected $guarded = [
        'role', 'status_kelayakan', 'opd_id', 'profil_lengkap',
        'email_verified_at', 'kelayakan_at',
    ];

    /**
     * Sembunyikan field sensitif dari serialisasi JSON response.
     * NIK dan telepon adalah PII — tidak boleh muncul di semua endpoint secara default.
     */
    /**
     * NIK disembunyikan dari semua response JSON secara default (PII sensitif — UU PDP).
     * Endpoint yang perlu NIK (admin ekspor) harus gunakan ->makeVisible(['nik']) secara eksplisit.
     */
    protected $hidden = ['password', 'remember_token', 'google_id', 'nik'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'kelayakan_at' => 'datetime',
        'profil_lengkap' => 'boolean',
        'password' => 'hashed',
    ];

    // JWT
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return ['role' => $this->role]; }

    // Relations
    public function sekolah() { return $this->belongsTo(Sekolah::class); }
    public function opd() { return $this->belongsTo(Opd::class); }
    public function hasilAssessment() { return $this->hasMany(HasilAssessment::class); }
    public function laporanWawancara() { return $this->hasMany(LaporanWawancara::class); }

    public function laporanDiverifikasi()
    {
        return $this->hasMany(LaporanWawancara::class, 'verifikator_id');
    }

    // Helpers
    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isSiswa(): bool { return $this->role === 'siswa'; }
    public function isGuru(): bool { return $this->role === 'guru'; }
    public function isOpd(): bool { return $this->role === 'opd'; }
    public function sudahLulus(): bool {
        if (in_array($this->role, ['admin', 'guru', 'opd'])) {
            return true;
        }
        return $this->status_kelayakan === 'LULUS';
    }
}
