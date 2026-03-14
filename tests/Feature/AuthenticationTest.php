<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed roles and users
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'UserSeeder']);
    }

    public function test_login_returns_token(): void
    {
        $user = User::where('email', 'admin@rizquna.com')->first();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rizquna.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['user', 'token'],
            ]);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rizquna.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard-stats');

        $response->assertStatus(401);
    }

    public function test_public_endpoint_no_auth_needed(): void
    {
        $response = $this->getJson('/api/v1/public/catalog');

        $response->assertStatus(200);
    }

    public function test_logout_requires_auth(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    }

    public function test_me_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }
}
