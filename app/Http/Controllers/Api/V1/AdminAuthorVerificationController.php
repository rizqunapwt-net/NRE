<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAuthorVerificationController extends Controller
{
    /**
     * GET /api/v1/admin/author-verification/pending
     * Daftar penulis yang menunggu verifikasi.
     */
    public function pendingList(): JsonResponse
    {
        $pendingAuthors = User::where('is_verified_author', false)
            ->whereNotNull('author_profile_id')
            ->with(['author' => function ($query) {
                $query->where('status', 'pending_verification');
            }])
            ->whereHas('author', function ($query) {
                $query->where('status', 'pending_verification');
            })
            ->latest('author_verified_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $pendingAuthors,
        ]);
    }

    /**
     * POST /api/v1/admin/author-verification/{userId}/approve
     * Admin menyetujui verifikasi penulis.
     */
    public function approve(Request $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        if ($user->is_verified_author) {
            return response()->json([
                'success' => false,
                'message' => 'User ini sudah terverifikasi sebagai penulis.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($user) {
                // Update user
                $user->update([
                    'is_verified_author' => true,
                    'author_verified_at' => now(),
                ]);

                // Update author status
                if ($user->author) {
                    $user->author->update([
                        'status' => 'verified',
                    ]);
                }

                // Assign/ensure User role
                if (class_exists(\Spatie\Permission\Models\Role::class)) {
                    $userRole = \Spatie\Permission\Models\Role::firstOrCreate(
                        ['name' => 'User', 'guard_name' => 'web']
                    );
                    
                    // Remove Author role if exists, assign User role
                    $user->syncRoles([$userRole]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Verifikasi penulis berhasil disetujui.',
                'data' => [
                    'user_id' => $user->id,
                    'is_verified_author' => true,
                    'author_verified_at' => $user->author_verified_at,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui verifikasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/author-verification/{userId}/reject
     * Admin menolak verifikasi penulis.
     */
    public function reject(Request $request, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($userId);

        try {
            DB::transaction(function () use ($user, $validated) {
                // Update author status
                if ($user->author) {
                    $user->author->update([
                        'status' => 'rejected',
                        'rejection_reason' => $validated['reason'],
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Verifikasi penulis ditolak.',
                'data' => [
                    'user_id' => $user->id,
                    'rejection_reason' => $validated['reason'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak verifikasi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
