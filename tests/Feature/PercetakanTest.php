<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PercetakanTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_percetakan_customers(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create();

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->getJson('/api/v1/percetakan/customers');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_author_cannot_access_percetakan(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('User');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/percetakan/customers');

        $response->assertForbidden();
    }

    public function test_unauthenticated_cannot_access_percetakan(): void
    {
        $response = $this->getJson('/api/v1/percetakan/customers');

        $response->assertUnauthorized();
    }

    public function test_admin_can_access_percetakan_materials(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create();

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->getJson('/api/v1/percetakan/materials');

        $response->assertOk();
    }

    public function test_admin_can_access_percetakan_orders(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create();

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->getJson('/api/v1/percetakan/orders');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_author_cannot_access_dashboard(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('User');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/dashboard/books/stats');

        $response->assertForbidden();
    }
}
