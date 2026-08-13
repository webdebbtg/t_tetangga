<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LaporanWawancara;
use App\Models\LogTindakLanjut;
use App\Models\PertanyaanKuesioner;
use App\Services\AutoRoutingService;
use App\Services\KesimpulanService;
use App\Services\StorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ObservasiController extends Controller
{
    public function __construct(
        private AutoRoutingService $routingService,
        private StorageService $storageService,
        private KesimpulanService $kesimpulanService,
    ) {}

    /**
     * Ambil pertanyaan kuesioner wawancara
     */
    public function getPertanyaan()
    {
        $user = Auth::user();

        // Hanya siswa & masyarakat yang diwajibkan lulus Self-Assessment terlebih dahulu
        if (in_array($user->role, ['siswa', 'masyarakat']) && !$user->sudahLulus()) {
            return response()->json([
                'error' => 'Anda belum lulus Self-Assessment. Selesaikan uji kelayakan terlebih dahulu.'
            ], 403);
        }

        $pertanyaan = PertanyaanKuesioner::wawancara()
            ->orderBy('urutan')
            ->get(['id', 'teks_pertanyaan', 'kategori', 'bobot_nilai', 'opsi_jawaban', 'urutan']);

        $grouped = $pertanyaan->groupBy('kategori');

        return response()->json([
            'pertanyaan' => $pertanyaan,
            'pertanyaan_per_kategori' => $grouped,
            'total_pertanyaan' => $pertanyaan->count(),
        ]);
    }

    /**
     * Submit laporan observasi
     */
    public function submit(Request $request)
    {
        $user = Auth::user();

        // Hanya siswa & masyarakat yang diwajibkan lulus Self-Assessment
        if (in_array($user->role, ['siswa', 'masyarakat']) && !$user->sudahLulus()) {
            return response()->json(['error' => 'Akses ditolak: Belum lulus Self-Assessment'], 403);
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'alamat_laporan' => 'nullable|string|max:500',
            'kelurahan' => 'nullable|string|max:100',
            'kecamatan' => 'nullable|string|max:100',
            'nama_tetangga' => 'required|string|max:255',
            'kondisi' => 'required|array|min:1',
            'kondisi.*.label' => 'required|string',
            'kondisi.*.keterangan' => 'nullable|string',
            'catatan_observasi' => 'nullable|string|max:3000',
            'foto'   => 'nullable|array|max:5',
            'foto.*' => [
                'image',
                'max:5120',
                'mimes:jpeg,jpg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
            ],
        ]);

        // Upload foto jika ada
        $fotoUrls = [];
        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $foto) {
                $fotoUrls[] = $this->storageService->uploadFoto($foto);
            }
        }

        // Simpan jawaban & kondisi
        $jawabanDetail = [
            'nama_tetangga' => $request->nama_tetangga,
            'kondisi' => $request->kondisi,
        ];

        // Hitung kesimpulan & kategori urusan menggunakan KesimpulanService
        $hasil         = $this->kesimpulanService->hitung($request->kondisi);
        $kesimpulan    = $hasil['kesimpulan'];
        $kategoriUtama = $hasil['kategori_urusan'];

        $laporan = null;
        DB::transaction(function () use (
            $user, $request, $fotoUrls, $jawabanDetail, 
            $kesimpulan, $kategoriUtama, $hasil, &$laporan
        ) {
            $statusAwal = $user->isSiswa() ? 'MENUNGGU_VERIFIKASI_GURU' : 'TERVERIFIKASI';

            $laporan = LaporanWawancara::create([
                'kode_laporan' => LaporanWawancara::generateKode(),
                'user_id' => $user->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'alamat_laporan' => $request->alamat_laporan,
                'kelurahan' => $request->kelurahan,
                'kecamatan' => $request->kecamatan,
                'dokumentasi_foto' => $fotoUrls,
                'catatan_observasi' => $request->catatan_observasi,
                'jawaban_wawancara_detail' => $jawabanDetail,
                'skor_akhir'    => $hasil['jumlah_kondisi'] ?? count($request->kondisi),
                'skor_maksimal' => 13, // total kondisi yang tersedia
                'kesimpulan_otomatis' => $kesimpulan,
                'kategori_urusan' => $kategoriUtama,
                'status_laporan' => $statusAwal,
                'submitted_at' => now(),
                'deadline_selesai' => now()->addHours((int) env('SLA_HOURS', 168)),
            ]);
        });

        // Auto-routing NLP (jalankan untuk semua agar OPD saran terpilih)
        if ($laporan) {
            try {
                $this->routingService->route($laporan);
            } catch (\Exception $e) {
                // Log tapi jangan gagalkan submit
                \Log::warning('Auto-routing gagal: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => $user->isSiswa()
                ? 'Laporan berhasil dikirim. Menunggu verifikasi Guru.'
                : 'Laporan berhasil dikirim dan sedang diproses.',
            'laporan' => $laporan->fresh()->load('opdTujuan'),
        ], 201);
    }

    /**
     * Daftar laporan user
     */
    public function index(Request $request)
    {
        $laporan = LaporanWawancara::where('user_id', Auth::id())
            ->with('opdTujuan', 'logTindakLanjut')
            ->latest()
            ->paginate(10);

        return response()->json($laporan);
    }

    /**
     * Detail laporan
     */
    public function show(LaporanWawancara $laporan)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Pemilik laporan selalu boleh lihat miliknya sendiri
        if ($laporan->user_id === $user->id) {
            return response()->json([
                'laporan' => $laporan->load('user', 'opdTujuan', 'opdList', 'verifikator', 'logTindakLanjut.user')
            ]);
        }

        // Admin boleh lihat semua laporan
        if ($user->role === 'admin') {
            return response()->json([
                'laporan' => $laporan->load('user', 'opdTujuan', 'opdList', 'verifikator', 'logTindakLanjut.user')
            ]);
        }

        // Guru hanya boleh lihat laporan dari siswa di sekolah yang sama
        if ($user->role === 'guru') {
            $pelaporSekolahId = $laporan->user?->sekolah_id;
            if (!$pelaporSekolahId || $pelaporSekolahId !== $user->sekolah_id) {
                return response()->json(['error' => 'Tidak diizinkan mengakses laporan ini.'], 403);
            }
            return response()->json([
                'laporan' => $laporan->load('user', 'opdTujuan', 'opdList', 'verifikator', 'logTindakLanjut.user')
            ]);
        }

        // OPD hanya boleh lihat laporan yang ditugaskan ke OPD mereka
        if ($user->role === 'opd') {
            $opdIds = $laporan->opdList->pluck('id')->push($laporan->opd_tujuan_id)->filter()->unique();
            if (!$opdIds->contains($user->opd_id)) {
                return response()->json(['error' => 'Tidak diizinkan mengakses laporan ini.'], 403);
            }
            return response()->json([
                'laporan' => $laporan->load('user', 'opdTujuan', 'opdList', 'verifikator', 'logTindakLanjut.user')
            ]);
        }

        return response()->json(['error' => 'Tidak diizinkan mengakses laporan ini.'], 403);
    }

}
