<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Strict admin-only middleware.
 * Uses ONLY Spatie roles — never falls back to the legacy `role` column.
 */
class EnsureAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('Admin')) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Akses ditolak. Hanya Admin yang diizinkan.',
                    'errors' => [],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Akun Anda tidak aktif.',
                    'errors' => [],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 403);
        }

        return $next($request);
    }
}
