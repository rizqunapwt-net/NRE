<?php

namespace App\Models\Percetakan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Machine extends Model
{
    use HasFactory;

    protected $table = 'percetakan_machines';

    protected $fillable = [
        'code',
        'name',
        'type',
        'brand',
        'model',
        'capacity_per_hour',
        'status',
        'purchase_date',
        'purchase_price',
        'warranty_months',
        'last_maintenance',
        'next_maintenance',
        'total_operating_hours',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
        'total_operating_hours' => 'decimal:2',
        'is_active' => 'boolean',
        'capacity_per_hour' => 'integer',
    ];
}
