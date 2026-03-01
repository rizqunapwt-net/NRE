<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EditorialStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'manuscript_proposal_id',
        'stage_name',
        'status',
        'sort_order',
        'started_at',
        'completed_at',
        'duration_days',
        'notes',
        'completed_by',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'duration_days' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'status' => 'string',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function manuscriptProposal(): BelongsTo
    {
        return $this->belongsTo(ManuscriptProposal::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }
}
