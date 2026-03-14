<?php

namespace App\Models;

use App\Enums\BookStatus;
use App\Enums\PrintingBookStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Book extends Model
{
    /** @use HasFactory<\Database\Factories\BookFactory> */
    use HasFactory;

    use LogsActivity;

    protected $appends = ['cover_url'];

    protected $fillable = [
        'type', // 'publishing' or 'printing'
        'tracking_code',
        'author_id',
        'manuscript_proposal_id',
        'title',
        'subtitle',
        'isbn',
        'description',
        'abstract',
        'full_text',
        'publisher',
        'publisher_city',
        'year',
        'edition',
        'price',
        'stock',
        'cover_path',
        'cover_file_path',
        'status',
        'editorial_status',
        'gdrive_link',
        'surat_scan_path',
        'surat_status',
        'revision_notes',
        'page_count',
        'size',
        'published_year',
        // Phase 1 — Digital Library fields
        'pdf_full_path',
        'pdf_preview_path',
        'file_path',
        'total_pdf_pages',
        'bibliography_start_page',
        'pdf_metadata',
        'is_parsed',
        'parsed_at',
        'slug',
        'is_digital',
        'is_published',
        'published_at',
        // Phase 2 — additional fields
        'original_price',
        'language',
        'dimension',
        'category_id',
        // Phase 3-6 — Import tracking
        'import_batch_id',
        'import_source',
        'file_checksum',
        'import_error',
        // Google Drive integration
        'google_drive_cover_id',
        'google_drive_cover_url',
        'google_drive_pdf_id',
        'google_drive_pdf_url',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $book) {
            if (empty($book->tracking_code)) {
                $book->tracking_code = 'NRE-' . strtoupper(Str::random(8));
            }
            if (empty($book->slug) && ! empty($book->title)) {
                $book->slug = static::generateUniqueSlug($book->title);
            }
        });

        // Jika judul berubah dan slug tidak diubah manual, regenerate slug
        static::updating(function (self $book) {
            if ($book->isDirty('title') && ! $book->isDirty('slug')) {
                $book->slug = static::generateUniqueSlug($book->title, $book->id);
            }
        });

        // Auto-sync to Google Drive when cover or PDF changes (if enabled)
        static::saved(function (self $book) {
            if (config('google.drive.books_root_folder_id') && $book->is_published) {
                // Queue sync job instead of syncing immediately
                // This prevents blocking the main request
                // SyncBooksToGoogleDrive::dispatch($book);
            }
        });
    }

    /**
     * Generate slug unik secara deterministik: judul, judul-2, judul-3, ...
     * Thread-safe untuk penggunaan normal (bukan bulk import concurrent).
     */
    private static function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $base    = Str::slug($title) ?: 'buku';
        $slug    = $base;
        $counter = 1;

        $query = static::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $counter++;
            $slug  = $base . '-' . $counter;
            $query = static::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }

        return $slug;
    }

    public function isPrinting(): bool
    {
        return $this->type === 'printing';
    }

    public function isPublishing(): bool
    {
        return $this->type === 'publishing';
    }

    public function scopePublishing(Builder $query): Builder
    {
        return $query->where('type', 'publishing');
    }

    public function scopePrinting(Builder $query): Builder
    {
        return $query->where('type', 'printing');
    }

    public function getProgressPercentage(): int
    {
        if ($this->isPrinting()) {
            return $this->getPrintingProgress();
        }

        return match ($this->status) {
            BookStatus::DRAFT => 0,
            BookStatus::INCOMING => 10,
            BookStatus::REVIEW => 20,
            BookStatus::EDITORIAL => 35,
            BookStatus::COVERING => 50,
            BookStatus::APPROVING => 60,
            BookStatus::SURAT_PERNYATAAN => 70,
            BookStatus::IS_ISBN_PROCESS => 80,
            BookStatus::PRODUCTION => 90,
            BookStatus::WAREHOUSE, BookStatus::PUBLISHED => 100,
            BookStatus::REVISION => 15,
            default => 0,
        };
    }

    private function getPrintingProgress(): int
    {
        $statusValue = $this->status instanceof PrintingBookStatus
            ? $this->status->value
            : ($this->status instanceof BookStatus ? $this->status->value : $this->status);

        return match ($statusValue) {
            'draft' => 0,
            'incoming' => 15,
            'review' => 30,
            'editorial' => 50,
            'covering' => 65,
            'production' => 85,
            'done' => 100,
            'revision' => 15,
            default => 0,
        };
    }

    /**
     * Get allowed status transitions based on book type.
     */
    public function getAllowedTransitions(): array
    {
        $statusValue = $this->status instanceof \BackedEnum
            ? $this->status->value
            : $this->status;

        if ($this->isPrinting()) {
            $printStatus = PrintingBookStatus::tryFrom($statusValue);
            if ($printStatus) {
                return array_map(fn ($s) => ['value' => $s->value, 'label' => $s->getLabel()], $printStatus->allowedTransitions());
            }

            return [];
        }

        if ($this->status instanceof BookStatus) {
            return array_map(fn ($s) => ['value' => $s->value, 'label' => $s->getLabel()], $this->status->allowedTransitions());
        }

        $bookStatus = BookStatus::tryFrom($statusValue);
        if ($bookStatus) {
            return array_map(fn ($s) => ['value' => $s->value, 'label' => $s->getLabel()], $bookStatus->allowedTransitions());
        }

        return [];
    }

    protected function casts(): array
    {
        return [
            'price'          => 'decimal:2',
            'original_price' => 'decimal:2',
            'stock'          => 'integer',
            'is_digital'     => 'boolean',
            'is_published'   => 'boolean',
            'published_at'   => 'datetime',
            'year'           => 'integer',
            'total_pdf_pages' => 'integer',
            'bibliography_start_page' => 'integer',
            'pdf_metadata'   => 'array',
            'is_parsed'      => 'boolean',
            'parsed_at'      => 'datetime',
        ];
    }

    public function getCoverUrlAttribute(): ?string
    {
        $path = $this->cover_path ?: $this->cover_file_path;
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return asset('storage/' . $path);
    }

    public function getStatusAttribute(mixed $value): BookStatus|PrintingBookStatus|string|null
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof BookStatus || $value instanceof PrintingBookStatus) {
            return $value;
        }

        if (($this->attributes['type'] ?? null) === 'printing') {
            return PrintingBookStatus::tryFrom($value) ?? $value;
        }

        return BookStatus::tryFrom($value) ?? $value;
    }

    public function getStatusLabel(): string
    {
        $status = $this->status;
        if ($status instanceof \BackedEnum) {
            return $status->getLabel();
        }

        return $status ?? '-';
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function printOrders(): HasMany
    {
        return $this->hasMany(PrintOrder::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(BookFile::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(BookStatusLog::class);
    }

    // Editorial Workflow Relations
    public function manuscriptProposal(): BelongsTo
    {
        return $this->belongsTo(ManuscriptProposal::class, 'manuscript_proposal_id');
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

    public function isbnRequest(): HasOne
    {
        return $this->hasOne(IsbnRequest::class);
    }

    public function legalDeposit(): HasOne
    {
        return $this->hasOne(LegalDeposit::class);
    }

    // Phase 1 + 2 — Digital Library Relations

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function preview(): HasOne
    {
        return $this->hasOne(BookPreview::class);
    }

    public function citation(): HasOne
    {
        return $this->hasOne(BookCitation::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(BookPurchase::class);
    }

    public function access(): HasMany
    {
        return $this->hasMany(BookAccess::class);
    }

    public function references(): HasMany
    {
        return $this->hasMany(BookReference::class)->orderBy('order_number');
    }

    public function marketplaceListings(): HasMany
    {
        return $this->hasMany(MarketplaceListing::class, 'ebook_id');
    }

    // ─── Digital Library Scopes ───

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeDigital(Builder $query): Builder
    {
        return $query->where('is_digital', true);
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);
        if (mb_strlen($term) < 2) {
            return $query;
        }

        $driver = config('database.default');

        return $query->where(function (Builder $q) use ($driver, $term): void {
            if ($driver === 'pgsql') {
                $q->whereRaw(
                    "to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(subtitle, '') || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(full_text, ''))
                     @@ plainto_tsquery('simple', ?)",
                    [$term]
                )
                ->orWhereRaw('COALESCE(isbn::text, \'\') ILIKE ?', ["%{$term}%"])
                ->orWhereRaw('COALESCE(publisher, \'\') ILIKE ?', ["%{$term}%"])
                ->orWhereRaw('COALESCE(year::text, \'\') ILIKE ?', ["%{$term}%"])
                ->orWhereHas('author', fn (Builder $aq) => $aq->whereRaw('COALESCE(name, \'\') ILIKE ?', ["%{$term}%"]));

                return;
            }

            $lower = mb_strtolower($term);
            $q->whereRaw('LOWER(title) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(COALESCE(subtitle, \'\')) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(COALESCE(abstract, \'\')) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(COALESCE(full_text, \'\')) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(COALESCE(isbn, \'\')) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(COALESCE(publisher, \'\')) LIKE ?', ["%{$lower}%"])
                ->orWhereRaw('LOWER(CAST(COALESCE(year, \'\') AS CHAR)) LIKE ?', ["%{$lower}%"])
                ->orWhereHas('author', fn (Builder $aq) => $aq->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"]));
        });
    }

    // ─── Digital Library Helpers ───

    /**
     * Cek apakah user memiliki akses aktif ke buku ini.
     * Gunakan eager load 'access' untuk menghindari N+1 di list view.
     */
    public function hasAccessFor(int $userId): bool
    {
        return $this->access()
            ->forUser($userId)
            ->active()
            ->exists();
    }

    /**
     * Return daftar author sebagai array string.
     * Sistem existing memakai author_id tunggal dengan fallback metadata PDF.
     *
     * @return array<int,string>
     */
    public function authorsArray(): array
    {
        $authors = [];

        $primaryAuthor = trim((string) ($this->author?->name ?? ''));
        if ($primaryAuthor !== '') {
            $authors[] = $primaryAuthor;
        }

        $metadataAuthors = data_get($this->pdf_metadata, 'authors', []);
        if (is_array($metadataAuthors)) {
            foreach ($metadataAuthors as $author) {
                $author = trim((string) $author);
                if ($author !== '') {
                    $authors[] = $author;
                }
            }
        }

        return array_values(array_unique($authors));
    }

    public function fullTitle(): string
    {
        return trim(implode(': ', array_filter([$this->title, $this->subtitle])));
    }

    public function shortAuthors(int $max = 2): string
    {
        $authors = $this->authorsArray();
        if ($authors === []) {
            return 'Unknown Author';
        }

        if (count($authors) <= $max) {
            return implode(', ', $authors);
        }

        return implode(', ', array_slice($authors, 0, $max)) . ', et al.';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty();
    }
}
