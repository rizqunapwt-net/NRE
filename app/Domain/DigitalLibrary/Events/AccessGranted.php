<?php

namespace App\Domain\DigitalLibrary\Events;

use App\Models\BookAccess;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccessGranted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly BookAccess $access
    ) {}
}
