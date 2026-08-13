<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\HasilAssessment;
use App\Models\KonfigurasiSistem;
use App\Models\PertanyaanKuesioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    /**
     * Ambil daftar pertanyaan Self-Assessment aktif
     */
    public function getPertanyaan()
    {
        $pertanyaan = PertanyaanKuesioner::selfAssessment()
            ->orderBy('urutan')
            ->get(['id', 'teks_pertanyaan', 'bobot_nilai', 'opsi_jawaban', 'urutan']);

        $passingGrade = KonfigurasiSistem::where('kunci', 'self_assessment_passing_grade')->value('nilai') ?? 70;

        return response()->json([
            'pertanyaan' => $pertanyaan,
            'passing_grade' => (int) $passingGrade,
            'total_pertanyaan' => $pertanyaan->count(),
        ]);
    }

    /**
     * Submit jawaban Self-Assessment
     */
    public function submit(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['siswa', 'masyarakat'])) {
            return response()->json([
                'message' => 'Hanya siswa atau masyarakat yang wajib mengikuti uji kelayakan.',
            ], 403);
        }

        $request->validate([
            'jawaban' => 'required|array|min:1',
            'jawaban.*.pertanyaan_id' => 'required|exists:pertanyaan_kuesioner,id',
            'jawaban.*.nilai' => 'required|integer|min:0',
        ]);

        $passingGrade = (int) (KonfigurasiSistem::where('kunci', 'self_assessment_passing_grade')->value('nilai') ?? 70);

        // Ambil semua pertanyaan SA
        $pertanyaan = PertanyaanKuesioner::selfAssessment()
            ->pluck('bobot_nilai', 'id');

        $skorMaksimal = $pertanyaan->sum();
        $totalSkor = 0;
        $jawabanDetail = [];

        foreach ($request->jawaban as $jwb) {
            $bobotMax = $pertanyaan->get($jwb['pertanyaan_id'], 0);
            $nilaiDipilih = min($jwb['nilai'], $bobotMax);
            $totalSkor += $nilaiDipilih;

            $jawabanDetail[] = [
                'pertanyaan_id' => $jwb['pertanyaan_id'],
                'nilai' => $nilaiDipilih,
                'bobot_max' => $bobotMax,
            ];
        }

        $persentase = $skorMaksimal > 0 ? round(($totalSkor / $skorMaksimal) * 100, 2) : 0;
        $status = $persentase >= $passingGrade ? 'LULUS' : 'TIDAK_LULUS';

        DB::transaction(function () use ($user, $jawabanDetail, $totalSkor, $skorMaksimal, $status, $passingGrade) {
            HasilAssessment::create([
                'user_id' => $user->id,
                'jawaban_detail' => $jawabanDetail,
                'total_skor' => $totalSkor,
                'skor_maksimal' => $skorMaksimal,
                'status' => $status,
                'passing_grade' => $passingGrade,
                'completed_at' => now(),
            ]);

            $user->status_kelayakan = $status;
            $user->kelayakan_at = now();
            $user->save();
        });

        $pesan = '';
        if ($totalSkor >= 36) {
            $pesan = 'Anda sangat peduli dan siap berpartisipasi aktif dalam program "Tengok Tetangga."';
        } elseif ($totalSkor >= 30) {
            $pesan = 'Anda cukup peduli dan bersedia untuk berpartisipasi, namun mungkin perlu sedikit dorongan lebih lanjut.';
        } elseif ($totalSkor >= 20) {
            $pesan = 'Anda memiliki tingkat kepedulian yang cukup, namun perlu motivasi lebih untuk terlibat penuh.';
        } else {
            $pesan = 'Anda kurang peduli dan mungkin memerlukan penjelasan lebih lanjut mengenai pentingnya program ini.';
        }

        return response()->json([
            'status' => $status,
            'total_skor' => $totalSkor,
            'skor_maksimal' => $skorMaksimal,
            'persentase' => $persentase,
            'passing_grade' => $passingGrade,
            'pesan' => $pesan,
        ]);
    }

    /**
     * Riwayat assessment user
     */
    public function riwayat()
    {
        $riwayat = HasilAssessment::where('user_id', Auth::id())
            ->latest()
            ->take(5)
            ->get();

        return response()->json(['riwayat' => $riwayat]);
    }
}
