<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'raw_text',
        'order_number',
        'authors',
        'year',
        'title',
        'source',
        'volume',
        'issue',
        'pages',
        'publisher',
        'publisher_city',
        'doi',
        'url',
        'isbn',
        'ref_type',
        'parse_quality',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'order_number' => 'integer',
            'parse_quality' => 'decimal:2',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}

