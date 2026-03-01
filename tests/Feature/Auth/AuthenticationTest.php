<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        // GET /login now serves React SPA (returns 200 in testing)
        $response = $this->get('/login');

        $response->assertOk();
    }

    public function test_users_can_authenticate_via_api(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create([
            'is_active' => true,
            'username' => 'testadmin',
        ]);
        $user->assignRole('Admin');

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => $user->username,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['access_token', 'user']]);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
        ]);

        // Use correct field name (username) for UnifiedLoginController
        $this->post('/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout_via_api(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create([
            'username' => 'logoutuser',
            'is_active' => true,
        ]);
        $user->assignRole('Admin');

        // Login via API to get token
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'username' => $user->username,
            'password' => 'password',
        ]);
        $token = $loginResponse->json('data.access_token');

        // Logout via API
        $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }
}
