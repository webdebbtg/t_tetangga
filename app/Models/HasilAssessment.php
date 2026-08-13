<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilAssessment extends Model
{
    protected $table = 'hasil_assessment';
    protected $fillable = [
        'user_id', 'jawaban_detail', 'total_skor',
        'skor_maksimal', 'status', 'passing_grade', 'completed_at'
    ];
    protected $casts = [
        'jawaban_detail' => 'array',
        'completed_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }

    public function persentaseSkor(): float
    {
        if ($this->skor_maksimal <= 0) return 0;
        return round(($this->total_skor / $this->skor_maksimal) * 100, 2);
    }
}
