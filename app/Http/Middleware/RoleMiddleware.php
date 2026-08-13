<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Cek role user. Mendukung multiple roles: role:admin,guru
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'error' => 'Akses ditolak. Role Anda tidak memiliki izin untuk mengakses endpoint ini.',
                'role_anda' => $user->role,
                'role_dibutuhkan' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
