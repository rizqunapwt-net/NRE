<?php

namespace App\Services;

use App\Models\Author;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthorAccountService
{
    /**
     * Create a user account for an author.
     *
     * @return array{user: User, temporary_password: string}
     */
    public function createAccount(Author $author, ?string $email = null): array
    {
        if ($author->user_id !== null) {
            throw new \InvalidArgumentException('Penulis ini sudah memiliki akun login.');
        }

        return DB::transaction(function () use ($author, $email) {
            $temporaryPassword = $this->generateTemporaryPassword($author->name);
            $accountEmail = $email ?? $author->email;

            $user = User::create([
                'name' => $author->name,
                'email' => $accountEmail,
                'username' => $this->generateUsername($author->name),
                'password' => Hash::make($temporaryPassword),
                'role' => 'User',
                'is_active' => true,
                'must_change_password' => true,
            ]);

            // Assign Spatie role if available
            try {
                $user->assignRole('User');
            } catch (\Throwable $e) {
                // Spatie role may not exist yet, skip silently
            }

            $author->update(['user_id' => $user->id]);

            return [
                'user' => $user,
                'temporary_password' => $temporaryPassword,
            ];
        });
    }

    /**
     * Generate a temporary password that's easy to communicate via WhatsApp.
     * Format: FirstName + 4 digits + symbol
     * Example: "Ahmad7392!" — mudah dikomunikasikan via WA
     */
    private function generateTemporaryPassword(string $authorName): string
    {
        $firstName = Str::title(explode(' ', trim($authorName))[0]);
        $numbers = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $symbols = ['!', '@', '#', '$', '%'];
        $symbol = $symbols[array_rand($symbols)];

        return "{$firstName}{$numbers}{$symbol}";
    }

    /**
     * Generate a unique username from author name.
     */
    private function generateUsername(string $name): string
    {
        $base = Str::slug(Str::lower($name), '.');
        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.'.'.$counter;
            $counter++;
        }

        return $username;
    }
}
