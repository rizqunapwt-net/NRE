<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'access_token',
                         'token_type',
                         'user'
                     ]
                 ]);
        
        $this->assertNotEmpty($response->json('data.access_token'));
    }

    /** @test */
    public function it_returns_422_when_login_data_is_missing()
    {
        $response = $this->postJson('/api/v1/auth/login', []);
        
        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    /** @test */
    public function a_user_can_logout_and_revoke_token()
    {
        $user = User::factory()->create();
        $token = $user->createToken('TestToken')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertCount(0, $user->fresh()->tokens);
    }

    /** @test */
    public function it_returns_user_profile_when_authenticated()
    {
        $user = User::factory()->create();
        $token = $user->createToken('TestToken')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('data.user.email', $user->email);
    }
}
