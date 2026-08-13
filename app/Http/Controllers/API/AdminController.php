<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\HasilAssessment;
use App\Models\KonfigurasiSistem;
use App\Models\LaporanWawancara;
use App\Models\Opd;
use App\Models\PertanyaanKuesioner;
use App\Models\Sekolah;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    // ===== DASHBOARD =====
    public function dashboard()
    {
        $year  = (int) date('Y');
        $month = (int) date('n');
        $today = now()->toDateString();

        // ── Core + Monthly Stats ───────────────────────────────────────────────
        $stats = Cache::remember("admin_stats_{$year}_{$month}", 300, function () use ($year, $month, $today) {
            return [
                'total_users'               => User::count(),
                'total_laporan'             => LaporanWawancara::count(),
                'laporan_selesai'           => LaporanWawancara::where('status_laporan', 'SELESAI')->count(),
                'laporan_proses'            => LaporanWawancara::whereIn('status_laporan', ['AUTO_ROUTED', 'DALAM_PENANGANAN', 'KOLABORASI', 'DILIMPAHKAN'])->count(),
                'laporan_overdue'           => LaporanWawancara::where('status_sla', 'OVERDUE')
                                                ->whereNotIn('status_laporan', ['SELESAI', 'DITOLAK'])->count(),
                'laporan_hari_ini'          => LaporanWawancara::whereDate('submitted_at', $today)->count(),
                'users_lulus'               => User::whereIn('role', ['siswa', 'masyarakat'])->where('status_kelayakan', 'LULUS')->count(),
                // Ringkasan Eksekutif — bulanan
                'laporan_bulan_ini'         => LaporanWawancara::whereYear('submitted_at', $year)->whereMonth('submitted_at', $month)->count(),
                'laporan_selesai_bulan_ini' => LaporanWawancara::whereYear('submitted_at', $year)->whereMonth('submitted_at', $month)->where('status_laporan', 'SELESAI')->count(),
            ];
        });

        // ── Distribusi Role ────────────────────────────────────────────────────
        $distribusiRole = User::groupBy('role')
            ->selectRaw('role, count(*) as total')
            ->pluck('total', 'role');

        // ── Tingkat Kerentanan Sosial (berdasarkan skor_akhir) ─────────────────
        $kerentanan = Cache::remember('admin_kerentanan_v3', 600, function () {
            return [
                ['level' => 'Ringan',  'color' => '#22C55E', 'range' => '0–1 kondisi',
                 'count' => LaporanWawancara::whereNotIn('status_laporan', ['DRAFT'])->where('skor_akhir', '<=', 1)->count()],
                ['level' => 'Sedang',  'color' => '#FFC200', 'range' => '2–4 kondisi',
                 'count' => LaporanWawancara::whereNotIn('status_laporan', ['DRAFT'])->whereBetween('skor_akhir', [2, 4])->count()],
                ['level' => 'Tinggi',  'color' => '#F97316', 'range' => '5–9 kondisi',
                 'count' => LaporanWawancara::whereNotIn('status_laporan', ['DRAFT'])->whereBetween('skor_akhir', [5, 9])->count()],
                ['level' => 'Ekstrem', 'color' => '#EF4444', 'range' => '≥10 kondisi',
                 'count' => LaporanWawancara::whereNotIn('status_laporan', ['DRAFT'])->where('skor_akhir', '>=', 10)->count()],
            ];
        });

        // ── Sebaran Wilayah per Kecamatan ──────────────────────────────────────
        $sebaranWilayah = Cache::remember('admin_sebaran_v3', 600, function () {
            return LaporanWawancara::whereNotNull('kecamatan')
                ->whereNotIn('status_laporan', ['DRAFT'])
                ->groupBy('kecamatan')
                ->select(
                    'kecamatan',
                    DB::raw('count(*) as total'),
                    DB::raw("sum(case when status_laporan = 'SELESAI' then 1 else 0 end) as selesai"),
                    DB::raw("sum(case when status_sla = 'OVERDUE' then 1 else 0 end) as overdue")
                )
                ->orderByDesc('total')
                ->limit(10)
                ->get()
                ->toArray();
        });

        // ── Sebaran Wilayah per Kelurahan ──────────────────────────────────────
        $sebaranKelurahan = Cache::remember('admin_sebaran_kelurahan_v3', 600, function () {
            $kelurahans = [
                'Api-api', 'Bontang Baru', 'Bontang Kuala', 'Gunung Elai', 'Guntung', 'Loktuan',
                'Berbas Pantai', 'Berbas Tengah', 'Bontang Lestari', 'Satimpo', 'Tanjung Laut', 'Tanjung Laut Indah',
                'Belimbing', 'Gunung Telihan', 'Kanaan'
            ];

            $counts = LaporanWawancara::whereNotNull('kelurahan')
                ->whereNotIn('status_laporan', ['DRAFT'])
                ->groupBy('kelurahan')
                ->select(
                    'kelurahan',
                    DB::raw('count(*) as total'),
                    DB::raw("sum(case when status_laporan = 'SELESAI' then 1 else 0 end) as selesai"),
                    DB::raw("sum(case when status_sla = 'OVERDUE' then 1 else 0 end) as overdue")
                )
                ->get()
                ->keyBy('kelurahan');

            $result = [];
            foreach ($kelurahans as $kel) {
                $item = $counts->get($kel);
                $result[] = [
                    'kelurahan' => $kel,
                    'total'     => $item ? (int)$item->total : 0,
                    'selesai'   => $item ? (int)$item->selesai : 0,
                    'overdue'   => $item ? (int)$item->overdue : 0,
                ];
            }

            usort($result, fn($a, $b) => strcmp($a['kelurahan'], $b['kelurahan']));
            return $result;
        });

        // ── Kinerja Penanganan per OPD ─────────────────────────────────────────
        $kinerjaOpd = Cache::remember('admin_kinerja_opd_v3', 300, function () {
            $opds = Opd::where('aktif', true)->get();
            $result = [];

            foreach ($opds as $opd) {
                $id = $opd->id;

                $menunggu = LaporanWawancara::where(function ($q) use ($id) {
                    $q->where('opd_tujuan_id', $id)
                      ->orWhereHas('opdList', fn ($q2) => $q2->where('opd.id', $id));
                })->where('status_laporan', 'AUTO_ROUTED')->count();

                $proses = LaporanWawancara::where(function ($q) use ($id) {
                    $q->where('opd_tujuan_id', $id)
                      ->orWhereHas('opdList', fn ($q2) => $q2->where('opd.id', $id));
                })->whereIn('status_laporan', ['DALAM_PENANGANAN', 'KOLABORASI', 'DILIMPAHKAN'])->count();

                $selesai = LaporanWawancara::where(function ($q) use ($id) {
                    $q->where('opd_tujuan_id', $id)
                      ->orWhereHas('opdList', fn ($q2) => $q2->where('opd.id', $id));
                })->where('status_laporan', 'SELESAI')->count();

                $total = $menunggu + $proses + $selesai;
                if ($total === 0) continue;

                $result[] = [
                    'nama'     => $opd->singkatan ?: $opd->nama,
                    'menunggu' => $menunggu,
                    'proses'   => $proses,
                    'selesai'  => $selesai,
                ];
            }

            usort($result, fn ($a, $b) =>
                ($b['menunggu'] + $b['proses'] + $b['selesai']) -
                ($a['menunggu'] + $a['proses'] + $a['selesai'])
            );

            return $result;
        });

        return response()->json([
            'stats'             => $stats,
            'distribusi_role'   => $distribusiRole,
            'kerentanan'        => $kerentanan,
            'sebaran_wilayah'   => $sebaranWilayah,
            'sebaran_kelurahan' => $sebaranKelurahan,
            'kinerja_opd'       => $kinerjaOpd,
        ]);
    }

    // ===== HEATMAP GIS =====
    public function heatmap(Request $request)
    {
        $cacheKey = 'heatmap_data_' . ($request->kesimpulan ?? 'all') . '_' . ($request->periode ?? '30');
        $data = Cache::remember($cacheKey, 600, function () use ($request) {
            $query = LaporanWawancara::whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereNotIn('status_laporan', ['DRAFT']);

            if ($request->kesimpulan) {
                $query->where('kesimpulan_otomatis', $request->kesimpulan);
            }
            if ($request->periode) {
                $query->where('submitted_at', '>=', now()->subDays((int) $request->periode));
            }

            return $query->get(['latitude', 'longitude', 'kesimpulan_otomatis', 'status_laporan', 'skor_akhir']);
        });

        return response()->json(['points' => $data]);
    }

    // ===== MANAJEMEN KUESIONER =====
    public function indexKuesioner(Request $request)
    {
        $jenis = $request->get('jenis', 'SELF_ASSESSMENT');
        $pertanyaan = PertanyaanKuesioner::where('jenis', $jenis)->orderBy('urutan')->get();
        return response()->json(['pertanyaan' => $pertanyaan]);
    }

    public function storeKuesioner(Request $request)
    {
        $validated = $request->validate([
            'teks_pertanyaan' => 'required|string|max:1000',
            'jenis' => 'required|in:SELF_ASSESSMENT,WAWANCARA',
            'kategori' => 'nullable|in:EKONOMI,KESEHATAN,PERMUKIMAN,PENDIDIKAN,UMUM,SOSIAL',
            'bobot_nilai' => 'required|integer|min:1|max:100',
            'opsi_jawaban' => 'nullable|array',
            'opsi_jawaban.*.teks' => 'required|string',
            'opsi_jawaban.*.nilai' => 'required|integer|min:0',
            'opsi_jawaban.*.opd' => 'nullable|string|max:50',
            'opsi_jawaban.*.opd_detail' => 'nullable|string|max:255',
            'urutan' => 'nullable|integer|min:0',
        ]);

        $pertanyaan = PertanyaanKuesioner::create($validated);
        Cache::forget('admin_dashboard_stats');
        Cache::forget('kondisi_opd_map_v2');

        return response()->json(['pertanyaan' => $pertanyaan], 201);
    }

    public function updateKuesioner(Request $request, PertanyaanKuesioner $pertanyaan)
    {
        $validated = $request->validate([
            'teks_pertanyaan' => 'sometimes|string|max:1000',
            'bobot_nilai' => 'sometimes|integer|min:1|max:100',
            'kategori' => 'nullable|in:EKONOMI,KESEHATAN,PERMUKIMAN,PENDIDIKAN,UMUM,SOSIAL',
            'opsi_jawaban' => 'nullable|array',
            'opsi_jawaban.*.teks' => 'required|string',
            'opsi_jawaban.*.nilai' => 'required|integer|min:0',
            'opsi_jawaban.*.opd' => 'nullable|string|max:50',
            'opsi_jawaban.*.opd_detail' => 'nullable|string|max:255',
            'aktif' => 'sometimes|boolean',
            'urutan' => 'nullable|integer',
        ]);
        $pertanyaan->update($validated);
        Cache::forget('kondisi_opd_map_v2');
        return response()->json(['pertanyaan' => $pertanyaan]);
    }

    public function destroyKuesioner(PertanyaanKuesioner $pertanyaan)
    {
        $pertanyaan->delete();
        Cache::forget('kondisi_opd_map_v2');
        return response()->json(['message' => 'Pertanyaan dihapus']);
    }

    // ===== KONFIGURASI SISTEM =====
    public function getKonfigurasi()
    {
        $config = KonfigurasiSistem::all()->pluck('nilai', 'kunci');
        return response()->json(['konfigurasi' => $config]);
    }

    public function updateKonfigurasi(Request $request)
    {
        $request->validate([
            'konfigurasi' => 'required|array',
        ]);

        // Whitelist key yang diizinkan — mencegah injeksi konfigurasi sembarang
        $allowedKeys = [
            'self_assessment_passing_grade',
            'sla_hours',
            'eskalasi_jam',
            'max_foto_upload',
            'notif_email_aktif',
            'notif_push_aktif',
            'app_maintenance',
            'app_nama',
            'app_deskripsi',
        ];

        foreach ($request->konfigurasi as $kunci => $nilai) {
            if (!in_array($kunci, $allowedKeys)) {
                continue; // skip key yang tidak diizinkan
            }
            KonfigurasiSistem::updateOrCreate(
                ['kunci' => $kunci],
                ['nilai' => (string) $nilai]
            );
        }

        // Hanya flush cache konfigurasi, bukan semua cache
        Cache::forget('admin_konfigurasi');
        return response()->json(['message' => 'Konfigurasi berhasil disimpan']);
    }

    // ===== MANAJEMEN OPD =====
    public function indexOpd()
    {
        $opd = Opd::withCount(['laporanWawancara as total_laporan'])->get();
        return response()->json(['opd' => $opd]);
    }

    public function storeOpd(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'telepon' => 'nullable|string|max:15',
            'kategori_urusan' => 'nullable|in:EKONOMI,KESEHATAN,PERMUKIMAN,PENDIDIKAN,UMUM,SOSIAL',
        ]);
        $opd = Opd::create($validated);
        return response()->json(['opd' => $opd], 201);
    }

    public function updateOpd(Request $request, Opd $opd)
    {
        $opd->update($request->only(['nama', 'singkatan', 'email', 'telepon', 'kategori_urusan', 'aktif']));
        return response()->json(['opd' => $opd]);
    }

    // ===== MANAJEMEN SEKOLAH =====
    public function indexSekolah()
    {
        $sekolah = Sekolah::withCount(['siswa'])->get();
        return response()->json(['sekolah' => $sekolah]);
    }

    public function storeSekolah(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'npsn' => 'nullable|string|max:10|unique:sekolah',
            'alamat' => 'nullable|string',
            'kecamatan' => 'nullable|string|max:100',
        ]);
        $sekolah = Sekolah::create($validated);
        return response()->json(['sekolah' => $sekolah], 201);
    }

    // ===== MANAJEMEN USERS =====
    public function indexUsers(Request $request)
    {
        $query = User::with('sekolah', 'opd');

        if ($request->role) $query->where('role', $request->role);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                    ->orWhere('email', 'ilike', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        // Cap per_page untuk mencegah DoS melalui query besar
        $perPage = min((int) ($request->per_page ?? 20), 100);
        return response()->json($query->paginate($perPage));
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'role' => 'required|in:admin,siswa,masyarakat,guru,opd',
            'opd_id' => 'nullable|exists:opd,id|required_if:role,opd',
            'sekolah_id' => [
                'nullable',
                'exists:sekolah,id',
                function ($attribute, $value, $fail) use ($request) {
                    if (in_array($request->role, ['siswa', 'guru']) && empty($value)) {
                        $fail('Sekolah wajib diisi untuk role Siswa atau Guru.');
                    }
                }
            ],
            'password' => ['nullable', \Illuminate\Validation\Rules\Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        // Field non-guarded
        $fillableData = $request->only(['name', 'sekolah_id']);
        if ($request->filled('password')) {
            $fillableData['password'] = Hash::make($request->password);
        }

        // Field guarded — wajib pakai forceFill (trusted admin action)
        $guardedData = ['role' => $request->role];
        $guardedData['opd_id']    = $request->role === 'opd' ? $request->opd_id : null;
        $guardedData['sekolah_id'] = in_array($request->role, ['siswa', 'guru']) ? $request->sekolah_id : null;

        // OPD/Guru/Admin tidak melalui alur profil/lengkapi — tandai profil_lengkap: true
        if (in_array($request->role, ['opd', 'guru', 'admin'])) {
            $guardedData['profil_lengkap'] = true;
        }

        $user->fill($fillableData)->forceFill($guardedData)->save();
        Cache::forget('admin_dashboard_stats');

        return response()->json([
            'user' => $user->fresh()->load('sekolah', 'opd'),
            'message' => 'Data pengguna berhasil diperbarui'
        ]);
    }

    // ===== SEMUA LAPORAN (ADMIN) =====
    public function indexLaporan(Request $request)
    {
        $query = LaporanWawancara::with('user', 'opdTujuan', 'opdList')
            ->latest('submitted_at');

        if ($request->status) $query->where('status_laporan', $request->status);
        if ($request->sla) $query->where('status_sla', $request->sla);
        if ($request->kesimpulan) $query->where('kesimpulan_otomatis', $request->kesimpulan);
        if ($request->opd_id) $query->where('opd_tujuan_id', $request->opd_id);

        $perPage = min((int) ($request->per_page ?? 20), 100);
        return response()->json($query->paginate($perPage));
    }

    public function updateLaporan(Request $request, LaporanWawancara $laporan)
    {
        $request->validate([
            'opd_tujuan_id' => 'nullable|exists:opd,id',
            'status_laporan' => 'sometimes|in:DRAFT,MENUNGGU_VERIFIKASI_GURU,TERVERIFIKASI,AUTO_ROUTED,DALAM_PENANGANAN,DILIMPAHKAN,KOLABORASI,SELESAI,DITOLAK',
            'kategori_urusan' => 'nullable|string',
            'kesimpulan_otomatis' => 'nullable|string'
        ]);

        $laporan->update($request->only([
            'opd_tujuan_id', 
            'status_laporan', 
            'kategori_urusan',
            'kesimpulan_otomatis'
        ]));

        return response()->json([
            'message' => 'Laporan berhasil diperbarui',
            'laporan' => $laporan->fresh()
        ]);
    }

    public function destroyLaporan(LaporanWawancara $laporan)
    {
        // Optional: delete associated files if needed
        if ($laporan->foto_kondisi && \Storage::disk('public')->exists($laporan->foto_kondisi)) {
            \Storage::disk('public')->delete($laporan->foto_kondisi);
        }
        $laporan->delete();

        return response()->json(['message' => 'Laporan berhasil dihapus']);
    }

    // ===== EKSPOR DATA DENGAN DATA MASKING =====
    public function eksporLaporan(Request $request)
    {
        $laporan = LaporanWawancara::with('user', 'opdTujuan')
            ->whereNotIn('status_laporan', ['DRAFT'])
            ->get();

        // Data masking default ON (opt-out) — sesuai prinsip privacy by default (UU PDP)
        // Admin harus eksplisit kirim ?mask=false untuk data asli, dan aksi ini di-log
        $maskEnabled = !($request->boolean('mask') === false && $request->has('mask'));
        if (!$maskEnabled) {
            Log::warning('[Admin] Ekspor data tanpa masking', [
                'admin_id' => Auth::id(),
                'ip'       => $request->ip(),
            ]);
        }

        $data = $laporan->map(function ($l) use ($maskEnabled) {
            return [
                'kode_laporan' => $l->kode_laporan,
                'nama_pelapor' => $maskEnabled ? $this->maskNama($l->user->name ?? '') : ($l->user->name ?? ''),
                'nik' => $maskEnabled ? $this->maskNik($l->user?->makeVisible(['nik'])->nik) : $l->user?->makeVisible(['nik'])->nik,
                'kesimpulan' => $l->kesimpulan_otomatis,
                'status' => $l->status_laporan,
                'status_sla' => $l->status_sla,
                'opd_tujuan' => $l->opdTujuan?->nama,
                'kecamatan' => $l->kecamatan,
                'skor' => $l->skor_akhir,
                'tanggal_submit' => $l->submitted_at?->format('d/m/Y H:i'),
            ];
        });

        return response()->json(['data' => $data, 'total' => $data->count()]);
    }

    private function maskNama(string $nama): string
    {
        $parts = explode(' ', $nama);
        return collect($parts)->map(function ($p, $i) {
            if ($i === 0) return substr($p, 0, 1) . str_repeat('*', strlen($p) - 1);
            return str_repeat('*', strlen($p));
        })->join(' ');
    }

    private function maskNik(?string $nik): string
    {
        if (!$nik) return '****';
        return substr($nik, 0, 6) . '**********';
    }

    // ===== TREN & ANALITIK =====
    public function tren(Request $request)
    {
        $tahun   = (int) $request->get('tahun', date('Y'));
        $periode = $request->get('periode', 'bulanan'); // mingguan | bulanan | tahunan

        $kategori = ['EKONOMI', 'KESEHATAN', 'PERMUKIMAN', 'PENDIDIKAN', 'SOSIAL', 'UMUM'];

        // ── Helper: build one data point ─────────────────────────────────────────
        $buildPoint = function ($query, string $label) use ($kategori) {
            $rows = $query->get();
            $point = ['label' => $label, 'total' => $rows->count(),
                      'selesai' => $rows->where('status_laporan', 'SELESAI')->count(),
                      'on_time' => $rows->where('status_sla', 'ON_TIME')->count(),
                      'overdue' => $rows->where('status_sla', 'OVERDUE')->count()];
            foreach ($kategori as $k) {
                $point[$k] = $rows->where('kategori_urusan', $k)->count();
            }
            return $point;
        };

        $data = [];

        if ($periode === 'bulanan') {
            for ($m = 1; $m <= 12; $m++) {
                $label = \Carbon\Carbon::create($tahun, $m, 1)->translatedFormat('M');
                $q = LaporanWawancara::whereYear('submitted_at', $tahun)->whereMonth('submitted_at', $m);
                $data[] = $buildPoint($q, $label);
            }
        } elseif ($periode === 'mingguan') {
            // 12 minggu terakhir
            for ($w = 11; $w >= 0; $w--) {
                $start = \Carbon\Carbon::now()->startOfWeek()->subWeeks($w);
                $end   = $start->copy()->endOfWeek();
                $label = $start->format('d/m');
                $q = LaporanWawancara::whereBetween('submitted_at', [$start, $end]);
                $data[] = $buildPoint($q, $label);
            }
        } else { // tahunan — 5 tahun terakhir
            for ($y = 4; $y >= 0; $y--) {
                $yr = $tahun - $y;
                $q  = LaporanWawancara::whereYear('submitted_at', $yr);
                $data[] = $buildPoint($q, (string) $yr);
            }
        }

        // ── Ringkasan keseluruhan tahun ──────────────────────────────────────────
        $allTahun = LaporanWawancara::whereYear('submitted_at', $tahun)
            ->whereNotIn('status_laporan', ['DRAFT'])->get();
        $total      = $allTahun->count();
        $selesai    = $allTahun->where('status_laporan', 'SELESAI')->count();
        $overdueAll = $allTahun->where('status_sla', 'OVERDUE')->count();

        $rataHari = 0;
        $done = $allTahun->where('status_laporan', 'SELESAI')->filter(fn($l) => $l->submitted_at && $l->updated_at);
        if ($done->count() > 0) {
            $rataHari = round($done->avg(fn($l) => $l->updated_at->diffInDays($l->submitted_at)), 1);
        }

        $sla = [
            ['name' => 'Tepat Waktu',  'value' => $total > 0 ? round(($total - $overdueAll) / $total * 100) : 0, 'color' => '#16A34A'],
            ['name' => 'Melewati SLA', 'value' => $total > 0 ? round($overdueAll / $total * 100) : 0,            'color' => '#EF4444'],
        ];

        return response()->json([
            'data'      => $data,
            'sla'       => $sla,
            'ringkasan' => [
                'total_tahun'            => $total,
                'pct_selesai'            => $total > 0 ? round($selesai / $total * 100) : 0,
                'pct_overdue'            => $total > 0 ? round($overdueAll / $total * 100) : 0,
                'rata_penyelesaian_hari' => $rataHari,
            ],
        ]);
    }
}
