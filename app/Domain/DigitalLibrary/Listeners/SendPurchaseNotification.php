<?php

namespace App\Domain\DigitalLibrary\Listeners;

use App\Domain\DigitalLibrary\Events\BookPurchased;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendPurchaseNotification implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(BookPurchased $event): void
    {
        $purchase = $event->purchase->load(['user', 'book']);

        logger()->info('Book purchased', [
            'user_id'  => $purchase->user_id,
            'book_id'  => $purchase->book_id,
            'amount'   => $purchase->amount_paid,
            'type'     => $purchase->access_type?->value,
        ]);

    }

    public function failed(BookPurchased $event, \Throwable $exception): void
    {
        logger()->warning('SendPurchaseNotification failed', [
            'purchase_id' => $event->purchase->id,
            'error'       => $exception->getMessage(),
        ]);
    }
}
