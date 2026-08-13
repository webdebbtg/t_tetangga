<?php

namespace App\Providers;

use App\Models\LaporanWawancara;
use App\Policies\LaporanWawancaraPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Daftarkan policy untuk LaporanWawancara (IDOR fix)
        Gate::policy(LaporanWawancara::class, LaporanWawancaraPolicy::class);
    }
}
