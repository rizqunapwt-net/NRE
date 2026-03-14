<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoyaltyStatus;
use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\ManuscriptProposal;
use App\Models\ManuscriptVersion;
use App\Models\Payment;
use App\Models\RoyaltyCalculation;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use stdClass;

class AuthorPortalApiController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $manuscripts = ManuscriptProposal::with('book')
            ->where('author_id', $author->id)
            ->get();

        $manuscriptSummary = [
            'draft' => $manuscripts->filter(fn (ManuscriptProposal $manuscript): bool => $this->normalizedManuscriptStatus($manuscript) === 'draft')->count(),
            'submitted' => $manuscripts->filter(fn (ManuscriptProposal $manuscript): bool => $this->normalizedManuscriptStatus($manuscript) === 'submitted')->count(),
            'approved' => $manuscripts->filter(fn (ManuscriptProposal $manuscript): bool => $this->normalizedManuscriptStatus($manuscript) === 'approved')->count(),
            'published' => $manuscripts->filter(fn (ManuscriptProposal $manuscript): bool => $this->normalizedManuscriptStatus($manuscript) === 'published')->count(),
        ];

        $currentMonth = now()->format('Y-m');
        $currentYear = now()->format('Y');

        $royalties = RoyaltyCalculation::query()->where('author_id', $author->id);

        $publishedBooks = Book::query()
            ->with(['category'])
            ->where('author_id', $author->id)
            ->where(function (Builder $query): void {
                $query->where('is_published', true)
                    ->orWhere('status', 'published');
            })
            ->orderByDesc('published_at')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn (Book $book): array => $this->serializeBookSummary($book))
            ->values();

        $recentSales = Sale::query()
            ->with(['book'])
            ->whereHas('book', fn (Builder $query) => $query->where('author_id', $author->id))
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Sale $sale): array {
                return [
                    'type' => 'sale',
                    'reference' => $sale->transaction_id,
                    'title' => $sale->book?->title,
                    'status' => $this->enumValue($sale->status),
                    'period_month' => $sale->period_month,
                    'amount' => round($sale->quantity * (float) $sale->net_price, 2),
                    'quantity' => $sale->quantity,
                    'happened_at' => $sale->created_at?->toIso8601String(),
                ];
            });

        $recentPayments = Payment::query()
            ->with(['calculation'])
            ->whereHas('calculation', fn (Builder $query) => $query->where('author_id', $author->id))
            ->orderByDesc('paid_at')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (Payment $payment): array {
                return [
                    'type' => 'royalty_payment',
                    'reference' => $payment->invoice_number,
                    'title' => 'Royalty ' . $payment->calculation?->period_month,
                    'status' => $this->enumValue($payment->status),
                    'period_month' => $payment->calculation?->period_month,
                    'amount' => (float) $payment->amount,
                    'quantity' => null,
                    'happened_at' => $payment->paid_at?->toIso8601String() ?? $payment->created_at?->toIso8601String(),
                ];
            });

        $recentTransactions = $recentSales
            ->concat($recentPayments)
            ->sortByDesc('happened_at')
            ->take(5)
            ->values();

        return $this->successResponse('Author dashboard retrieved successfully.', [
            'manuscripts' => $manuscriptSummary,
            'royalties' => [
                'this_month' => (float) (clone $royalties)->where('period_month', $currentMonth)->sum('total_amount'),
                'this_year' => (float) (clone $royalties)->where('period_month', 'like', "{$currentYear}-%")->sum('total_amount'),
            ],
            'published_books' => $publishedBooks,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    public function manuscripts(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        [$validated, $validationError] = $this->validateRequest($request, [
            'status' => ['nullable', Rule::in(['draft', 'submitted', 'approved', 'published', 'deleted'])],
            'search' => ['nullable', 'string', 'max:255'],
            'sort_by' => ['nullable', Rule::in(['created_at', 'updated_at', 'status'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if ($validationError) {
            return $validationError;
        }

        $query = ManuscriptProposal::query()
            ->with(['book.category', 'manuscriptVersions' => fn ($versionQuery) => $versionQuery->orderByDesc('version_number')])
            ->where('author_id', $author->id);

        if (! empty($validated['status'])) {
            $this->applyManuscriptStatusFilter($query, $validated['status']);
        }

        if (! empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where('title', 'like', "%{$search}%");
        }

        $this->applyManuscriptSorting(
            $query,
            $validated['sort_by'] ?? 'created_at',
            $validated['sort_direction'] ?? 'desc'
        );

        $manuscripts = $query->paginate((int) ($validated['per_page'] ?? 15));

        return $this->successResponse('Author manuscripts retrieved successfully.', [
            'items' => collect($manuscripts->items())
                ->map(fn (ManuscriptProposal $manuscript): array => $this->serializeManuscript($manuscript))
                ->values(),
            'pagination' => $this->serializePagination($manuscripts),
            'filters' => [
                'status' => $validated['status'] ?? null,
                'search' => $validated['search'] ?? null,
                'sort_by' => $validated['sort_by'] ?? 'created_at',
                'sort_direction' => $validated['sort_direction'] ?? 'desc',
            ],
        ]);
    }

    public function storeManuscript(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        [$validated, $validationError] = $this->validateRequest($request, [
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('manuscript_proposals', 'title')->where(
                    fn ($query) => $query
                        ->where('author_id', $author->id)
                        ->where('status', '!=', 'deleted')
                ),
            ],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:51200'],
        ]);

        if ($validationError) {
            return $validationError;
        }

        /** @var UploadedFile $file */
        $file = $request->file('file');
        $storedPath = $this->storeManuscriptFile($file, $author->id);

        try {
            DB::beginTransaction();

            $manuscript = ManuscriptProposal::create([
                'author_id' => $author->id,
                'title' => $validated['title'],
                'synopsis' => $validated['description'],
                'genre' => $validated['category'],
                'manuscript_file_path' => $storedPath,
                'status' => 'draft',
            ]);

            $this->recordManuscriptStatusHistory($manuscript, null, 'draft', 'Manuscript created by author.');
            $this->storeManuscriptVersion($manuscript, $file, $storedPath, 'Initial upload');

            DB::commit();
        } catch (\Throwable $throwable) {
            DB::rollBack();
            Storage::disk('local')->delete($storedPath);

            throw $throwable;
        }

        $manuscript->load(['book.category', 'manuscriptVersions']);

        return $this->successResponse('Manuscript created successfully.', [
            'manuscript' => $this->serializeManuscript($manuscript, true),
            'timeline' => $this->buildManuscriptTimeline($manuscript->loadMissing([
                'statusHistories.changedByUser',
                'manuscriptVersions.uploader',
                'editorialStages.completedBy',
            ])),
        ], 201);
    }

    public function showManuscript(Request $request, int $id): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $manuscript = ManuscriptProposal::query()
            ->with([
                'book.category',
                'statusHistories.changedByUser',
                'manuscriptVersions' => fn ($query) => $query->with('uploader')->orderByDesc('version_number'),
                'editorialStages.completedBy',
                'reviewer',
            ])
            ->where('author_id', $author->id)
            ->find($id);

        if (! $manuscript) {
            return $this->errorResponse('Manuscript not found.', [], 404);
        }

        return $this->successResponse('Manuscript detail retrieved successfully.', [
            'manuscript' => $this->serializeManuscript($manuscript, true),
            'timeline' => $this->buildManuscriptTimeline($manuscript),
        ]);
    }

    public function updateManuscript(Request $request, int $id): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $manuscript = ManuscriptProposal::query()
            ->with(['book', 'manuscriptVersions'])
            ->where('author_id', $author->id)
            ->find($id);

        if (! $manuscript) {
            return $this->errorResponse('Manuscript not found.', [], 404);
        }

        $normalizedStatus = $this->normalizedManuscriptStatus($manuscript);
        if (in_array($normalizedStatus, ['published', 'deleted'], true)) {
            return $this->errorResponse('This manuscript can no longer be updated.', [], 422);
        }

        [$validated, $validationError] = $this->validateRequest($request, [
            'title' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('manuscript_proposals', 'title')->ignore($manuscript->id)->where(
                    fn ($query) => $query
                        ->where('author_id', $author->id)
                        ->where('status', '!=', 'deleted')
                ),
            ],
            'description' => ['sometimes', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'file' => ['sometimes', 'file', 'mimes:pdf,doc,docx', 'max:51200'],
        ]);

        if ($validationError) {
            return $validationError;
        }

        $newStoredPath = null;
        if ($request->hasFile('file')) {
            /** @var UploadedFile $uploadedFile */
            $uploadedFile = $request->file('file');
            $newStoredPath = $this->storeManuscriptFile($uploadedFile, $author->id);
        }

        try {
            DB::beginTransaction();

            $updates = [];

            if (array_key_exists('title', $validated)) {
                $updates['title'] = $validated['title'];
            }

            if (array_key_exists('description', $validated)) {
                $updates['synopsis'] = $validated['description'];
            }

            if (array_key_exists('category', $validated)) {
                $updates['genre'] = $validated['category'];
            }

            if ($newStoredPath !== null) {
                $updates['manuscript_file_path'] = $newStoredPath;
            }

            if ($updates !== []) {
                $manuscript->update($updates);
            }

            if ($newStoredPath !== null) {
                $this->storeManuscriptVersion(
                    $manuscript,
                    $request->file('file'),
                    $newStoredPath,
                    'Updated manuscript file'
                );
            }

            DB::commit();
        } catch (\Throwable $throwable) {
            DB::rollBack();

            if ($newStoredPath !== null) {
                Storage::disk('local')->delete($newStoredPath);
            }

            throw $throwable;
        }

        $manuscript->load([
            'book.category',
            'statusHistories.changedByUser',
            'manuscriptVersions' => fn ($query) => $query->with('uploader')->orderByDesc('version_number'),
            'editorialStages.completedBy',
            'reviewer',
        ]);

        return $this->successResponse('Manuscript updated successfully.', [
            'manuscript' => $this->serializeManuscript($manuscript, true),
            'timeline' => $this->buildManuscriptTimeline($manuscript),
        ]);
    }

    public function deleteManuscript(Request $request, int $id): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $manuscript = ManuscriptProposal::query()
            ->with('book')
            ->where('author_id', $author->id)
            ->find($id);

        if (! $manuscript) {
            return $this->errorResponse('Manuscript not found.', [], 404);
        }

        $normalizedStatus = $this->normalizedManuscriptStatus($manuscript);
        if ($normalizedStatus === 'published') {
            return $this->errorResponse('Published manuscripts cannot be deleted.', [], 422);
        }

        if ($manuscript->status === 'deleted') {
            return $this->errorResponse('Manuscript has already been deleted.', [], 422);
        }

        $previousStatus = $manuscript->status;

        $manuscript->update(['status' => 'deleted']);
        $this->recordManuscriptStatusHistory($manuscript, $previousStatus, 'deleted', 'Manuscript deleted by author.');

        return $this->successResponse('Manuscript deleted successfully.', [
            'manuscript' => $this->serializeManuscript($manuscript->fresh(['book.category', 'manuscriptVersions'])),
        ]);
    }

    public function royalties(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        [$validated, $validationError] = $this->validateRequest($request, [
            'status' => ['nullable', Rule::in(['pending', 'finalized', 'paid'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if ($validationError) {
            return $validationError;
        }

        $query = RoyaltyCalculation::query()
            ->with(['payment', 'items.book'])
            ->where('author_id', $author->id)
            ->orderByDesc('period_month')
            ->orderByDesc('created_at');

        if (! empty($validated['status'])) {
            $query->where('status', $this->mapRoyaltyFilterStatus($validated['status'])->value);
        }

        $allRows = (clone $query)->get();
        $royalties = $query->paginate((int) ($validated['per_page'] ?? 15));

        return $this->successResponse('Author royalties retrieved successfully.', [
            'items' => collect($royalties->items())
                ->map(fn (RoyaltyCalculation $royalty): array => $this->serializeRoyaltySummary($royalty))
                ->values(),
            'grouped' => $allRows
                ->groupBy('period_month')
                ->map(function (Collection $group, string $periodMonth): array {
                    return [
                        'period_month' => $periodMonth,
                        'year' => (int) substr($periodMonth, 0, 4),
                        'month' => (int) substr($periodMonth, 5, 2),
                        'royalties_count' => $group->count(),
                        'total_amount' => round($group->sum(fn (RoyaltyCalculation $royalty): float => (float) $royalty->total_amount), 2),
                        'statuses' => $group->countBy(fn (RoyaltyCalculation $royalty): string => $this->publicRoyaltyStatus($royalty))->all(),
                    ];
                })
                ->sortByDesc('period_month')
                ->values(),
            'pagination' => $this->serializePagination($royalties),
        ]);
    }

    public function showRoyalty(Request $request, int $id): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $royalty = RoyaltyCalculation::query()
            ->with(['payment', 'items.book.category', 'items.sale.marketplace'])
            ->where('author_id', $author->id)
            ->find($id);

        if (! $royalty) {
            return $this->errorResponse('Royalty record not found.', [], 404);
        }

        $breakdown = $royalty->items
            ->groupBy('book_id')
            ->map(function (Collection $items): array {
                $firstItem = $items->first();
                $book = $firstItem?->book;

                return [
                    'book' => $book ? $this->serializeBookSummary($book) : null,
                    'quantity' => (int) $items->sum('quantity'),
                    'net_sales' => round($items->sum(fn ($item): float => $item->quantity * (float) $item->net_price), 2),
                    'royalty_amount' => round($items->sum(fn ($item): float => (float) $item->amount), 2),
                    'items' => $items->map(function ($item): array {
                        return [
                            'royalty_item_id' => $item->id,
                            'sale_id' => $item->sale_id,
                            'transaction_id' => $item->sale?->transaction_id,
                            'marketplace' => $item->sale?->marketplace?->name,
                            'period_month' => $item->sale?->period_month,
                            'quantity' => $item->quantity,
                            'net_price' => (float) $item->net_price,
                            'royalty_percentage' => (float) $item->royalty_percentage,
                            'amount' => (float) $item->amount,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return $this->successResponse('Royalty detail retrieved successfully.', [
            'royalty' => $this->serializeRoyaltySummary($royalty),
            'payment' => $royalty->payment ? [
                'id' => $royalty->payment->id,
                'invoice_number' => $royalty->payment->invoice_number,
                'amount' => (float) $royalty->payment->amount,
                'status' => $this->enumValue($royalty->payment->status),
                'paid_at' => $royalty->payment->paid_at?->toIso8601String(),
                'payment_reference' => $royalty->payment->payment_reference,
            ] : null,
            'summary' => [
                'total_amount' => (float) $royalty->total_amount,
                'books_count' => $breakdown->count(),
                'items_count' => $royalty->items->count(),
                'total_quantity' => (int) $royalty->items->sum('quantity'),
            ],
            'breakdown' => $breakdown,
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $author->loadMissing('user');

        return $this->successResponse('Author profile retrieved successfully.', [
            'profile' => $this->serializeProfile($author),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $author = $this->resolveAuthor($request);
        if (! $author) {
            return $this->errorResponse('Author profile not found.', [], 404);
        }

        $author->loadMissing('user');
        $user = $author->user;

        [$validated, $validationError] = $this->validateRequest($request, [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('authors', 'email')->ignore($author->id), Rule::unique('users', 'email')->ignore($user?->id)],
            'bio' => ['sometimes', 'nullable', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'address' => ['sometimes', 'nullable', 'string'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'province' => ['sometimes', 'nullable', 'string', 'max:255'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'bank_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bank_account' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bank_account_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar' => ['sometimes', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($validationError) {
            return $validationError;
        }

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            /** @var UploadedFile $avatar */
            $avatar = $request->file('avatar');
            $avatarPath = $avatar->store("authors/{$author->id}/avatar", 'public');
        }

        try {
            DB::beginTransaction();

            $authorUpdates = [];
            foreach (['name', 'bio', 'phone', 'address', 'city', 'province', 'postal_code', 'bank_name', 'bank_account', 'bank_account_name'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $authorUpdates[$field] = $validated[$field];
                }
            }

            if (array_key_exists('email', $validated)) {
                $authorUpdates['email'] = $validated['email'];
            }

            if ($avatarPath !== null) {
                $authorUpdates['photo_path'] = $avatarPath;
            }

            if ($authorUpdates !== []) {
                $author->update($authorUpdates);
            }

            if ($user) {
                $userUpdates = [];

                if (array_key_exists('name', $validated)) {
                    $userUpdates['name'] = $validated['name'];
                }

                if (array_key_exists('phone', $validated)) {
                    $userUpdates['phone'] = $validated['phone'];
                }

                if (array_key_exists('address', $validated)) {
                    $userUpdates['address'] = $validated['address'];
                }

                if (array_key_exists('email', $validated)) {
                    $userUpdates['email'] = $validated['email'];
                }

                if ($avatarPath !== null) {
                    $userUpdates['avatar_url'] = Storage::disk('public')->url($avatarPath);
                }

                if ($userUpdates !== []) {
                    $emailChanged = array_key_exists('email', $validated) && $user->email !== $validated['email'];

                    $user->fill($userUpdates);

                    if ($emailChanged) {
                        $user->email_verified_at = null;
                    }

                    $user->save();
                }
            }

            $author->checkProfileCompleteness();

            DB::commit();
        } catch (\Throwable $throwable) {
            DB::rollBack();

            if ($avatarPath !== null) {
                Storage::disk('public')->delete($avatarPath);
            }

            throw $throwable;
        }

        return $this->successResponse('Author profile updated successfully.', [
            'profile' => $this->serializeProfile($author->fresh()->load('user')),
        ]);
    }

    private function resolveAuthor(Request $request): ?Author
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        if ($user->author_profile_id) {
            $author = Author::find($user->author_profile_id);
            if ($author) {
                return $author;
            }
        }

        $author = Author::where('user_id', $user->id)->first();
        if ($author) {
            return $author;
        }

        if ($user->email) {
            return Author::where('email', $user->email)->first();
        }

        return null;
    }

    private function normalizedManuscriptStatus(ManuscriptProposal $manuscript): string
    {
        if ($this->bookIsPublished($manuscript->relationLoaded('book') ? $manuscript->book : $manuscript->book()->first())) {
            return 'published';
        }

        return match ($manuscript->status) {
            'draft' => 'draft',
            'submitted', 'under_review', 'revised' => 'submitted',
            'accepted' => 'approved',
            'deleted' => 'deleted',
            default => (string) $manuscript->status,
        };
    }

    private function bookIsPublished(?Book $book): bool
    {
        if (! $book) {
            return false;
        }

        return (bool) $book->is_published || $this->enumValue($book->status) === 'published';
    }

    private function applyManuscriptStatusFilter(Builder $query, string $status): void
    {
        match ($status) {
            'draft' => $query->where('status', 'draft'),
            'submitted' => $query->whereIn('status', ['submitted', 'under_review', 'revised']),
            'approved' => $query->where('status', 'accepted')
                ->whereDoesntHave('book', function (Builder $bookQuery): void {
                    $bookQuery->where(function (Builder $publishedQuery): void {
                        $publishedQuery->where('is_published', true)
                            ->orWhere('status', 'published');
                    });
                }),
            'published' => $query->whereHas('book', function (Builder $bookQuery): void {
                $bookQuery->where(function (Builder $publishedQuery): void {
                    $publishedQuery->where('is_published', true)
                        ->orWhere('status', 'published');
                });
            }),
            'deleted' => $query->where('status', 'deleted'),
            default => null,
        };
    }

    private function applyManuscriptSorting(Builder $query, string $sortBy, string $direction): void
    {
        if ($sortBy === 'status') {
            $query->orderByRaw(
                "CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM books
                        WHERE books.manuscript_proposal_id = manuscript_proposals.id
                          AND (books.is_published = 1 OR books.status = 'published')
                    ) THEN 4
                    WHEN manuscript_proposals.status = 'draft' THEN 1
                    WHEN manuscript_proposals.status IN ('submitted', 'under_review', 'revised') THEN 2
                    WHEN manuscript_proposals.status = 'accepted' THEN 3
                    WHEN manuscript_proposals.status = 'deleted' THEN 5
                    ELSE 99
                END {$direction}"
            )->orderByDesc('updated_at');

            return;
        }

        $query->orderBy($sortBy, $direction);
    }

    private function serializeManuscript(ManuscriptProposal $manuscript, bool $detailed = false): array
    {
        $book = $manuscript->relationLoaded('book') ? $manuscript->book : $manuscript->book()->with('category')->first();
        $currentVersion = $this->currentManuscriptVersion($manuscript);

        $payload = [
            'id' => $manuscript->id,
            'title' => $manuscript->title,
            'description' => $manuscript->synopsis,
            'category' => $manuscript->genre,
            'status' => $this->normalizedManuscriptStatus($manuscript),
            'raw_status' => $manuscript->status,
            'status_label' => ucfirst($this->normalizedManuscriptStatus($manuscript)),
            'has_file' => ! empty($manuscript->manuscript_file_path),
            'current_file' => $currentVersion ? [
                'name' => $currentVersion->file_name,
                'type' => $currentVersion->file_type,
                'size' => $currentVersion->file_size,
                'uploaded_at' => $currentVersion->created_at?->toIso8601String(),
            ] : null,
            'published_book' => $book ? $this->serializeBookSummary($book) : null,
            'created_at' => $manuscript->created_at?->toIso8601String(),
            'updated_at' => $manuscript->updated_at?->toIso8601String(),
        ];

        if (! $detailed) {
            return $payload;
        }

        $payload['editorial_notes'] = $manuscript->editorial_notes;
        $payload['rejection_reason'] = $manuscript->rejection_reason;
        $payload['reviewed_at'] = $manuscript->reviewed_at?->toIso8601String();
        $payload['reviewer'] = $manuscript->relationLoaded('reviewer') && $manuscript->reviewer ? [
            'id' => $manuscript->reviewer->id,
            'name' => $manuscript->reviewer->name,
            'email' => $manuscript->reviewer->email,
        ] : null;
        $payload['versions'] = $manuscript->relationLoaded('manuscriptVersions')
            ? $manuscript->manuscriptVersions->map(function (ManuscriptVersion $version): array {
                return [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'file_name' => $version->file_name,
                    'file_type' => $version->file_type,
                    'file_size' => $version->file_size,
                    'change_log' => $version->change_log,
                    'is_current' => (bool) $version->is_current,
                    'uploaded_at' => $version->created_at?->toIso8601String(),
                ];
            })->values() : [];
        $payload['editorial_stages'] = $manuscript->relationLoaded('editorialStages')
            ? $manuscript->editorialStages->map(function ($stage): array {
                return [
                    'id' => $stage->id,
                    'stage_name' => $stage->stage_name,
                    'status' => $stage->status,
                    'started_at' => $stage->started_at?->toIso8601String(),
                    'completed_at' => $stage->completed_at?->toIso8601String(),
                    'notes' => $stage->notes,
                ];
            })->values() : [];

        return $payload;
    }

    private function currentManuscriptVersion(ManuscriptProposal $manuscript): ?ManuscriptVersion
    {
        if ($manuscript->relationLoaded('manuscriptVersions')) {
            return $manuscript->manuscriptVersions->firstWhere('is_current', true)
                ?? $manuscript->manuscriptVersions->sortByDesc('version_number')->first();
        }

        return $manuscript->manuscriptVersions()
            ->where('is_current', true)
            ->orderByDesc('version_number')
            ->first();
    }

    private function buildManuscriptTimeline(ManuscriptProposal $manuscript): Collection
    {
        $events = collect();

        if ($manuscript->relationLoaded('statusHistories')) {
            $events = $events->merge(
                $manuscript->statusHistories->map(function ($history): array {
                    return [
                        'type' => 'status',
                        'title' => 'Status changed to ' . ucfirst((string) $history->to_status),
                        'from_status' => $history->from_status,
                        'to_status' => $history->to_status,
                        'notes' => $history->notes,
                        'actor' => $history->changedByUser?->name,
                        'occurred_at' => $history->changed_at?->toIso8601String(),
                    ];
                })
            );
        }

        if ($manuscript->relationLoaded('manuscriptVersions')) {
            $events = $events->merge(
                $manuscript->manuscriptVersions->map(function (ManuscriptVersion $version): array {
                    return [
                        'type' => 'version',
                        'title' => 'Uploaded manuscript version ' . $version->version_number,
                        'from_status' => null,
                        'to_status' => null,
                        'notes' => $version->change_log,
                        'actor' => $version->uploader?->name,
                        'occurred_at' => $version->created_at?->toIso8601String(),
                    ];
                })
            );
        }

        if ($manuscript->relationLoaded('editorialStages')) {
            $events = $events->merge(
                $manuscript->editorialStages->map(function ($stage): array {
                    return [
                        'type' => 'editorial_stage',
                        'title' => $stage->stage_name,
                        'from_status' => null,
                        'to_status' => $stage->status,
                        'notes' => $stage->notes,
                        'actor' => $stage->completedBy?->name,
                        'occurred_at' => $stage->completed_at?->toIso8601String() ?? $stage->started_at?->toIso8601String(),
                    ];
                })
            );
        }

        if ($events->isEmpty()) {
            $events->push([
                'type' => 'created',
                'title' => 'Manuscript created',
                'from_status' => null,
                'to_status' => $manuscript->status,
                'notes' => null,
                'actor' => null,
                'occurred_at' => $manuscript->created_at?->toIso8601String(),
            ]);
        }

        return $events->sortByDesc('occurred_at')->values();
    }

    private function serializeBookSummary(Book $book): array
    {
        return [
            'id' => $book->id,
            'title' => $book->title,
            'slug' => $book->slug,
            'status' => $this->enumValue($book->status),
            'is_published' => (bool) $book->is_published || $this->enumValue($book->status) === 'published',
            'category' => $book->relationLoaded('category') ? $book->category?->name : null,
            'cover_url' => $book->cover_url,
            'published_at' => $book->published_at?->toIso8601String(),
        ];
    }

    private function serializeRoyaltySummary(RoyaltyCalculation $royalty): array
    {
        return [
            'id' => $royalty->id,
            'period_month' => $royalty->period_month,
            'year' => (int) substr($royalty->period_month, 0, 4),
            'month' => (int) substr($royalty->period_month, 5, 2),
            'status' => $this->publicRoyaltyStatus($royalty),
            'raw_status' => $this->enumValue($royalty->status),
            'total_amount' => (float) $royalty->total_amount,
            'items_count' => $royalty->relationLoaded('items') ? $royalty->items->count() : $royalty->items()->count(),
            'payment' => $royalty->payment ? [
                'id' => $royalty->payment->id,
                'invoice_number' => $royalty->payment->invoice_number,
                'amount' => (float) $royalty->payment->amount,
                'status' => $this->enumValue($royalty->payment->status),
                'paid_at' => $royalty->payment->paid_at?->toIso8601String(),
            ] : null,
            'created_at' => $royalty->created_at?->toIso8601String(),
            'updated_at' => $royalty->updated_at?->toIso8601String(),
        ];
    }

    private function publicRoyaltyStatus(RoyaltyCalculation $royalty): string
    {
        return match ($this->enumValue($royalty->status)) {
            'draft' => 'pending',
            default => $this->enumValue($royalty->status),
        };
    }

    private function mapRoyaltyFilterStatus(string $status): RoyaltyStatus
    {
        return match ($status) {
            'pending' => RoyaltyStatus::Draft,
            'finalized' => RoyaltyStatus::Finalized,
            'paid' => RoyaltyStatus::Paid,
        };
    }

    private function serializeProfile(Author $author): array
    {
        $author->loadMissing('user');

        return [
            'author_id' => $author->id,
            'name' => $author->name,
            'pen_name' => $author->pen_name,
            'email' => $author->user?->email ?? $author->email,
            'bio' => $author->bio,
            'avatar' => $this->authorAvatarUrl($author),
            'phone' => $author->phone,
            'address' => $author->address,
            'city' => $author->city,
            'province' => $author->province,
            'postal_code' => $author->postal_code,
            'is_profile_complete' => (bool) $author->is_profile_complete,
            'email_verified' => (bool) $author->user?->email_verified_at,
            'bank_account' => [
                'bank_name' => $author->bank_name,
                'account_number' => $author->bank_account,
                'account_name' => $author->bank_account_name,
            ],
        ];
    }

    private function authorAvatarUrl(Author $author): ?string
    {
        if ($author->user?->avatar_url) {
            return $author->user->avatar_url;
        }

        if (! $author->photo_path) {
            return null;
        }

        if (str_starts_with($author->photo_path, 'http')) {
            return $author->photo_path;
        }

        if (Storage::disk('public')->exists($author->photo_path)) {
            return Storage::disk('public')->url($author->photo_path);
        }

        return $author->photo_path;
    }

    private function storeManuscriptFile(UploadedFile $file, int $authorId): string
    {
        return $file->store("authors/{$authorId}/manuscripts", 'local');
    }

    private function storeManuscriptVersion(
        ManuscriptProposal $manuscript,
        UploadedFile $file,
        string $storedPath,
        string $changeLog
    ): void {
        $manuscript->manuscriptVersions()->update(['is_current' => false]);

        $nextVersion = ((int) $manuscript->manuscriptVersions()->max('version_number')) + 1;

        $manuscript->manuscriptVersions()->create([
            'manuscript_proposal_id' => $manuscript->id,
            'version_number' => $nextVersion,
            'file_path' => $storedPath,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'change_log' => $changeLog,
            'is_current' => true,
            'uploaded_by' => auth()->id(),
        ]);
    }

    private function recordManuscriptStatusHistory(
        ManuscriptProposal $manuscript,
        ?string $fromStatus,
        string $toStatus,
        ?string $notes = null
    ): void {
        $manuscript->statusHistories()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'notes' => $notes,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);
    }

    private function serializePagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    private function successResponse(string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data ?? $this->emptyObject(),
            'errors' => $this->emptyObject(),
        ], $status);
    }

    private function errorResponse(string $message, array $errors = [], int $status = 400, mixed $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data ?? $this->emptyObject(),
            'errors' => $errors === [] ? $this->emptyObject() : $errors,
        ], $status);
    }

    private function emptyObject(): stdClass
    {
        return new stdClass();
    }

    private function enumValue(mixed $value): mixed
    {
        return $value instanceof \BackedEnum ? $value->value : $value;
    }

    /**
     * @return array{0: ?array, 1: ?JsonResponse}
     */
    private function validateRequest(Request $request, array $rules): array
    {
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return [null, $this->errorResponse('Validation failed.', $validator->errors()->toArray(), 422)];
        }

        return [$validator->validated(), null];
    }
}
