<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Note: Sistem hanya punya 2 roles: Admin dan User.
     * User role bersifat multi-fungsi (bisa jadi reader, author, editor).
     */
    public function run(): void
    {
        // Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@rizquna.com'],
            [
                'name' => 'Rizquna Admin',
                'username' => 'admin_' . time(),
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles(['Admin']);

        // Author User (dengan role User + permission author)
        $author = User::firstOrCreate(
            ['email' => 'penulis@rizquna.com'],
            [
                'name' => 'Penulis Rizquna',
                'username' => 'penulis_' . time(),
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $author->syncRoles(['User']);

        // Editor User (dengan role User)
        $editor = User::firstOrCreate(
            ['email' => 'editor@rizquna.com'],
            [
                'name' => 'Editor Rizquna',
                'username' => 'editor_' . time(),
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $editor->syncRoles(['User']);

        // Regular User
        User::firstOrCreate(
            ['email' => 'user@rizquna.com'],
            [
                'name' => 'User Rizquna',
                'username' => 'user_' . time(),
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
    }
}
