<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'siswa@tengoktetangga.id')->first();
$token = Tymon\JWTAuth\Facades\JWTAuth::fromUser($user);

$req = Illuminate\Http\Request::create('/api/observasi/4', 'GET');
$req->headers->set('Authorization', 'Bearer ' . $token);
$req->headers->set('Accept', 'application/json');
$res = app()->handle($req);

echo json_encode(json_decode($res->getContent()), JSON_PRETTY_PRINT);
