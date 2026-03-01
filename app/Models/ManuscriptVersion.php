<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManuscriptVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'manuscript_proposal_id',
        'version_number',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'change_log',
        'is_current',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_current' => 'boolean',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function manuscriptProposal(): BelongsTo
    {
        return $this->belongsTo(ManuscriptProposal::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public static function getCurrentVersion($bookId = null, $proposalId = null): ?self
    {
        if ($bookId) {
            return static::where('book_id', $bookId)
                ->where('is_current', true)
                ->first();
        }

        if ($proposalId) {
            return static::where('manuscript_proposal_id', $proposalId)
                ->where('is_current', true)
                ->first();
        }

        return null;
    }
}
