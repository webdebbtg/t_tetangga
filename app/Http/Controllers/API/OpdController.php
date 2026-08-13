<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LaporanWawancara;
use App\Models\LogTindakLanjut;
use App\Services\AutoRoutingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OpdController extends Controller
{
    public function __construct(private AutoRoutingService $routingService) {}

    /**
     * Daftar laporan yang masuk ke OPD ini
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $opdId = $user->opd_id;

        // OPD tanpa opd_id yang terdaftar tidak boleh mengakses data apapun
        if (!$opdId) {
            return response()->json(['error' => 'Akun OPD belum terhubung ke satuan OPD manapun.'], 403);
        }

        // Tampilkan laporan di mana OPD ini adalah tujuan utama ATAU terdaftar sebagai kolaborator
        $query = LaporanWawancara::where(function ($q) use ($opdId) {
                $q->where('opd_tujuan_id', $opdId)
                  ->orWhereHas('opdList', fn($q2) => $q2->where('opd.id', $opdId));
            })
            ->with([
                'user.sekolah',
                'opdTujuan',
                'opdList',
                // Hanya log dari OPD ini (untuk deteksi sudah/belum diproses di frontend)
                'logTindakLanjut' => fn($q) => $q->where('opd_id', $opdId)->latest()->limit(1),
            ])
            ->whereIn('status_laporan', ['AUTO_ROUTED', 'DALAM_PENANGANAN', 'DILIMPAHKAN', 'KOLABORASI', 'SELESAI', 'DITOLAK'])
            ->latest('submitted_at');

        // Filter
        if ($request->status) {
            $query->where('status_laporan', $request->status);
        }
        if ($request->sla) {
            $query->where('status_sla', $request->sla);
        }
        if ($request->kesimpulan) {
            $query->where('kesimpulan_otomatis', $request->kesimpulan);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Cek apakah OPD punya akses ke laporan ini (sebagai tujuan utama atau kolaborator)
     */
    private function hasAccess(LaporanWawancara $laporan, int $opdId): bool
    {
        if ($laporan->opd_tujuan_id === $opdId) return true;
        return $laporan->opdList()->where('opd.id', $opdId)->exists();
    }

    /**
     * Detail laporan OPD
     */
    public function show(LaporanWawancara $laporan)
    {
        $user = Auth::user();
        if (!$this->hasAccess($laporan, $user->opd_id)) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        return response()->json([
            'laporan' => $laporan->load('user.sekolah', 'opdTujuan', 'opdList', 'verifikator', 'logTindakLanjut.user.opd')
        ]);
    }

    /**
     * Aksi OPD: Proses, Limpahkan, Kolaborasi, Selesai, Tolak
     */
    public function aksi(Request $request, LaporanWawancara $laporan)
    {
        $user = Auth::user();
        if (!$this->hasAccess($laporan, $user->opd_id)) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'aksi'                  => 'required|in:PROSES,LIMPAHKAN,KOLABORASI,SELESAI,BATAL_SELESAI,TOLAK,CATATAN',
            'keterangan'            => 'nullable|string|max:1000',
            'opd_limpah_id'         => 'nullable|exists:opd,id|required_if:aksi,LIMPAHKAN',
            'opd_kolaborasi_ids'    => 'nullable|array|required_if:aksi,KOLABORASI',
            'opd_kolaborasi_ids.*'  => 'exists:opd,id',
        ], [
            'opd_limpah_id.required_if'      => 'OPD tujuan pelimpahan wajib dipilih.',
            'opd_kolaborasi_ids.required_if' => 'Pilih minimal 1 OPD untuk berkolaborasi.',
        ]);

        DB::transaction(function () use ($laporan, $request, $user) {
            $updateData = [];
            $logOpdId   = null;
            $keterangan = $request->keterangan;

            if ($request->aksi === 'LIMPAHKAN' && $request->opd_limpah_id) {
                $updateData['opd_tujuan_id']  = $request->opd_limpah_id;
                $updateData['status_laporan'] = 'DILIMPAHKAN';
                $logOpdId = $request->opd_limpah_id;

                $opdNama    = \App\Models\Opd::find($request->opd_limpah_id)?->nama ?? 'OPD lain';
                $keterangan = trim(($keterangan ? $keterangan . ' — ' : '') . 'Dilimpahkan ke: ' . $opdNama);

            } elseif ($request->aksi === 'KOLABORASI' && $request->filled('opd_kolaborasi_ids')) {
                $ids       = $request->opd_kolaborasi_ids;
                $opdNames  = \App\Models\Opd::whereIn('id', $ids)->pluck('nama')->join(', ');

                // Tambahkan ke daftar OPD, pertahankan primary opd_tujuan_id
                $laporan->opdList()->syncWithoutDetaching($ids);

                $updateData['status_laporan'] = 'KOLABORASI';
                $keterangan = trim(($keterangan ? $keterangan . ' — ' : '') . 'Kolaborasi dengan: ' . $opdNames);

            } elseif ($request->aksi === 'SELESAI') {
                // Tandai OPD ini selesai di pivot table
                $laporan->opdList()->updateExistingPivot($user->opd_id, [
                    'selesai_at' => now(),
                ]);

                // Hitung berapa OPD yang sudah selesai vs total OPD terlibat
                $totalOpd   = $laporan->opdList()->count();
                $selesaiOpd = $laporan->opdList()->wherePivotNotNull('selesai_at')->count();

                if ($totalOpd > 0 && $selesaiOpd >= $totalOpd) {
                    // Semua OPD sudah selesai → laporan benar-benar selesai
                    $updateData['status_laporan'] = 'SELESAI';
                    $updateData['status_sla']     = $laporan->isOverdue() ? 'OVERDUE' : 'ON_TIME';

                    if ($laporan->user->isSiswa()) {
                        // TODO: dispatch notification to guru
                    }
                } else {
                    // Masih ada OPD lain yang belum selesai
                    $updateData['status_laporan'] = 'DALAM_PENANGANAN';
                    $keterangan = trim(
                        ($keterangan ? $keterangan . ' — ' : '') .
                        "OPD selesai: {$selesaiOpd}/{$totalOpd}"
                    );
                }

            } elseif ($request->aksi === 'BATAL_SELESAI') {
                // Hapus tanda selesai OPD ini di pivot
                $laporan->opdList()->updateExistingPivot($user->opd_id, [
                    'selesai_at' => null,
                ]);
                // Kembalikan status ke DALAM_PENANGANAN jika laporan sudah jadi SELESAI
                if (in_array($laporan->status_laporan, ['SELESAI', 'DALAM_PENANGANAN'])) {
                    $updateData['status_laporan'] = 'DALAM_PENANGANAN';
                }
                $keterangan = trim(($keterangan ? $keterangan . ' — ' : '') . 'Pembatalan status selesai oleh OPD');

            } elseif ($request->aksi === 'TOLAK') {
                $updateData['status_laporan'] = 'DITOLAK';

            } elseif ($request->aksi === 'PROSES') {
                $updateData['status_laporan'] = 'DALAM_PENANGANAN';

            } elseif ($request->aksi === 'CATATAN') {
                // Tidak ubah status, hanya catat
            }

            if (!empty($updateData)) {
                $laporan->update($updateData);
            }

            LogTindakLanjut::create([
                'laporan_id'    => $laporan->id,
                'user_id'       => $user->id,
                'opd_id'        => $user->opd_id,
                'aksi'          => $request->aksi,
                'keterangan'    => $keterangan ?: null,
                'opd_limpah_id' => $logOpdId,
            ]);
        });

        return response()->json([
            'message' => 'Aksi berhasil dicatat',
            'laporan' => $laporan->fresh()->load('user', 'opdTujuan', 'opdList', 'logTindakLanjut.user.opd', 'logTindakLanjut.opd'),
        ]);
    }

    /**
     * Dashboard statistik OPD
     */
    public function dashboard()
    {
        $user = Auth::user();
        $opdId = $user->opd_id;

        if (!$opdId) {
            return response()->json(['error' => 'Akun OPD belum terhubung ke satuan OPD manapun.'], 403);
        }

        // Base scope: laporan di mana OPD ini adalah tujuan utama ATAU kolaborator
        $base = fn() => LaporanWawancara::where(function ($q) use ($opdId) {
            $q->where('opd_tujuan_id', $opdId)
              ->orWhereHas('opdList', fn($q2) => $q2->where('opd.id', $opdId));
        });

        $stats = [
            'total'            => $base()->count(),
            // Belum diproses = OPD ini belum pernah buat log untuk laporan tsb
            'masuk'            => $base()
                                    ->whereNotIn('status_laporan', ['SELESAI', 'DITOLAK'])
                                    ->whereDoesntHave('logTindakLanjut', fn($q) => $q->where('opd_id', $opdId))
                                    ->count(),
            'dalam_penanganan' => $base()->whereIn('status_laporan', ['DALAM_PENANGANAN', 'KOLABORASI'])->count(),
            'selesai'          => $base()->where('status_laporan', 'SELESAI')->count(),
            'overdue'          => $base()->where('status_sla', 'OVERDUE')
                                         ->whereNotIn('status_laporan', ['SELESAI', 'DITOLAK'])->count(),
        ];

        // Muat log yang dibuat oleh OPD ini saja, agar frontend tahu mana yang sudah/belum diproses
        $terbaru = $base()
            ->with([
                'user',
                'logTindakLanjut' => fn($q) => $q->where('opd_id', $opdId)->latest()->limit(1),
            ])
            ->latest('submitted_at')
            ->take(5)
            ->get();

        return response()->json(['stats' => $stats, 'terbaru' => $terbaru]);
    }
}
