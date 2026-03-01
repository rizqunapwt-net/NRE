<?php

namespace App\Models;

use App\Enums\AccessType;
use App\Enums\BookPaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class BookPurchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'book_id', 'amount_paid', 'currency',
        'payment_method', 'payment_status', 'transaction_id',
        'payment_gateway_id', 'payment_metadata', 'access_type',
        'ip_address', 'user_agent', 'paid_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid'      => 'decimal:2',
            'payment_metadata' => 'array',
            'payment_status'   => BookPaymentStatus::class,
            'access_type'      => AccessType::class,
            'paid_at'          => 'datetime',
            'expires_at'       => 'datetime',
        ];
    }

    // ─── Relations ───

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function access(): HasOne
    {
        return $this->hasOne(BookAccess::class);
    }

    // ─── Scopes ───

    public function scopePaid($query)
    {
        return $query->where('payment_status', BookPaymentStatus::PAID);
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', BookPaymentStatus::PENDING);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeExpiringSoon($query, int $days = 7)
    {
        return $query->whereNotNull('expires_at')
            ->where('expires_at', '<=', now()->addDays($days))
            ->where('expires_at', '>', now());
    }

    // ─── Helpers ───

    public function isPaid(): bool
    {
        return $this->payment_status === BookPaymentStatus::PAID;
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? false;
    }

    /**
     * Tandai purchase sebagai lunas (data mutation only).
     *
     * PENTING: Event dispatch TIDAK dilakukan di sini — dilakukan di
     * BookPurchaseService::confirmPayment() agar tidak terjadi double dispatch.
     * Model hanya bertanggung jawab untuk data mutation.
     */
    public function markAsPaid(string $gatewayId, array $metadata = []): void
    {
        if ($this->isPaid()) {
            throw new \RuntimeException('Purchase sudah dalam status paid.');
        }

        $this->update([
            'payment_status'    => BookPaymentStatus::PAID,
            'payment_gateway_id' => $gatewayId,
            'payment_metadata'  => $metadata,
            'paid_at'           => now(),
            'expires_at'        => $this->access_type->expirationDate(),
        ]);
    }
}
