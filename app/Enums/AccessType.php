<?php

namespace App\Enums;

use Carbon\Carbon;

enum AccessType: string
{
    case PERMANENT  = 'permanent';
    case RENTAL_30D = 'rental_30d';
    case RENTAL_90D = 'rental_90d';
    case RENTAL_365D = 'rental_365d';

    public function label(): string
    {
        return match ($this) {
            self::PERMANENT   => 'Akses Permanen',
            self::RENTAL_30D  => 'Sewa 30 Hari',
            self::RENTAL_90D  => 'Sewa 90 Hari',
            self::RENTAL_365D => 'Sewa 365 Hari',
        };
    }

    public function expirationDate(): ?Carbon
    {
        return match ($this) {
            self::PERMANENT   => null,
            self::RENTAL_30D  => now()->addDays(30),
            self::RENTAL_90D  => now()->addDays(90),
            self::RENTAL_365D => now()->addDays(365),
        };
    }
}
