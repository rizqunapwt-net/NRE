<?php

namespace App\Console\Commands;

use App\Domain\DigitalLibrary\Services\BookPurchaseService;
use Illuminate\Console\Command;

class CancelExpiredPurchases extends Command
{
    protected $signature = 'books:cancel-expired-purchases
        {--hours=2 : Batas waktu pending (default 2 jam)}';

    protected $description = 'Cancel pembelian buku yang expired (tidak dibayar dalam waktu tertentu)';

    public function handle(BookPurchaseService $purchaseService): int
    {
        $hours = (int) $this->option('hours');

        $this->info("📊 Mencari pembelian pending yang expired (> {$hours} jam)...");

        $cancelled = $purchaseService->cancelExpiredPurchases($hours);

        if ($cancelled === 0) {
            $this->info("✅ Tidak ada pembelian expired yang perlu dibatalkan");
            return 0;
        }

        $this->info("✅ Berhasil membatalkan {$cancelled} pembelian expired");

        // Log activity
        activity('purchase_cancelled')
            ->causedBy(null) // System
            ->log("Cancel {$cancelled} pembelian expired via scheduled command");

        return 0;
    }
}
