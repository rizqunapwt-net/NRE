<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookPreview extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'preview_pdf_path',
        'preview_pages',
        'allow_preview',
    ];

    protected function casts(): array
    {
        return [
            'allow_preview' => 'boolean',
            'preview_pages' => 'integer',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
