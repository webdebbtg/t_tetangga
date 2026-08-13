<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LaporanWawancara;
use App\Models\LogTindakLanjut;
use App\Services\AutoRoutingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GuruController extends Controller
{
    public function __construct(private AutoRoutingService $routingService) {}

    /**
     * Laporan siswa yang perlu diverifikasi oleh Guru
     */
    public function laporanSiswa(Request $request)
    {
        $guru = Auth::user();

        // Guru melihat laporan dari siswa di sekolahnya
        $query = LaporanWawancara::whereHas('user', function ($q) use ($guru) {
            $q->where('role', 'siswa')
              ->where('sekolah_id', $guru->sekolah_id);
        })->with('user.sekolah');

        if ($request->status) {
            $query->where('status_laporan', $request->status);
        } else {
            $query->whereIn('status_laporan', ['MENUNGGU_VERIFIKASI_GURU', 'TERVERIFIKASI', 'AUTO_ROUTED', 'SELESAI']);
        }

        return response()->json($query->latest('submitted_at')->paginate(15));
    }

    /**
     * Verifikasi laporan siswa (approve/tolak)
     */
    public function verifikasi(Request $request, LaporanWawancara $laporan)
    {
        $guru = Auth::user();

        if ($laporan->status_laporan !== 'MENUNGGU_VERIFIKASI_GURU') {
            return response()->json(['error' => 'Laporan tidak dalam status menunggu verifikasi'], 400);
        }

        $request->validate([
            'aksi'            => 'required|in:SETUJUI,TOLAK',
            'catatan'         => 'nullable|string|max:500',
            'opd_ids'         => 'nullable|array',
            'opd_ids.*'       => 'exists:opd,id',
            'kategori_urusan' => 'nullable|in:EKONOMI,KESEHATAN,PERMUKIMAN,PENDIDIKAN,SOSIAL,UMUM',
        ], [
            'opd_ids.required'        => 'Pilih minimal 1 OPD tujuan.',
            'kategori_urusan.in'      => 'Kategori urusan tidak valid.',
        ]);

        // Wajib pilih OPD jika aksi SETUJUI
        if ($request->aksi === 'SETUJUI' && (!$request->has('opd_ids') || count($request->opd_ids ?? []) === 0)) {
            return response()->json(['error' => 'OPD tujuan wajib dipilih saat menyetujui laporan.'], 422);
        }

        DB::transaction(function () use ($laporan, $request, $guru) {
            if ($request->aksi === 'SETUJUI') {
                $updateData = [
                    'status_laporan' => 'TERVERIFIKASI',
                    'verifikator_id' => $guru->id,
                    'verified_at'    => now(),
                    'catatan_guru'   => $request->catatan,
                ];

                // Guru dapat mengkoreksi kategori urusan
                if ($request->filled('kategori_urusan')) {
                    $updateData['kategori_urusan'] = $request->kategori_urusan;
                }

                if ($request->has('opd_ids') && count($request->opd_ids) > 0) {
                    $updateData['opd_tujuan_id'] = $request->opd_ids[0]; // Set primary OPD
                }

                $laporan->update($updateData);

                if ($request->has('opd_ids')) {
                    $laporan->opdList()->sync($request->opd_ids);
                }

                // Trigger auto-routing ONLY if OPD is not manually set
                if (!$request->has('opd_ids') || count($request->opd_ids) === 0) {
                    try {
                        $this->routingService->route($laporan);
                    } catch (\Exception $e) {
                        \Log::warning('Auto-routing gagal setelah verifikasi guru: ' . $e->getMessage());
                    }
                } else {
                    // Update status to AUTO_ROUTED since it's verified and OPD is assigned
                    // Reset SLA deadline = 2×24 jam sejak laporan diteruskan ke OPD
                    $laporan->update([
                        'status_laporan'   => 'AUTO_ROUTED',
                        'deadline_selesai' => now()->addHours(48),
                        'status_sla'       => 'ON_TIME',
                    ]);
                }

                LogTindakLanjut::create([
                    'laporan_id' => $laporan->id,
                    'user_id' => $guru->id,
                    'aksi' => 'PROSES',
                    'keterangan' => 'Laporan disetujui oleh Guru. ' . $request->catatan,
                ]);
            } else {
                $laporan->update([
                    'status_laporan' => 'DITOLAK',
                    'verifikator_id' => $guru->id,
                    'verified_at' => now(),
                    'catatan_guru' => $request->catatan,
                ]);

                LogTindakLanjut::create([
                    'laporan_id' => $laporan->id,
                    'user_id' => $guru->id,
                    'aksi' => 'TOLAK',
                    'keterangan' => 'Laporan ditolak oleh Guru. ' . $request->catatan,
                ]);
            }
        });

        return response()->json([
            'message' => $request->aksi === 'SETUJUI'
                ? 'Laporan berhasil disetujui dan diteruskan ke OPD'
                : 'Laporan ditolak',
            'laporan' => $laporan->fresh()->load('verifikator'),
        ]);
    }

    /**
     * Input poin kegiatan untuk siswa setelah laporan SELESAI
     */
    public function inputPoin(Request $request, LaporanWawancara $laporan)
    {
        $guru = Auth::user();

        if ($laporan->status_laporan !== 'SELESAI') {
            return response()->json(['error' => 'Poin hanya dapat diberikan untuk laporan yang sudah SELESAI'], 400);
        }

        if ($laporan->poin_kegiatan !== null) {
            return response()->json(['error' => 'Poin sudah pernah diberikan untuk laporan ini'], 400);
        }

        $request->validate([
            'poin' => 'required|integer|min:1|max:100',
            'catatan' => 'nullable|string|max:300',
        ]);

        $laporan->update([
            'poin_kegiatan' => $request->poin,
            'catatan_guru' => $request->catatan,
        ]);

        // TODO: Send notification ke siswa

        return response()->json([
            'message' => "Poin {$request->poin} berhasil diberikan kepada {$laporan->user->name}",
            'laporan' => $laporan->fresh(),
        ]);
    }

    /**
     * Dashboard Statistik Guru
     */
    public function dashboard(Request $request)
    {
        $guru = Auth::user();
        $sekolahId = $guru->sekolah_id;

        $menungguVerifikasi = LaporanWawancara::whereHas('user', function ($q) use ($sekolahId) {
            $q->where('role', 'siswa')->where('sekolah_id', $sekolahId);
        })->where('status_laporan', 'MENUNGGU_VERIFIKASI_GURU')->count();

        $totalSelesai = LaporanWawancara::whereHas('user', function ($q) use ($sekolahId) {
            $q->where('role', 'siswa')->where('sekolah_id', $sekolahId);
        })->where('status_laporan', 'SELESAI')->count();

        $totalSiswaSelesaiAssesment = \App\Models\User::where('role', 'siswa')
            ->where('sekolah_id', $sekolahId)
            ->where('status_kelayakan', 'LULUS')
            ->count();

        return response()->json([
            'menunggu_verifikasi' => $menungguVerifikasi,
            'total_laporan_selesai' => $totalSelesai,
            'total_siswa_aktif' => $totalSiswaSelesaiAssesment,
        ]);
    }

    /**
     * Daftar siswa di sekolah Guru beserta statistik laporannya
     */
    public function daftarSiswa(Request $request)
    {
        $guru = Auth::user();

        $siswa = \App\Models\User::where('role', 'siswa')
            ->where('sekolah_id', $guru->sekolah_id)
            ->withCount([
                'laporanWawancara as laporan_count' => function ($query) {
                    $query->whereNotIn('status_laporan', ['DRAFT']);
                },
                'laporanWawancara as laporan_selesai_count' => function ($query) {
                    $query->where('status_laporan', 'SELESAI');
                }
            ])
            ->paginate(15);

        return response()->json($siswa);
    }
}
