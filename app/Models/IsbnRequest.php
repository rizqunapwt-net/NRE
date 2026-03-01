<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class IsbnRequest extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_id',
        'isbn_number',
        'isbn_10',
        'barcode_path',
        'status',
        'publisher_name',
        'book_title',
        'author_name',
        'price',
        'binding_type',
        'page_count',
        'size',
        'requested_at',
        'approved_at',
        'received_at',
        'notes',
        'requested_by',
    ];

    protected $casts = [
        'price' => 'integer',
        'page_count' => 'integer',
        'requested_at' => 'date',
        'approved_at' => 'date',
        'received_at' => 'date',
        'status' => 'string',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Pending',
            'submitted' => 'Submitted',
            'approved' => 'Approved',
            'received' => 'Received',
            'rejected' => 'Rejected',
            default => ucfirst($this->status),
        };
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
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
