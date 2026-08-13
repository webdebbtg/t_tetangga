<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('email', 'siswa@tengoktetangga.id')->first();
if ($u) {
    $count = \App\Models\LaporanWawancara::where('user_id', $u->id)->delete();
    echo "Berhasil menghapus " . $count . " laporan milik " . $u->name . "\n";
} else {
    echo "User tidak ditemukan.\n";
}
