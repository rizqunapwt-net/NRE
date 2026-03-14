<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    private function hasGoogleCredentials(): bool
    {
        return (string) config('services.google.client_id', '') !== ''
            && (string) config('services.google.client_secret', '') !== '';
    }

    private function googleRedirectUri(): string
    {
        $configured = (string) config('services.google.redirect', '');

        if ($configured !== '') {
            return $configured;
        }

        return rtrim((string) config('app.url', url('/')), '/').'/api/v1/auth/google/callback';
    }

    private function frontendCallbackUri(): string
    {
        $frontend = (string) env('FRONTEND_URL', '');

        if ($frontend === '') {
            $frontend = (string) config('app.url', 'http://localhost:8000');
        }

        return rtrim($frontend, '/').'/auth/google/callback';
    }

    private function callbackErrorResponse(Request $request, string $message, int $status = 400): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        }

        return redirect()->away($this->frontendCallbackUri().'?error='.rawurlencode($message));
    }

    private function buildFrontendCallbackUrl(string $token, User $user): string
    {
        $role = strtoupper((string) ($user->roles->first()?->name ?? 'USER'));

        $userPayload = [
            'id' => $user->id,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'username' => (string) $user->username,
            'role' => $role,
            'roles' => [$role],
            'is_verified_author' => (bool) $user->is_verified_author,
            'must_change_password' => (bool) $user->must_change_password,
            'google_id' => $user->google_id,
            'avatar_url' => $user->avatar_url,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'author' => $user->author ? [
                'id' => $user->author->id,
                'name' => $user->author->name ?? $user->author->nama ?? $user->name,
                'photo_path' => $user->author->photo_path ?? null,
                'is_profile_complete' => (bool) ($user->author->is_profile_complete ?? false),
            ] : null,
        ];

        return $this->frontendCallbackUri().'?'.http_build_query([
            'token' => $token,
            'user' => json_encode($userPayload, JSON_UNESCAPED_UNICODE),
        ]);
    }

    /**
     * Build secure callback URL using fragment identifier (#) instead of query (?).
     * 
     * FIX #2: Token in fragment is not sent to server, preventing:
     * - Token in server logs
     * - Token in Referer header
     * - Token in browser history (partially)
     */
    private function buildSecureFrontendCallbackUrl(string $token, User $user): string
    {
        $role = strtoupper((string) ($user->roles->first()?->name ?? 'USER'));

        $userPayload = [
            'id' => $user->id,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'username' => (string) $user->username,
            'role' => $role,
            'roles' => [$role],
            'is_verified_author' => (bool) $user->is_verified_author,
            'must_change_password' => (bool) $user->must_change_password,
            'google_id' => $user->google_id,
            'avatar_url' => $user->avatar_url,
            'author' => $user->author ? [
                'id' => $user->author->id,
                'name' => $user->author->name ?? $user->author->nama ?? $user->name,
                'photo_path' => $user->author->photo_path ?? null,
                'is_profile_complete' => (bool) ($user->author->is_profile_complete ?? false),
            ] : null,
        ];

        // Use fragment identifier (#) - NOT sent to server
        return $this->frontendCallbackUri().'#'.http_build_query([
            'token' => $token,
            'user' => json_encode($userPayload, JSON_UNESCAPED_UNICODE),
        ]);
    }

    /**
     * GET /api/v1/auth/google/redirect
     * Redirect user to Google's OAuth consent screen.
     */
    public function redirect()
    {
        if (! $this->hasGoogleCredentials()) {
            return response()->json([
                'success' => false,
                'message' => 'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.',
            ], 500);
        }

        $url = Socialite::driver('google')
            ->redirectUrl($this->googleRedirectUri())
            ->redirect()
            ->getTargetUrl();

        return response()->json(['redirect_url' => $url]);
    }

    /**
     * GET /api/v1/auth/google/callback
     * Handle the callback from Google, create/login user, return token.
     * 
     * SECURITY FIXES:
     * 1. Prevent account takeover (email enumeration)
     * 2. Use fragment (#) instead of query (?) for token
     * 3. Remove stateless() for CSRF protection
     */
    public function callback(Request $request): JsonResponse|RedirectResponse
    {
        if (! $this->hasGoogleCredentials()) {
            return $this->callbackErrorResponse(
                $request,
                'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.',
                500
            );
        }

        try {
            // FIX #3: Remove ->stateless() for CSRF protection
            $googleUser = Socialite::driver('google')
                ->redirectUrl($this->googleRedirectUri())
                ->user(); // Laravel handles state automatically
        } catch (\Exception $e) {
            $message = app()->environment('local')
                ? 'Gagal autentikasi dengan Google: '.$e->getMessage()
                : 'Gagal autentikasi dengan Google.';

            return $this->callbackErrorResponse($request, $message, 400);
        }

        // FIX #1: Prevent account takeover
        // Step 1: Check by Google ID first (existing Google users)
        $user = User::where('google_id', $googleUser->getId())->first();

        if ($user) {
            // Existing Google user - update avatar if changed
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
            ]);
        } else {
            // Step 2: Google ID not found, check by email
            $existingUser = User::where('email', $googleUser->getEmail())->first();

            if ($existingUser) {
                // Email exists - check if already linked to a different Google account
                if ($existingUser->google_id !== null) {
                    // Email sudah linked ke Google account lain - BLOCK!
                    return $this->callbackErrorResponse(
                        $request,
                        'Email ini sudah terhubung dengan akun Google lain. Silakan gunakan akun Google yang sesuai atau login dengan password.',
                        409
                    );
                }

                // Email exists tapi belum linked Google
                // Auto-link ONLY jika email sudah verified (prevent account takeover)
                if ($existingUser->email_verified_at) {
                    $existingUser->update([
                        'google_id' => $googleUser->getId(),
                        'avatar_url' => $googleUser->getAvatar(),
                    ]);
                    $user = $existingUser;
                } else {
                    // Email belum verified - don't auto-link
                    return $this->callbackErrorResponse(
                        $request,
                        'Email sudah terdaftar tapi belum diverifikasi. Silakan verifikasi email terlebih dahulu atau gunakan password untuk login.',
                        403
                    );
                }
            } else {
                // Step 3: Email belum terdaftar - create new user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'username' => Str::slug($googleUser->getName()).'-'.Str::random(4),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(32)), // Random, never used
                    'is_active' => true,
                    'must_change_password' => false,
                    'email_verified_at' => now(), // Auto-verified by Google
                ]);

                // Assign Spatie role
                if (class_exists(\Spatie\Permission\Models\Role::class)) {
                    $userRole = \Spatie\Permission\Models\Role::firstOrCreate(
                        ['name' => 'User', 'guard_name' => 'web']
                    );
                    $user->assignRole($userRole);
                }
            }
        }

        // Generate Sanctum token
        $token = $user->createToken('google-oauth')->plainTextToken;
        $user->loadMissing(['roles', 'author']);
        
        // FIX #2: Use fragment identifier (#) instead of query (?) for security
        $frontendCallbackUrl = $this->buildSecureFrontendCallbackUrl($token, $user);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'access_token' => $token,
                    'user' => $user,
                    'redirect_url' => $frontendCallbackUrl,
                ],
            ]);
        }

        return redirect()->away($frontendCallbackUrl);
    }
}
