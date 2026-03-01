<?php

namespace App\Domain\DigitalLibrary\Events;

use App\Models\BookPurchase;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookPurchased
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly BookPurchase $purchase
    ) {}
}
