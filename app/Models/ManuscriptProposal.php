<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ManuscriptProposal extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'author_id',
        'title',
        'subtitle',
        'synopsis',
        'target_audience',
        'unique_selling_points',
        'table_of_contents',
        'estimated_pages',
        'genre',
        'manuscript_file_path',
        'status',
        'editorial_notes',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'created_by',
    ];

    protected $casts = [
        'table_of_contents' => 'array',
        'estimated_pages' => 'integer',
        'reviewed_at' => 'datetime',
        'status' => 'string',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $proposal) {
            if ($proposal->created_by === null && auth()->check()) {
                $proposal->created_by = auth()->id();
            }
        });
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'submitted' => 'Submitted',
            'under_review' => 'Under Review',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'revised' => 'Needs Revision',
            default => ucfirst($this->status),
        };
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function book(): HasOne
    {
        return $this->hasOne(Book::class, 'manuscript_proposal_id');
    }

    public function editorialAssignments(): HasMany
    {
        return $this->hasMany(EditorialAssignment::class);
    }

    public function manuscriptVersions(): HasMany
    {
        return $this->hasMany(ManuscriptVersion::class);
    }

    public function editorialStages(): HasMany
    {
        return $this->hasMany(EditorialStage::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
