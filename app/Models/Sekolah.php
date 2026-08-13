<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sekolah extends Model
{
    protected $table = 'sekolah';
    protected $fillable = ['nama', 'npsn', 'alamat', 'kecamatan', 'aktif'];
    protected $casts = ['aktif' => 'boolean'];

    public function users() { return $this->hasMany(User::class); }
    public function siswa() { return $this->hasMany(User::class)->where('role', 'siswa'); }
}
