<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('name', 'like', '%Siti%')->first();
if ($u) {
    $u->status_kelayakan = 'LULUS';
    $u->kelayakan_at = now();
    $u->save();
    echo "Status kelayakan " . $u->name . " (" . $u->email . ") berhasil di-update ke LULUS\n";
} else {
    echo "Akun dengan nama Siti tidak ditemukan.\n";
}
