<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Author extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'user_id',
        'name',
        'pen_name',
        'nik',
        'email',
        'phone',
        'bio',
        'address',
        'city',
        'province',
        'postal_code',
        'photo_path',
        'bank_name',
        'bank_account',
        'bank_account_name',
        'npwp',
        'ktp_path',
        'status',
        'rejection_reason',
        'royalty_percentage',
        'is_profile_complete',
        'profile_completed_at',
        'social_links',
        'notification_preferences',
        'language',
    ];

    // NOTE: Computed attributes (published_books_count, active_contracts_count, etc.)
    // are available via accessor methods but NOT auto-appended to prevent N+1 queries
    // on collection loads. Use ->append([...]) explicitly when needed on single models.

    protected function casts(): array
    {
        return [
            'royalty_percentage' => 'decimal:2',
            'is_profile_complete' => 'boolean',
            'profile_completed_at' => 'datetime',
            'social_links' => 'array',
            'notification_preferences' => 'array',
        ];
    }

    // ─── Relationships ───

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    public function contracts(): HasManyThrough
    {
        return $this->hasManyThrough(Contract::class, Book::class, 'author_id', 'book_id');
    }

    public function royalties(): HasMany
    {
        return $this->hasMany(RoyaltyCalculation::class, 'author_id');
    }

    public function sales(): HasManyThrough
    {
        return $this->hasManyThrough(Sale::class, Book::class, 'author_id', 'book_id');
    }

    public function printOrders(): HasMany
    {
        return $this->hasMany(PrintOrder::class);
    }

    public function publishingRequests(): HasMany
    {
        return $this->hasMany(PublishingRequest::class);
    }

    public function statusHistories(): MorphMany
    {
        return $this->morphMany(StatusHistory::class, 'trackable');
    }

    // ─── Scopes ───

    public function scopeWithoutAccount($query)
    {
        return $query->whereNull('user_id');
    }

    public function scopeWithAccount($query)
    {
        return $query->whereNotNull('user_id');
    }

    // ─── Computed Attributes ───

    public function getPublishedBooksCountAttribute(): int
    {
        return $this->books()->where('status', 'published')->count();
    }

    public function getActiveContractsCountAttribute(): int
    {
        return $this->contracts()->where('contracts.status', 'approved')->count();
    }

    public function getTotalRoyaltiesAttribute(): float
    {
        return $this->royalties()->sum('total_amount');
    }

    public function getPaidRoyaltiesAttribute(): float
    {
        return $this->royalties()
            ->whereHas('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_amount');
    }

    public function getPendingRoyaltiesAttribute(): float
    {
        return $this->totalRoyalties - $this->paidRoyalties;
    }

    // ─── Business Logic ───

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check and update profile completeness.
     */
    public function checkProfileCompleteness(): bool
    {
        $requiredFields = [
            $this->name,
            $this->nik,
            $this->address,
            $this->city,
            $this->province,
            $this->phone,
            $this->bank_name,
            $this->bank_account,
            $this->bank_account_name,
            $this->ktp_path,
        ];

        $isComplete = ! in_array(null, $requiredFields, true)
            && ! in_array('', $requiredFields, true);

        if ($isComplete && ! $this->is_profile_complete) {
            $this->update([
                'is_profile_complete' => true,
                'profile_completed_at' => now(),
            ]);
        } elseif (! $isComplete && $this->is_profile_complete) {
            $this->update([
                'is_profile_complete' => false,
                'profile_completed_at' => null,
            ]);
        }

        return $isComplete;
    }

    /**
     * Get author dashboard statistics.
     */
    public function getDashboardStats(): array
    {
        return [
            'total_books' => $this->books->count(),
            'published_books' => $this->published_books_count,
            'in_production_books' => $this->books()->whereIn('status', ['production', 'in_production'])->count(),
            'active_contracts' => $this->active_contracts_count,
            'pending_contracts' => $this->contracts()->where('contracts.status', 'pending')->count(),
            'total_royalties' => $this->total_royalties,
            'paid_royalties' => $this->paid_royalties,
            'pending_royalties' => $this->pending_royalties,
            'monthly_sales' => $this->sales()
                ->where('sales.period_month', now()->format('Y-m'))
                ->sum('sales.quantity'),
            'monthly_revenue' => $this->sales()
                ->where('sales.period_month', now()->format('Y-m'))
                ->sum(DB::raw('sales.quantity * sales.net_price')),
            'is_profile_complete' => $this->is_profile_complete,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Author profile {$eventName}");
    }
}
