<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BookAccess extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'book_access';

    protected $fillable = [
        'user_id', 'book_id', 'access_level', 'is_active',
        'granted_by', 'granted_by_admin_id', 'admin_notes',
        'book_purchase_id', 'granted_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'granted_at' => 'datetime',
            'expires_at' => 'datetime',
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

    public function grantedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by_admin_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(BookPurchase::class, 'book_purchase_id');
    }

    // ─── Scopes ───

    /**
     * Akses yang masih berlaku (aktif dan belum expired).
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForBook($query, int $bookId)
    {
        return $query->where('book_id', $bookId);
    }

    // ─── Helpers ───

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
