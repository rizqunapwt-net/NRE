<?php

namespace App\Enums;

enum PublishingRequestStatus: string
{
    case SUBMITTED = 'submitted';
    case REVIEW = 'review';
    case EDITING = 'editing';
    case LAYOUT = 'layout';
    case ISBN = 'isbn';
    case PRINTING = 'printing';
    case PUBLISHED = 'published';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::SUBMITTED => 'Naskah Diterima',
            self::REVIEW => 'Review Editor',
            self::EDITING => 'Proses Editing',
            self::LAYOUT => 'Layout & Desain',
            self::ISBN => 'Pengurusan ISBN',
            self::PRINTING => 'Proses Cetak',
            self::PUBLISHED => 'Terbit',
            self::REJECTED => 'Ditolak',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SUBMITTED => 'default',
            self::REVIEW => 'processing',
            self::EDITING => 'blue',
            self::LAYOUT => 'cyan',
            self::ISBN => 'purple',
            self::PRINTING => 'orange',
            self::PUBLISHED => 'success',
            self::REJECTED => 'error',
        };
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::SUBMITTED => [self::REVIEW, self::REJECTED],
            self::REVIEW => [self::EDITING, self::REJECTED],
            self::EDITING => [self::LAYOUT],
            self::LAYOUT => [self::ISBN],
            self::ISBN => [self::PRINTING],
            self::PRINTING => [self::PUBLISHED],
            default => [],
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions());
    }
}
