<?php

namespace App\Models\Percetakan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $table = 'percetakan_products';

    protected $fillable = [
        'code',
        'name',
        'category_id',
        'description',
        'unit',
        'base_price',
        'lead_time_days',
        'is_active',
        'specifications',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'specifications' => 'array',
        'lead_time_days' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
