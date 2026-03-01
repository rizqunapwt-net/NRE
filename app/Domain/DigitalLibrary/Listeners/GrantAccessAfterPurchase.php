<?php

namespace App\Domain\DigitalLibrary\Listeners;

use App\Domain\DigitalLibrary\Events\BookPurchased;
use App\Services\BookAccessService;
use Illuminate\Contracts\Queue\ShouldQueue;

class GrantAccessAfterPurchase implements ShouldQueue
{
    public string $queue = 'default';

    public function __construct(
        private readonly BookAccessService $accessService
    ) {}

    public function handle(BookPurchased $event): void
    {
        $this->accessService->grantFromPurchase($event->purchase);
    }

    public function failed(BookPurchased $event, \Throwable $exception): void
    {
        logger()->error('GrantAccessAfterPurchase failed', [
            'purchase_id' => $event->purchase->id,
            'error'       => $exception->getMessage(),
        ]);
    }
}
