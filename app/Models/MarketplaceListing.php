<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplaceListing extends Model
{
    protected $fillable = [
        'ebook_id',
        'marketplace_id',
        'external_id',
        'listing_url',
        'price',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'ebook_id');
    }

    public function marketplace(): BelongsTo
    {
        return $this->belongsTo(Marketplace::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
