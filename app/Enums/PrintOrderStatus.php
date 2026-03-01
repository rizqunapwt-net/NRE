<?php

namespace App\Enums;

enum PrintOrderStatus: string
{
    case PENDING = 'pending';
    case PROCESSED = 'diproses';
    case PRINTING = 'cetak';
    case QC = 'quality_control';
    case SHIPPED = 'dikirim';
    case COMPLETED = 'selesai';
    case CANCELLED = 'dibatalkan';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu',
            self::PROCESSED => 'Diproses',
            self::PRINTING => 'Proses Cetak',
            self::QC => 'Quality Control',
            self::SHIPPED => 'Dikirim',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'default',
            self::PROCESSED => 'processing',
            self::PRINTING => 'blue',
            self::QC => 'cyan',
            self::SHIPPED => 'orange',
            self::COMPLETED => 'success',
            self::CANCELLED => 'error',
        };
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::PENDING => [self::PROCESSED, self::CANCELLED],
            self::PROCESSED => [self::PRINTING, self::CANCELLED],
            self::PRINTING => [self::QC],
            self::QC => [self::SHIPPED],
            self::SHIPPED => [self::COMPLETED],
            default => [],
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions());
    }
}
