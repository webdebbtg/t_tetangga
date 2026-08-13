<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AssessmentController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\GuruController;
use App\Http\Controllers\API\ObservasiController;
use App\Http\Controllers\API\OpdController;
use App\Http\Controllers\API\PublikController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ========== AUTH ==========
Route::prefix('auth')->group(function () {
    // Google OAuth — 20 req/menit (redirect normal, tidak perlu super ketat)
    Route::get('/google', [AuthController::class, 'googleRedirect'])->middleware('throttle:20,1');
    Route::get('/google/callback', [AuthController::class, 'googleCallback'])->middleware('throttle:20,1');

    // Email / Password — 5 percobaan per menit (brute-force protection)
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // Register — 10 per menit (cegah spam akun)
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');

    // Forgot / Reset Password — 5 per menit per IP
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    // Authenticated
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api');
});

// ========== PUBLIK ==========
// ========== PUBLIK (Landing Page) ==========
Route::get('/publik/landing', [PublikController::class, 'landing'])->middleware('throttle:60,1');

Route::get('/sekolah', function () {
    return response()->json(['sekolah' => \App\Models\Sekolah::where('aktif', true)->get(['id', 'nama', 'npsn', 'kecamatan'])]);
});

Route::get('/opd', function () {
    return response()->json(['opd' => \App\Models\Opd::where('aktif', true)->get(['id', 'nama', 'singkatan', 'kategori_urusan'])]);
});

// ========== AUTHENTICATED ==========
Route::middleware(['auth:api', 'throttle:120,1'])->group(function () {

    // User profile — 60 req/menit
    Route::get('/me', [AuthController::class, 'me'])->middleware('throttle:60,1');
    Route::put('/me/profil', [AuthController::class, 'updateProfil'])->middleware('throttle:20,1');

    // ===== SELF-ASSESSMENT — 30 req/menit =====
    Route::prefix('assessment')->middleware('throttle:30,1')->group(function () {
        Route::get('/pertanyaan', [AssessmentController::class, 'getPertanyaan']);
        Route::post('/submit', [AssessmentController::class, 'submit']);
        Route::get('/riwayat', [AssessmentController::class, 'riwayat']);
    });

    // ===== OBSERVASI — baca 60/menit, submit (upload) hanya 10/menit =====
    Route::prefix('observasi')->group(function () {
        Route::get('/pertanyaan', [ObservasiController::class, 'getPertanyaan'])->middleware('throttle:60,1');
        Route::get('/', [ObservasiController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [ObservasiController::class, 'submit'])->middleware('throttle:10,1'); // upload foto — ketat
        Route::get('/{laporan}', [ObservasiController::class, 'show'])->middleware('throttle:60,1');
    });

    // ===== GURU — 60 req/menit =====
    Route::prefix('guru')->middleware(['role:guru', 'throttle:60,1'])->group(function () {
        Route::get('/dashboard', [GuruController::class, 'dashboard']);
        Route::get('/siswa', [GuruController::class, 'daftarSiswa']);
        Route::get('/laporan-siswa', [GuruController::class, 'laporanSiswa']);
        Route::post('/laporan/{laporan}/verifikasi', [GuruController::class, 'verifikasi']);
        Route::post('/laporan/{laporan}/poin', [GuruController::class, 'inputPoin']);
    });

    // ===== OPD — 60 req/menit =====
    Route::prefix('opd')->middleware(['role:opd', 'throttle:60,1'])->group(function () {
        Route::get('/dashboard', [OpdController::class, 'dashboard']);
        Route::get('/laporan', [OpdController::class, 'index']);
        Route::get('/laporan/{laporan}', [OpdController::class, 'show']);
        Route::post('/laporan/{laporan}/aksi', [OpdController::class, 'aksi']);
    });

    // ===== ADMIN — 60 req/menit, ekspor lebih ketat =====
    Route::prefix('admin')->middleware(['role:admin', 'throttle:60,1'])->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/tren', [AdminController::class, 'tren']);
        Route::get('/heatmap', [AdminController::class, 'heatmap']);
        Route::get('/laporan', [AdminController::class, 'indexLaporan']);
        Route::put('/laporan/{laporan}', [AdminController::class, 'updateLaporan']);
        Route::delete('/laporan/{laporan}', [AdminController::class, 'destroyLaporan']);
        Route::get('/ekspor', [AdminController::class, 'eksporLaporan'])->middleware('throttle:5,1'); // ekspor sangat ketat

        // Kuesioner CRUD
        Route::get('/kuesioner', [AdminController::class, 'indexKuesioner']);
        Route::post('/kuesioner', [AdminController::class, 'storeKuesioner']);
        Route::put('/kuesioner/{pertanyaan}', [AdminController::class, 'updateKuesioner']);
        Route::delete('/kuesioner/{pertanyaan}', [AdminController::class, 'destroyKuesioner']);

        // OPD CRUD
        Route::get('/opd', [AdminController::class, 'indexOpd']);
        Route::post('/opd', [AdminController::class, 'storeOpd']);
        Route::put('/opd/{opd}', [AdminController::class, 'updateOpd']);

        // Sekolah CRUD
        Route::get('/sekolah', [AdminController::class, 'indexSekolah']);
        Route::post('/sekolah', [AdminController::class, 'storeSekolah']);

        // Users
        Route::get('/users', [AdminController::class, 'indexUsers']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);

        // Konfigurasi sistem
        Route::get('/konfigurasi', [AdminController::class, 'getKonfigurasi']);
        Route::put('/konfigurasi', [AdminController::class, 'updateKonfigurasi'])->middleware('throttle:10,1');
    });
});
