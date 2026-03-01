<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isPenulis()) {
            $author = $user->author;

            if (! $author || ! $author->is_profile_complete) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Lengkapi data profil dan rekening bank terlebih dahulu.',
                        'errors' => [],
                    ],
                    'requires_action' => 'complete_profile',
                    'redirect' => '/penulis/profil',
                    'meta' => ['timestamp' => now()->toIso8601String()],
                ], 403);
            }
        }

        return $next($request);
    }
}
