<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageService
{
    private function disk(): string
    {
        return env('STORAGE_DISK', 's3');
    }

    public function uploadFoto(UploadedFile $file): string
    {
        $disk = $this->disk();
        $filename = 'observasi/' . now()->format('Y/m/d') . '/' . Str::uuid() . '.' . $file->extension();

        if ($disk === 'public') {
            Storage::disk('public')->put($filename, file_get_contents($file));
            // Bangun URL pakai APP_URL agar portnya selalu benar (misal :8080)
            return rtrim(config('app.url'), '/') . '/storage/' . $filename;
        } else {
            Storage::disk($disk)->put($filename, file_get_contents($file), 'public');
            // Untuk S3/MinIO: gunakan AWS_URL jika ada (public-facing URL), bukan endpoint internal Docker
            $publicBase = env('AWS_URL') ?: env('AWS_ENDPOINT', '');
            $bucket     = env('AWS_BUCKET', '');
            return rtrim($publicBase, '/') . '/' . $bucket . '/' . $filename;
        }
    }

    public function deleteFoto(string $url): void
    {
        $disk = $this->disk();

        if ($disk === 'public') {
            // URL: http://localhost:8080/storage/observasi/...
            // Key: observasi/...
            $base = rtrim(config('app.url'), '/') . '/storage/';
            $filename = Str::after($url, $base);
        } else {
            $path = parse_url($url, PHP_URL_PATH);
            $filename = ltrim($path, '/');
        }

        Storage::disk($disk)->delete($filename);
    }
}
