<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AuthorRegisterController extends Controller
{
    /**
     * POST /api/v1/authors/register
     * 
     * Register a new author with complete profile.
     * This creates both User and Author profile in one transaction.
     * 
     * @bodyParam name string required Full name
     * @bodyParam username string required Unique username (min 3 chars)
     * @bodyParam email string required Valid email (unique)
     * @bodyParam password string required Min 8 chars, must be confirmed
     * @bodyParam phone string required Phone/WhatsApp number
     * @bodyParam bio string nullable Author biography
     * @bodyParam bank_name string required Bank name for royalty payments
     * @bodyParam bank_account string required Bank account number
     * @bodyParam bank_account_name string required Bank account holder name
     * 
     * @response 201 {
     *   "success": true,
     *   "message": "Registrasi berhasil. Silakan login dengan email dan password Anda.",
     *   "data": {
     *     "user_id": 1,
     *     "email": "author@example.com",
     *     "author_id": 1,
     *     "status": "pending_verification"
     *   }
     * }
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                // User Account
                'name' => ['required', 'string', 'max:255', 'min:3'],
                'username' => ['required', 'string', 'min:3', 'max:50', 'unique:users,username'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                    'regex:/[A-Z]/',      // at least 1 uppercase
                    'regex:/[0-9]/',      // at least 1 digit
                ],
                
                // Author Profile - Required
                'phone' => ['required', 'string', 'max:20'],
                'bank_name' => ['required', 'string', 'max:255'],
                'bank_account' => ['required', 'string', 'max:50'],
                'bank_account_name' => ['required', 'string', 'max:255'],
                
                // Author Profile - Optional
                'bio' => ['nullable', 'string', 'max:1000'],
                'address' => ['nullable', 'string', 'max:500'],
                'city' => ['nullable', 'string', 'max:255'],
                'province' => ['nullable', 'string', 'max:255'],
                'postal_code' => ['nullable', 'string', 'max:10'],
                'npwp' => ['nullable', 'string', 'max:20'],
                'social_links' => ['nullable', 'array'],
                'social_links.website' => ['nullable', 'url', 'max:255'],
                'social_links.instagram' => ['nullable', 'string', 'max:100'],
                'social_links.twitter' => ['nullable', 'string', 'max:100'],
                'social_links.facebook' => ['nullable', 'string', 'max:100'],
            ], [
                'password.regex' => 'Password harus mengandung minimal 1 huruf kapital dan 1 angka.',
                'password.confirmed' => 'Konfirmasi password tidak cocok.',
                'username.unique' => 'Username sudah digunakan, silakan pilih yang lain.',
                'email.unique' => 'Email sudah terdaftar, silakan gunakan email lain atau login.',
            ]);

            DB::transaction(function () use ($validated, $request) {
                // 1. Create User
                $user = User::create([
                    'name' => $validated['name'],
                    'username' => $validated['username'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'phone' => $validated['phone'],
                    'address' => $validated['address'] ?? null,
                    'is_active' => true,
                    'is_verified_author' => false, // Must be verified by admin
                    'must_change_password' => false,
                    'email_verified_at' => now(), // Auto-verify email for author registration
                ]);

                // 2. Assign Spatie "User" role
                if (class_exists(Role::class)) {
                    $userRole = Role::firstOrCreate(
                        ['name' => 'User', 'guard_name' => 'web']
                    );
                    $user->assignRole($userRole);
                }

                // 3. Create Author Profile
                $author = Author::create([
                    'user_id' => $user->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'bio' => $validated['bio'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'province' => $validated['province'] ?? null,
                    'postal_code' => $validated['postal_code'] ?? null,
                    'bank_name' => $validated['bank_name'],
                    'bank_account' => $validated['bank_account'],
                    'bank_account_name' => $validated['bank_account_name'],
                    'npwp' => $validated['npwp'] ?? null,
                    'status' => 'active', // Default active, admin can change if needed
                    'royalty_percentage' => 10.0, // Default 10% royalty
                    'social_links' => $validated['social_links'] ?? null,
                    'language' => 'id',
                    'is_profile_complete' => true, // Mark as complete since all required fields provided
                    'profile_completed_at' => now(),
                ]);

                // 4. Update user with author profile link and verification status
                $user->update([
                    'author_profile_id' => $author->id,
                    'is_verified_author' => true, // Auto-verify since they provided complete info
                    'author_verified_at' => now(),
                ]);

                // 5. Log registration event
                try {
                    \App\Models\AuthLog::create([
                        'event' => 'author_registration',
                        'identifier' => $user->email,
                        'user_id' => $user->id,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'status' => 'success',
                        'reason' => 'new_author_registered',
                    ]);
                } catch (\Exception $e) {
                    // Silently fail if AuthLog not available
                }

                // 6. Send notification to admin (optional - can be implemented later)
                // For now, just log it
                \Illuminate\Support\Facades\Log::info('New author registered', [
                    'user_id' => $user->id,
                    'author_id' => $author->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil! Akun Anda sudah terverifikasi sebagai penulis.',
                'data' => [
                    'email' => $validated['email'],
                    'login_url' => '/login',
                    'note' => 'Silakan login dengan email dan password Anda. Anda sudah dapat mengakses portal penulis.',
                    'auto_verified' => true,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Author registration failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat registrasi. Silakan coba lagi.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/v1/authors/check-username
     * 
     * Check if username is available.
     */
    public function checkUsername(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:50'],
        ]);

        $exists = User::where('username', $validated['username'])->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'username' => $validated['username'],
                'available' => ! $exists,
            ],
        ]);
    }

    /**
     * GET /api/v1/authors/check-email
     * 
     * Check if email is available.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $exists = User::where('email', $validated['email'])->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'email' => $validated['email'],
                'available' => ! $exists,
            ],
        ]);
    }
}
