<?php

namespace App\Enums;

enum BookPaymentStatus: string
{
    case PENDING  = 'pending';
    case PAID     = 'paid';
    case FAILED   = 'failed';
    case REFUNDED = 'refunded';
    case EXPIRED  = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::PENDING  => 'Menunggu Pembayaran',
            self::PAID     => 'Lunas',
            self::FAILED   => 'Gagal',
            self::REFUNDED => 'Dikembalikan',
            self::EXPIRED  => 'Kadaluarsa',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::PAID, self::REFUNDED, self::FAILED]);
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING  => 'warning',
            self::PAID     => 'success',
            self::FAILED   => 'error',
            self::REFUNDED => 'default',
            self::EXPIRED  => 'default',
        };
    }
}
