<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Opd extends Model
{
    protected $table = 'opd';
    protected $fillable = ['nama', 'singkatan', 'email', 'telepon', 'kategori_urusan', 'aktif'];
    protected $casts = ['aktif' => 'boolean'];

    public function users() { return $this->hasMany(User::class); }
    public function laporanWawancara() { return $this->hasMany(LaporanWawancara::class, 'opd_tujuan_id'); }

    public function statistikSla()
    {
        return [
            'total' => $this->laporanWawancara()->count(),
            'on_time' => $this->laporanWawancara()->where('status_sla', 'ON_TIME')->count(),
            'overdue' => $this->laporanWawancara()->where('status_sla', 'OVERDUE')->count(),
        ];
    }
}
