<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ProductionSchedule extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'schedule_number',
        'order_id',
        'production_job_id',
        'planned_start',
        'planned_end',
        'actual_start',
        'actual_end',
        'status',
        'priority',
        'is_rush',
        'operator_id',
        'supervisor_id',
        'notes',
        'delay_reason',
    ];

    protected $casts = [
        'planned_start' => 'date',
        'planned_end' => 'date',
        'actual_start' => 'date',
        'actual_end' => 'date',
        'is_rush' => 'boolean',
        'status' => 'string',
        'priority' => 'string',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($schedule) {
            if (empty($schedule->schedule_number)) {
                $schedule->schedule_number = 'SCH-'.date('Ymd').'-'.strtoupper(\Illuminate\Support\Str::random(6));
            }
        });
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'planned' => 'Planned',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'delayed' => 'Delayed',
            'cancelled' => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    public function getPriorityLabelAttribute(): string
    {
        return match ($this->priority) {
            'low' => 'Low',
            'normal' => 'Normal',
            'high' => 'High',
            'urgent' => 'Urgent',
            default => ucfirst($this->priority),
        };
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Percetakan\Order::class, 'order_id');
    }

    public function productionJob(): BelongsTo
    {
        return $this->belongsTo(Percetakan\ProductionJob::class, 'production_job_id');
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isDelayed(): bool
    {
        return $this->status === 'delayed';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
