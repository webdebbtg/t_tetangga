<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PertanyaanKuesioner extends Model
{
    protected $table = 'pertanyaan_kuesioner';
    protected $fillable = [
        'teks_pertanyaan', 'jenis', 'kategori',
        'bobot_nilai', 'opsi_jawaban', 'aktif', 'urutan'
    ];

    protected $casts = [
        'opsi_jawaban' => 'array',
        'aktif' => 'boolean',
    ];

    // Scopes
    public function scopeSelfAssessment($query) { return $query->where('jenis', 'SELF_ASSESSMENT')->where('aktif', true); }
    public function scopeWawancara($query) { return $query->where('jenis', 'WAWANCARA')->where('aktif', true); }
    public function scopeAktif($query) { return $query->where('aktif', true); }
}
