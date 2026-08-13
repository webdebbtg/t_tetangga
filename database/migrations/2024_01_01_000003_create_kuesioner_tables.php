<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bank soal Self-Assessment dan Kuesioner Wawancara
        Schema::create('pertanyaan_kuesioner', function (Blueprint $table) {
            $table->id();
            $table->text('teks_pertanyaan');
            $table->enum('jenis', ['SELF_ASSESSMENT', 'WAWANCARA']);
            $table->string('kategori')->nullable(); // EKONOMI|KESEHATAN|PERMUKIMAN|PENDIDIKAN
            $table->integer('bobot_nilai')->default(1);
            $table->json('opsi_jawaban')->nullable(); // [{teks, nilai}]
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        // Passing grade konfigurasi
        Schema::create('konfigurasi_sistem', function (Blueprint $table) {
            $table->id();
            $table->string('kunci')->unique();
            $table->text('nilai');
            $table->string('deskripsi')->nullable();
            $table->timestamps();
        });

        // Hasil Self-Assessment
        Schema::create('hasil_assessment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->jsonb('jawaban_detail'); // [{pertanyaan_id, opsi_dipilih, nilai}]
            $table->integer('total_skor')->default(0);
            $table->integer('skor_maksimal')->default(0);
            $table->enum('status', ['LULUS', 'TIDAK_LULUS']);
            $table->integer('passing_grade')->default(70);
            $table->timestamp('completed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hasil_assessment');
        Schema::dropIfExists('konfigurasi_sistem');
        Schema::dropIfExists('pertanyaan_kuesioner');
    }
};
