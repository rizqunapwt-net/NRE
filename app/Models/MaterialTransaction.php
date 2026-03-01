<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MaterialTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'type',
        'reference_type',
        'reference_id',
        'quantity_in',
        'quantity_out',
        'quantity_adjustment',
        'quantity_before',
        'quantity_after',
        'unit_cost',
        'total_cost',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'quantity_in' => 'decimal:2',
        'quantity_out' => 'decimal:2',
        'quantity_adjustment' => 'decimal:2',
        'quantity_before' => 'decimal:2',
        'quantity_after' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'in' => 'Stock In',
            'out' => 'Stock Out',
            'adjustment' => 'Adjustment',
            'return' => 'Return',
            default => ucfirst($this->type),
        };
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Percetakan\Material::class, 'material_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function recordTransaction(
        $materialId,
        $type,
        $quantity,
        $unitCost,
        $referenceType = null,
        $referenceId = null,
        $notes = null
    ) {
        $material = Percetakan\Material::find($materialId);
        if (! $material) {
            return null;
        }

        $quantityBefore = $material->current_stock;
        $quantityAfter = match ($type) {
            'in' => $quantityBefore + $quantity,
            'out' => $quantityBefore - $quantity,
            'adjustment' => $quantity,
            default => $quantityBefore,
        };

        $transaction = static::create([
            'material_id' => $materialId,
            'type' => $type,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'quantity_in' => $type === 'in' ? $quantity : 0,
            'quantity_out' => $type === 'out' ? $quantity : 0,
            'quantity_adjustment' => $type === 'adjustment' ? $quantity : 0,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost * $quantity,
            'notes' => $notes,
        ]);

        // Update material stock
        $material->update([
            'current_stock' => $quantityAfter,
            'last_purchase_date' => $type === 'in' ? now() : $material->last_purchase_date,
        ]);

        return $transaction;
    }
}
