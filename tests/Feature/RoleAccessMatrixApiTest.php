<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessMatrixApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_author_cannot_import_sales(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $author = User::factory()->create();
        $author->assignRole('User');
        $this->actingAs($author);

        $response = $this->postJson('/api/v1/sales/import', []);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_royalty_calculation_endpoint(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create();
        $this->actingAsWithRole($admin, 'Admin');

        $response = $this->postJson('/api/v1/royalties/calculate', [
            'period_month' => '2026-02',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_author_cannot_mark_payment_paid(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $author = User::factory()->create();
        $author->assignRole('User');
        $this->actingAs($author);

        $payment = Payment::factory()->create();

        $response = $this->putJson("/api/v1/payments/{$payment->id}/mark-paid", [
            'payment_reference' => 'REF-001',
        ]);

        $response->assertStatus(403);
    }
}
