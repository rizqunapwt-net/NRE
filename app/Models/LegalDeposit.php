<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class LegalDeposit extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_id',
        'tracking_number',
        'status',
        'submission_date',
        'received_at',
        'receipt_path',
        'certificate_number',
        'institution',
        'copies_submitted',
        'notes',
        'submitted_by',
    ];

    protected $casts = [
        'copies_submitted' => 'integer',
        'submission_date' => 'date',
        'received_at' => 'date',
        'status' => 'string',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Pending',
            'submitted' => 'Submitted',
            'received' => 'Received',
            'rejected' => 'Rejected',
            default => ucfirst($this->status),
        };
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function isReceived(): bool
    {
        return $this->status === 'received';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
