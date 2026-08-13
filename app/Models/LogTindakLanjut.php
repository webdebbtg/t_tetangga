<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogTindakLanjut extends Model
{
    protected $table = 'log_tindak_lanjut';
    protected $fillable = ['laporan_id', 'user_id', 'opd_id', 'aksi', 'keterangan', 'opd_limpah_id'];

    public function laporan() { return $this->belongsTo(LaporanWawancara::class, 'laporan_id'); }
    public function user() { return $this->belongsTo(User::class); }
    public function opd() { return $this->belongsTo(Opd::class, 'opd_id'); }
    public function opdLimpah() { return $this->belongsTo(Opd::class, 'opd_limpah_id'); }
}
