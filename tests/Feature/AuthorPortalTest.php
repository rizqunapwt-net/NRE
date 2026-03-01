<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorPortalTest extends TestCase
{
    use RefreshDatabase;

    private function createAuthorWithUser(): array
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create([
            'email'             => 'author@test.com',
            'is_verified_author' => true,
        ]);

        $author = Author::factory()->create(['email' => 'author@test.com']);

        return [$user, $author];
    }

    public function test_author_can_access_dashboard(): void
    {
        [$user, $author] = $this->createAuthorWithUser();

        $response = $this->actingAs($user)->getJson('/api/v1/user/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['author', 'statistics']]);
    }

    public function test_unauthenticated_user_cannot_access_author_dashboard(): void
    {
        $response = $this->getJson('/api/v1/user/dashboard');

        $response->assertUnauthorized();
    }

    public function test_non_author_user_cannot_access_author_portal(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_verified_author' => false]);
        $user->assignRole('User');

        $response = $this->actingAs($user)->getJson('/api/v1/user/dashboard');

        $response->assertForbidden();
    }

    public function test_author_can_view_their_books(): void
    {
        [$user, $author] = $this->createAuthorWithUser();
        Book::factory()->count(3)->create(['author_id' => $author->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/user/books');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_author_can_view_their_profile(): void
    {
        [$user, $author] = $this->createAuthorWithUser();

        $response = $this->actingAs($user)->getJson('/api/v1/user/profile');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }
}
