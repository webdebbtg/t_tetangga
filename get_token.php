<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();

$user = App\Models\User::where('email', 'admin@tengoktetangga.id')->first();
if ($user) {
    $token = auth('api')->login($user);
    echo "TOKEN=" . $token . PHP_EOL;
    echo "EMAIL=" . $user->email . PHP_EOL;
    echo "ROLE=" . $user->role . PHP_EOL;
    echo "STATUS_KELAYAKAN=" . $user->status_kelayakan . PHP_EOL;
} else {
    echo "USER_NOT_FOUND" . PHP_EOL;
}
