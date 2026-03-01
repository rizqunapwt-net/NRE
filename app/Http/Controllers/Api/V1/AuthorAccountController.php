<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Services\AuthorAccountService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuthorAccountController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthorAccountService $service) {}

    /**
     * GET /api/v1/admin/authors/without-account
     * List all authors that don't have a user account yet.
     */
    public function withoutAccount(): JsonResponse
    {
        $authors = Author::withoutAccount()
            ->select('id', 'name', 'email', 'phone', 'status', 'created_at')
            ->orderBy('name')
            ->get();

        return $this->success([
            'authors' => $authors,
            'count' => $authors->count(),
        ]);
    }

    /**
     * POST /api/v1/admin/authors/{author}/create-account
     * Create a user account for the given author.
     */
    public function createAccount(Request $request, Author $author): JsonResponse
    {
        if ($author->user_id !== null) {
            return $this->error('Penulis ini sudah memiliki akun login.', 422);
        }

        $validated = $request->validate([
            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email'),
            ],
        ]);

        try {
            $result = $this->service->createAccount(
                $author,
                $validated['email'] ?? null,
            );

            return $this->success([
                'author' => $author->fresh(),
                'credentials' => [
                    'email' => $result['user']->email,
                    'temporary_password' => $result['temporary_password'],
                    'login_url' => env('FRONTEND_URL', 'http://localhost:3000').'/login',
                ],
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
