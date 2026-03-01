<?php

namespace App\Models;

use App\Enums\PublishingRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublishingRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'author_id',
        'title',
        'synopsis',
        'genre',
        'manuscript_path',
        'status',
        'editor_notes',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    // ─── Relationships ───

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function statusHistories(): MorphMany
    {
        return $this->morphMany(StatusHistory::class, 'trackable');
    }

    // ─── State Machine ───

    /**
     * Transition to a new status with validation.
     */
    public function transitionTo(string $newStatusValue, ?int $changedBy = null, ?string $notes = null): self
    {
        $currentStatus = PublishingRequestStatus::from($this->status);
        $newStatus = PublishingRequestStatus::from($newStatusValue);

        if (! $currentStatus->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Tidak dapat mengubah status dari '{$currentStatus->label()}' ke '{$newStatus->label()}'."
            );
        }

        $this->statusHistories()->create([
            'from_status' => $this->status,
            'to_status' => $newStatusValue,
            'notes' => $notes,
            'changed_by' => $changedBy ?? auth()->id(),
            'changed_at' => now(),
        ]);

        $this->update(['status' => $newStatusValue]);

        return $this->fresh();
    }
}
