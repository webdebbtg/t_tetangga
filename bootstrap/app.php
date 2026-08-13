<?php

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CORS untuk frontend Next.js
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Alias middleware
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // Trust proxies (untuk NGINX)
        $middleware->trustProxies(at: '*');
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        // Cek SLA setiap jam
        $schedule->command('sla:check')->hourly();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle JWT exceptions
        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Token expired', 'code' => 'TOKEN_EXPIRED'], 401);
            }
        });

        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Token invalid', 'code' => 'TOKEN_INVALID'], 401);
            }
        });

        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\JWTException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Token tidak ditemukan', 'code' => 'TOKEN_ABSENT'], 401);
            }
        });
    })->create();
