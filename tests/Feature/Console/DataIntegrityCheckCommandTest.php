<?php

namespace Tests\Feature\Console;

use App\Enums\ContractStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\RoyaltyCalculation;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DataIntegrityCheckCommandTest extends TestCase
{
    use DatabaseTransactions;

    public function test_data_integrity_check_can_apply_safe_fixes(): void
    {
        $author = Author::factory()->create([
            'name' => 'Integrity Author',
            'email' => 'integrity-author@example.com',
        ]);

        $book = Book::create([
            'author_id' => $author->id,
            'title' => 'Broken Book',
            'price' => -100,
            'status' => 'draft',
        ]);

        $contract = Contract::create([
            'book_id' => $book->id,
            'contract_file_path' => 'contracts/broken-book.pdf',
            'start_date' => now()->subMonths(3)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
            'royalty_percentage' => 10,
            'status' => ContractStatus::Approved,
        ]);

        $royalty = RoyaltyCalculation::create([
            'author_id' => $author->id,
            'period_month' => now()->format('Y-m'),
            'total_amount' => 999,
            'status' => 'finalized',
        ]);

        $payment = Payment::create([
            'royalty_calculation_id' => $royalty->id,
            'invoice_number' => 'INV-INTEGRITY-001',
            'amount' => 500,
            'status' => 'unpaid',
        ]);

        $this->artisan('data:integrity-check', ['--fix' => true])
            ->expectsOutput('Running data integrity audit...')
            ->assertExitCode(0);

        $this->assertSame('0.00', number_format((float) $book->fresh()->price, 2, '.', ''));
        $this->assertSame(ContractStatus::Expired, $contract->fresh()->status);
        $this->assertSame('0.00', number_format((float) $royalty->fresh()->total_amount, 2, '.', ''));
        $this->assertSame('0.00', number_format((float) $payment->fresh()->amount, 2, '.', ''));
    }
}
