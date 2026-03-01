<?php

namespace App\Domain\Admin\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Service class for User Management.
 * Handles business logic for creating, updating, and managing system users.
 */
class UserService
{
    /**
     * Get a paginated list of users with their roles.
     */
    public function getAllUsers(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = User::with('roles')
            ->select(['id', 'name', 'email', 'username', 'phone', 'is_active', 'is_verified_author', 'last_login_at', 'created_at']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['role'])) {
            $query->role($filters['role']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new user and assign a role.
     */
    public function createUser(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'] ?? $this->generateUniqueUsername($data['name']),
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'must_change_password' => true, // Security best practice for admin-created users
        ]);

        if (!empty($data['role'])) {
            $user->assignRole($data['role']);
        }

        return $user;
    }

    /**
     * Update an existing user.
     */
    public function updateUser(User $user, array $data): bool
    {
        $updateData = collect($data)->except(['password', 'role'])->toArray();

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $success = $user->update($updateData);

        if ($success && !empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return $success;
    }

    /**
     * Toggle the active status of a user.
     */
    public function toggleActive(User $user): bool
    {
        return $user->update(['is_active' => !$user->is_active]);
    }

    /**
     * Safely delete a user.
     */
    public function deleteUser(User $user): bool
    {
        $user->tokens()->delete();
        return $user->delete();
    }

    /**
     * Get all available roles in the system.
     */
    public function getAvailableRoles(): array
    {
        return Role::where('guard_name', 'web')
            ->withCount('users')
            ->get()
            ->map(fn ($role) => [
                'name' => $role->name,
                'users_count' => $role->users_count,
            ])
            ->toArray();
    }

    /**
     * Generate a unique username based on the name.
     */
    protected function generateUniqueUsername(string $name): string
    {
        $base = Str::slug($name);
        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . '-' . $counter;
            $counter++;
        }

        return $username;
    }
}
