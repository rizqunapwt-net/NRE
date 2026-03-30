<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $marketplaces = Marketplace::all();
        
        // Only seed sales for books with approved contracts
        $booksWithContracts = Book::whereHas('contracts', function ($query) {
            $query->where('status', 'approved');
        })->get();

        if ($booksWithContracts->isEmpty()) {
            return;
        }

        $periods = [
            Carbon::now()->format('Y-m'),
            Carbon::now()->subMonth()->format('Y-m'),
            Carbon::now()->subMonths(2)->format('Y-m'),
        ];

        foreach ($periods as $period) {
            $periodStart = Carbon::createFromFormat('Y-m', $period)->startOfMonth();
            $periodEnd = Carbon::createFromFormat('Y-m', $period)->endOfMonth();

            // Find books with approved contracts active for THIS specific period
            $validBooks = Book::whereHas('contracts', function ($query) use ($periodStart, $periodEnd) {
                $query->where('status', 'approved')
                    ->whereDate('start_date', '<=', $periodEnd)
                    ->whereDate('end_date', '>=', $periodStart);
            })->get();

            if ($validBooks->isEmpty()) continue;

            foreach ($validBooks->random(min(10, $validBooks->count())) as $book) {
                $numTransactions = rand(1, 4);
                
                for ($i = 0; $i < $numTransactions; $i++) {
                    $marketplace = $marketplaces->random();
                    $qty = rand(1, 25);
                    
                    Sale::create([
                        'marketplace_id' => $marketplace->id,
                        'book_id' => $book->id,
                        'transaction_id' => 'TRX-' . strtoupper(\Illuminate\Support\Str::random(10)),
                        'period_month' => $period,
                        'quantity' => $qty,
                        'net_price' => $book->price * 0.9,
                        'status' => 'completed',
                        'imported_by' => $admin->id,
                    ]);
                }
            }
        }
    }
}
