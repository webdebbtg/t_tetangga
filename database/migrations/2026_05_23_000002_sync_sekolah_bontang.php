<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $sekolah = [
        ['npsn' => '30400001', 'nama' => 'SMA Negeri 1 Bontang', 'kecamatan' => 'Bontang Utara'],
        ['npsn' => '30400002', 'nama' => 'SMA Negeri 2 Bontang', 'kecamatan' => 'Bontang Selatan'],
        ['npsn' => '30400006', 'nama' => 'SMA Negeri 3 Bontang', 'kecamatan' => 'Bontang Barat'],
        ['npsn' => '30400003', 'nama' => 'SMK Negeri 1 Bontang', 'kecamatan' => 'Bontang Barat'],
        ['npsn' => '30400004', 'nama' => 'MAN Bontang',           'kecamatan' => 'Bontang Utara'],
        ['npsn' => '30400007', 'nama' => 'SMA YPK Bontang',       'kecamatan' => 'Bontang Utara'],
        ['npsn' => '30400008', 'nama' => 'SMA YPVDP Bontang',     'kecamatan' => 'Bontang Barat'],
    ];

    public function up(): void
    {
        foreach ($this->sekolah as $s) {
            $existing = DB::table('sekolah')->where('npsn', $s['npsn'])->first();
            if ($existing) {
                DB::table('sekolah')->where('npsn', $s['npsn'])->update([
                    'nama'      => $s['nama'],
                    'kecamatan' => $s['kecamatan'],
                    'aktif'     => true,
                    'updated_at'=> now(),
                ]);
            } else {
                DB::table('sekolah')->insert(array_merge($s, [
                    'aktif'      => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // Hapus sekolah SMPN 1 yang sudah tidak dipakai (NPSN 30400005)
        // Hanya hapus jika tidak ada user yang mereferensikan sekolah ini
        $npsn30400005 = DB::table('sekolah')->where('npsn', '30400005')->first();
        if ($npsn30400005) {
            $used = DB::table('users')->where('sekolah_id', $npsn30400005->id)->exists();
            if (!$used) {
                DB::table('sekolah')->where('npsn', '30400005')->delete();
            } else {
                // Tandai tidak aktif saja, jangan hapus karena ada user
                DB::table('sekolah')->where('npsn', '30400005')->update(['aktif' => false]);
            }
        }
    }

    public function down(): void
    {
        // Kembalikan ke nama lama
        $lama = [
            ['npsn' => '30400001', 'nama' => 'SMAN 1 Bontang'],
            ['npsn' => '30400002', 'nama' => 'SMAN 2 Bontang'],
            ['npsn' => '30400003', 'nama' => 'SMKN 1 Bontang'],
            ['npsn' => '30400004', 'nama' => 'MAN 1 Bontang'],
        ];
        foreach ($lama as $s) {
            DB::table('sekolah')->where('npsn', $s['npsn'])->update(['nama' => $s['nama']]);
        }
        DB::table('sekolah')->whereIn('npsn', ['30400006', '30400007', '30400008'])->delete();
    }
};
