<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_wawancara', function (Blueprint $table) {
            $table->id();
            $table->string('kode_laporan')->unique(); // TT-YYYYMMDD-XXXX
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('opd_tujuan_id')->nullable()->constrained('opd')->nullOnDelete();

            // Lokasi
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('alamat_laporan')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();

            // Konten observasi
            $table->jsonb('dokumentasi_foto')->nullable(); // [url1, url2, ...]
            $table->text('catatan_observasi')->nullable();
            $table->jsonb('jawaban_wawancara_detail')->nullable(); // [{pertanyaan_id, jawaban, nilai}]

            // Scoring & Kesimpulan
            $table->integer('skor_akhir')->default(0);
            $table->integer('skor_maksimal')->default(0);
            $table->string('kesimpulan_otomatis')->nullable(); // Kemiskinan_Ekstrem|Bantuan_Kesehatan|dll
            $table->string('kategori_urusan')->nullable(); // EKONOMI|KESEHATAN|PERMUKIMAN|PENDIDIKAN
            $table->text('alasan_routing')->nullable(); // penjelasan NLP

            // Status workflow
            $table->enum('status_laporan', [
                'DRAFT',
                'MENUNGGU_VERIFIKASI_GURU',  // untuk siswa
                'TERVERIFIKASI',
                'AUTO_ROUTED',
                'DALAM_PENANGANAN',
                'DILIMPAHKAN',
                'KOLABORASI',
                'SELESAI',
                'DITOLAK'
            ])->default('DRAFT');

            // SLA
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('deadline_selesai')->nullable(); // submitted_at + 168 jam
            $table->enum('status_sla', ['ON_TIME', 'OVERDUE'])->default('ON_TIME');
            $table->boolean('eskalasi_dikirim')->default(false);

            // Feedback akademik
            $table->integer('poin_kegiatan')->nullable();
            $table->text('catatan_guru')->nullable();
            $table->foreignId('verifikator_id')->nullable()->constrained('users')->nullOnDelete(); // guru
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
            $table->index(['status_laporan', 'status_sla']);
            $table->index(['latitude', 'longitude']);
        });

        // Log tindak lanjut OPD
        Schema::create('log_tindak_lanjut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained('laporan_wawancara')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->enum('aksi', ['PROSES', 'LIMPAHKAN', 'KOLABORASI', 'SELESAI', 'TOLAK', 'ESKALASI', 'CATATAN']);
            $table->text('keterangan')->nullable();
            $table->foreignId('opd_limpah_id')->nullable()->constrained('opd')->nullOnDelete();
            $table->timestamps();
        });

        // Log keamanan WAF
        Schema::create('log_keamanan', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45);
            $table->string('user_agent')->nullable();
            $table->enum('status', ['BLOCKED_WAF', 'RATE_LIMITED', 'ALLOWED']);
            $table->string('endpoint');
            $table->string('metode', 10)->default('GET');
            $table->integer('http_code')->nullable();
            $table->text('detail')->nullable();
            $table->timestamp('diakses_pada')->useCurrent();
            $table->index('ip_address');
            $table->index('diakses_pada');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_keamanan');
        Schema::dropIfExists('log_tindak_lanjut');
        Schema::dropIfExists('laporan_wawancara');
    }
};
