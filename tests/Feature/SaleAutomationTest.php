<?php

namespace Tests\Feature;

use App\Enums\ContractStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\RoyaltyCalculation;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleAutomationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test logic: Sale Created -> Stock Decreased & Royalty Item Created
     */
    public function test_sale_creation_triggers_automations(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create([
            'author_id' => $author->id,
            'stock' => 100,
            'price' => 50000,
        ]);

        Contract::factory()->create([
            'book_id' => $book->id,
            'status' => ContractStatus::Approved,
            'royalty_percentage' => 10,
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->addYear(),
        ]);

        $marketplace = Marketplace::factory()->create();

        $sale = Sale::factory()->create([
            'book_id' => $book->id,
            'marketplace_id' => $marketplace->id,
            'quantity' => 2,
            'net_price' => 50000,
            'period_month' => now()->format('Y-m'),
            'transaction_id' => 'TRX-TEST-001',
        ]);

        // Cek Stok Buku berkurang (100 - 2 = 98)
        $this->assertEquals(98, $book->fresh()->stock);

        // Cek RoyaltyCalculation dibuat
        $calculation = RoyaltyCalculation::where('author_id', $author->id)->first();
        $this->assertNotNull($calculation);
    }

    /**
     * Test logic: Sale Deleted -> Stock Restored
     */
    public function test_sale_deletion_restores_stock(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create(['author_id' => $author->id, 'stock' => 100]);

        Contract::factory()->create([
            'book_id' => $book->id,
            'status' => ContractStatus::Approved,
            'start_date' => now()->subMonth(),
            'end_date' => now()->addYear(),
        ]);

        $sale = Sale::factory()->create([
            'book_id' => $book->id,
            'quantity' => 5,
            'period_month' => now()->format('Y-m'),
        ]);

        $this->assertEquals(95, $book->fresh()->stock);

        $sale->delete();

        $this->assertEquals(100, $book->fresh()->stock);
    }
}
