<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EditorialAssignment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_id',
        'manuscript_proposal_id',
        'editor_id',
        'proofreader_id',
        'designer_id',
        'stage',
        'status',
        'deadline',
        'started_at',
        'completed_at',
        'feedback',
        'revision_notes',
        'assigned_by',
    ];

    protected $casts = [
        'deadline' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'status' => 'string',
    ];

    public function getStageLabelAttribute(): string
    {
        return match ($this->stage) {
            'editing' => 'Editing',
            'proofreading' => 'Proofreading',
            'typesetting' => 'Typesetting',
            'cover_design' => 'Cover Design',
            default => ucfirst(str_replace('_', ' ', $this->stage)),
        };
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function manuscriptProposal(): BelongsTo
    {
        return $this->belongsTo(ManuscriptProposal::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'editor_id');
    }

    public function proofreader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proofreader_id');
    }

    public function designer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'designer_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
