<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserPortalAccess
{
    /**
     * Allow only active users who are verified for writer portal access.
     * Admin is always allowed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        if ($user->isAdmin()) {
            return $next($request);
        }

        if (! $user->isVerifiedAuthor()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Akun belum terverifikasi untuk portal user.',
                'data' => [
                    'is_verified_author' => false,
                    'verify_url' => '/api/v1/user/request-author-verification',
                ],
            ], 403);
        }

        return $next($request);
    }
}
