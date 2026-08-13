<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sekolah', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('npsn')->unique()->nullable();
            $table->string('alamat')->nullable();
            $table->string('kecamatan')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('opd', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('singkatan')->nullable();
            $table->string('email')->nullable();
            $table->string('telepon')->nullable();
            $table->string('kategori_urusan')->nullable(); // EKONOMI|KESEHATAN|PERMUKIMAN|PENDIDIKAN
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opd');
        Schema::dropIfExists('sekolah');
    }
};
