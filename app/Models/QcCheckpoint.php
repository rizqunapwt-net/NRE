<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class QcCheckpoint extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'order_id',
        'production_job_id',
        'stage',
        'checkpoint_name',
        'status',
        'inspected_by',
        'inspected_at',
        'quantity_checked',
        'quantity_passed',
        'quantity_failed',
        'checklist',
        'defects_found',
        'corrective_action',
        'requires_rework',
        'notes',
    ];

    protected $casts = [
        'inspected_at' => 'datetime',
        'quantity_checked' => 'integer',
        'quantity_passed' => 'integer',
        'quantity_failed' => 'integer',
        'checklist' => 'array',
        'requires_rework' => 'boolean',
        'status' => 'string',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Pending',
            'passed' => 'Passed',
            'failed' => 'Failed',
            'skipped' => 'Skipped',
            default => ucfirst($this->status),
        };
    }

    public function getPassRateAttribute(): ?float
    {
        if ($this->quantity_checked && $this->quantity_checked > 0) {
            return round(($this->quantity_passed / $this->quantity_checked) * 100, 2);
        }

        return null;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Percetakan\Order::class, 'order_id');
    }

    public function productionJob(): BelongsTo
    {
        return $this->belongsTo(Percetakan\ProductionJob::class, 'production_job_id');
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    public function isPassed(): bool
    {
        return $this->status === 'passed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
