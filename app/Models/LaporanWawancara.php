<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class LaporanWawancara extends Model
{
    protected $table = 'laporan_wawancara';
    protected $fillable = [
        'kode_laporan', 'user_id', 'opd_tujuan_id',
        'latitude', 'longitude', 'alamat_laporan', 'kelurahan', 'kecamatan',
        'dokumentasi_foto', 'catatan_observasi', 'jawaban_wawancara_detail',
        'skor_akhir', 'skor_maksimal', 'kesimpulan_otomatis', 'kategori_urusan', 'alasan_routing',
        'status_laporan', 'submitted_at', 'deadline_selesai', 'status_sla',
        'eskalasi_dikirim', 'poin_kegiatan', 'catatan_guru', 'verifikator_id', 'verified_at',
    ];

    protected $casts = [
        'dokumentasi_foto' => 'array',
        'jawaban_wawancara_detail' => 'array',
        'submitted_at' => 'datetime',
        'deadline_selesai' => 'datetime',
        'verified_at' => 'datetime',
        'eskalasi_dikirim' => 'boolean',
    ];

    // Relations
    public function user() { return $this->belongsTo(User::class); }
    public function opdTujuan() { return $this->belongsTo(Opd::class, 'opd_tujuan_id'); }
    public function opdList() { return $this->belongsToMany(Opd::class, 'laporan_opd_tujuan', 'laporan_id', 'opd_id')->withPivot('selesai_at')->withTimestamps(); }
    public function verifikator() { return $this->belongsTo(User::class, 'verifikator_id'); }
    public function logTindakLanjut() { return $this->hasMany(LogTindakLanjut::class, 'laporan_id'); }

    // Scopes
    public function scopeOverdue(Builder $query)
    {
        return $query->where('deadline_selesai', '<', now())
            ->whereNotIn('status_laporan', ['SELESAI', 'DITOLAK'])
            ->where('status_sla', 'ON_TIME');
    }

    public function scopeAktif(Builder $query)
    {
        return $query->whereNotIn('status_laporan', ['SELESAI', 'DITOLAK', 'DRAFT']);
    }

    // Generate kode laporan unik
    public static function generateKode(): string
    {
        $prefix = 'TT-' . now()->format('Ymd') . '-';
        $last = static::where('kode_laporan', 'like', $prefix . '%')->count();
        return $prefix . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }

    public function isOverdue(): bool
    {
        return $this->deadline_selesai && $this->deadline_selesai->isPast()
            && !in_array($this->status_laporan, ['SELESAI', 'DITOLAK']);
    }

    public function persentaseSkor(): float
    {
        if ($this->skor_maksimal <= 0) return 0;
        return round(($this->skor_akhir / $this->skor_maksimal) * 100, 2);
    }
}
