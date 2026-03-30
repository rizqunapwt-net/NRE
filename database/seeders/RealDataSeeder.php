<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds contracts and sales data for real books (from RealBooksSeeder).
 * Run this AFTER RealBooksSeeder.
 */
class RealDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        if (!$admin) {
            $this->command->error('Admin user not found. Run DevelopmentSeeder first.');
            return;
        }

        // Ensure marketplaces exist
        $marketplaces = Marketplace::all();
        if ($marketplaces->isEmpty()) {
            $this->command->info('Creating marketplaces...');
            foreach (['Shopee', 'Tokopedia', 'Lazada', 'Bukalapak', 'TikTok Shop'] as $name) {
                Marketplace::firstOrCreate(
                    ['name' => $name],
                    ['slug' => Str::slug($name), 'website_url' => 'https://' . Str::slug($name) . '.co.id', 'is_active' => true]
                );
            }
            $marketplaces = Marketplace::all();
        }

        // ── Step 1: Create contracts for all real books ──
        $this->command->info('Creating contracts for real books...');
        
        $realBooks = Book::where('cover_path', 'LIKE', 'books/covers/%')->get();
        $contractCount = 0;

        foreach ($realBooks as $book) {
            // Skip if already has an approved contract
            if ($book->contracts()->where('status', 'approved')->exists()) {
                continue;
            }

            Contract::create([
                'book_id' => $book->id,
                'contract_file_path' => 'contracts/contract-' . $book->id . '.pdf',
                'start_date' => Carbon::parse('2025-01-01'),
                'end_date' => Carbon::parse('2027-12-31'),
                'royalty_percentage' => collect([10, 12, 15, 20])->random(),
                'status' => 'approved',
                'approved_by' => $admin->id,
                'approved_at' => now()->subMonths(rand(1, 6)),
                'created_by' => $admin->id,
            ]);
            $contractCount++;
        }

        $this->command->info("Created $contractCount contracts.");

        // ── Step 2: Create realistic sales data ──
        $this->command->info('Creating sales data...');

        $periods = [
            '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
            '2026-01', '2026-02', '2026-03',
        ];

        $salesCount = 0;

        foreach ($periods as $period) {
            $periodStart = Carbon::createFromFormat('Y-m', $period)->startOfMonth();
            $periodEnd = Carbon::createFromFormat('Y-m', $period)->endOfMonth();

            // Pick random subset of books for this period (not all books sell every month)
            $booksThisPeriod = $realBooks->random(min(rand(15, 40), $realBooks->count()));

            foreach ($booksThisPeriod as $book) {
                // Each book sold on 1-3 marketplaces this month
                $marketplacesForBook = $marketplaces->random(min(rand(1, 3), $marketplaces->count()));

                foreach ($marketplacesForBook as $marketplace) {
                    $qty = rand(1, 20);
                    $netPrice = round($book->price * (rand(75, 95) / 100), 2); // 75-95% of list price

                    Sale::create([
                        'marketplace_id' => $marketplace->id,
                        'book_id' => $book->id,
                        'transaction_id' => 'TRX-' . strtoupper(Str::random(10)),
                        'period_month' => $period,
                        'quantity' => $qty,
                        'net_price' => $netPrice,
                        'status' => 'completed',
                        'imported_by' => $admin->id,
                    ]);
                    $salesCount++;
                }
            }
        }

        $this->command->info("Created $salesCount sales records across " . count($periods) . " months.");
        $this->command->info('Done! Real data seeding complete.');
    }
}
