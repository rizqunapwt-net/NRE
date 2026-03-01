<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MachineMaintenance extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'machine_id',
        'type',
        'title',
        'description',
        'scheduled_date',
        'completed_date',
        'status',
        'cost',
        'vendor_name',
        'vendor_contact',
        'work_performed',
        'parts_replaced',
        'downtime_hours',
        'performed_by',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'cost' => 'decimal:2',
        'downtime_hours' => 'integer',
        'status' => 'string',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'scheduled' => 'Scheduled',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'preventive' => 'Preventive Maintenance',
            'corrective' => 'Corrective Maintenance',
            'emergency' => 'Emergency Maintenance',
            default => ucfirst($this->type),
        };
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Percetakan\Machine::class, 'machine_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
