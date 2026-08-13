<?php
$ch = curl_init('http://localhost:8080/api/observasi');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
// send a valid request with dummy data
$post = [
    'latitude' => 1,
    'longitude' => 1,
    'nama_tetangga' => 'Budi',
    'kondisi[0][label]' => 'Lansia',
];
curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
$response = curl_exec($ch);
echo "Response: " . $response . "\n";
