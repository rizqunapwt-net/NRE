<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookCitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id', 'doi', 'publisher_name', 'edition',
        'publication_year', 'city', 'country',
        'keywords', 'abstract', 'subject_area',
    ];

    protected function casts(): array
    {
        return [
            'keywords'         => 'array',
            'publication_year' => 'integer',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Publisher name dengan fallback ke default.
     */
    public function getEffectivePublisherName(): string
    {
        return $this->publisher_name ?? 'Penerbit Rizquna Elfath';
    }

    /**
     * City dengan fallback ke default.
     */
    public function getEffectiveCity(): string
    {
        return $this->city ?? 'Jakarta';
    }
}
