<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KonfigurasiSistem extends Model
{
    protected $table = 'konfigurasi_sistem';
    protected $fillable = ['kunci', 'nilai', 'deskripsi'];
}
