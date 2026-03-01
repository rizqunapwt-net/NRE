<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthorVerificationController extends Controller
{
    /**
     * POST /api/v1/user/request-author-verification
     * User mengajukan verifikasi sebagai penulis.
     */
    public function requestVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        // Cek apakah user sudah verified
        if ($user->is_verified_author) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah terverifikasi sebagai penulis.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'social_links' => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($user, $validated) {
                // Update user data
                $user->update([
                    'phone' => $validated['phone'] ?? $user->phone,
                    'address' => $validated['address'] ?? $user->address,
                ]);

                // Create or update author profile
                $author = \App\Models\Author::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'name' => $validated['name'],
                        'email' => $user->email,
                        'bio' => $validated['bio'] ?? null,
                        'phone' => $user->phone,
                        'address' => $user->address,
                        'status' => 'pending_verification',
                    ]
                );

                // Update user's author_profile_id
                $user->update([
                    'author_profile_id' => $author->id,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Permintaan verifikasi penulis berhasil diajukan. Menunggu persetujuan admin.',
                'data' => [
                    'is_verified_author' => false,
                    'status' => 'pending_verification',
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan verifikasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/user/verification-status
     * Cek status verifikasi penulis.
     */
    public function verificationStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'is_verified_author' => $user->is_verified_author,
                'author_verified_at' => $user->author_verified_at,
                'has_author_profile' => $user->author_profile_id !== null,
                'author_status' => $user->author?->status ?? null,
            ],
        ]);
    }
}
