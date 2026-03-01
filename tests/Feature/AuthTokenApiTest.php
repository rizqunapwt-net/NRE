<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTokenApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles for permission checks
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_it_issues_token_for_active_user_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'finance@rizquna.id',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);

        // UnifiedLoginController expects 'username' field, not 'login'
        $payload = [
            'username' => $user->username,
            'password' => 'secret123',
            'device_name' => 'postman',
        ];

        $response = $this->postJson('/api/v1/auth/login', $payload);

        // If 422, print full response for debugging
        if ($response->status() === 422) {
            $content = $response->getContent();
            $this->fail('422 Response: '.$content);
        }

        // If 500, print full response for debugging
        if ($response->status() === 500) {
            $content = $response->getContent();
            $this->fail('500 Response: '.$content);
        }

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer');

        $this->assertNotEmpty($response->json('data.access_token'));
        $this->assertNotEmpty($response->json('data.token')); // alias
        $this->assertEquals($response->json('data.access_token'), $response->json('data.token'));
    }

    public function test_it_issues_token_with_username_field(): void
    {
        $user = User::factory()->create([
            'email' => 'finance@rizquna.id',
            'username' => 'finance',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'finance',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['access_token', 'token', 'token_type', 'user']]);
    }

    public function test_it_returns_user_data_with_role_and_employee(): void
    {
        $user = User::factory()->create([
            'email' => 'finance@rizquna.id',
            'username' => 'financeuser',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => $user->username,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'username', 'role']]]);
    }

    public function test_it_rejects_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'finance@rizquna.id',
            'username' => 'financeuser',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_it_rejects_missing_login_field(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'password' => 'secret123',
        ]);

        // Debug missing field test
        if ($response->status() === 500) {
            $this->fail('Missing field test - 500 Response: '.$response->getContent());
        }

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_it_rejects_inactive_user(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@rizquna.id',
            'username' => 'inactiveuser',
            'password' => Hash::make('secret123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => $user->username,
            'password' => 'secret123',
        ]);

        // Debug inactive user test
        if ($response->status() === 422) {
            $this->fail('Inactive user test - 422 Response: '.$response->getContent());
        }

        if ($response->status() === 500) {
            $this->fail('Inactive user test - 500 Response: '.$response->getContent());
        }

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }
}
