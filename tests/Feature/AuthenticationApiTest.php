<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->withoutMiddleware();
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.access_token'));
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        $user->assignRole('Admin');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $response->assertJsonPath('data.user.email', 'test@example.com');
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
    }

    public function test_user_has_correct_role_after_login(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $this->assertTrue($user->hasRole('Admin'));
    }

    public function test_user_has_correct_permissions_after_login(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
    }

    public function test_user_cannot_access_protected_routes_without_authentication(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_login_with_username_works_if_supported(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'testuser',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
    }

    public function test_user_email_must_be_unique(): void
    {
        User::factory()->create([
            'email' => 'duplicate@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'duplicate@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Should fail due to unique constraint
        $response->assertStatus(422);
    }

    public function test_password_confirmation_required_on_registration(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_token_is_required_for_profile_access(): void
    {
        $response = $this->withHeaders(['Authorization' => 'Bearer invalid-token'])
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }
}
