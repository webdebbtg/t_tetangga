<?php

/**
 * CORS Configuration — Tengok Tetangga
 *
 * Hanya izinkan request dari frontend yang dikenal.
 * Jangan gunakan wildcard '*' di production karena
 * memungkinkan situs lain mengakses API dengan cookie/token user.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi ini menentukan path mana yang menerapkan CORS header,
    | serta origin, method, dan header apa yang diizinkan.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    /*
     | Daftar origin yang diizinkan.
     | Di development: localhost:3000 (hardcoded agar pasti terbaca)
     | Di production: sesuaikan dengan domain yang di-deploy
     */
    'allowed_origins' => array_values(array_unique(array_filter([
        'http://localhost:3000',
        'http://localhost:3001',
        env('FRONTEND_URL'),
        env('APP_FRONTEND_URL'),
    ]))),

    /*
     | Pattern tambahan (regex) untuk mengakomodasi port dev yang berubah
     */
    'allowed_origins_patterns' => [
        '#^http://localhost(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     | false karena JWT dikirim via Authorization header, BUKAN cookie.
     | supports_credentials: true hanya diperlukan untuk session cookie.
     | Jika di-set true + allowed_origins salah, seluruh CORS bisa terblokir.
     */
    'supports_credentials' => false,

];
