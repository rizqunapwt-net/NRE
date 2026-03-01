<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PublishingRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookFile;
use App\Models\Contract;
use App\Models\PrintOrder;
use App\Models\PublishingRequest;
use App\Models\RoyaltyCalculation;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AuthorPortalController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        return response()->json(['success' => true, 'data' => ['author' => $author, 'statistics' => $author->getDashboardStats()]]);
    }

    public function books(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = Book::with([
            'author',
            'contracts',
            'files' => fn ($fileQuery) => $fileQuery
                ->where('file_type', 'proof')
                ->where('notes', 'short_pdf_preview')
                ->latest(),
        ])->where('author_id', $author->id)->orderBy('created_at', 'desc');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $books = $query->paginate($request->get('per_page', 15));

        $mappedBooks = collect($books->items())->map(function (Book $book): array {
            $shortPdf = $book->files->first();

            return array_merge($book->toArray(), [
                'short_pdf_url' => $shortPdf?->file_path ? Storage::disk('public')->url($shortPdf->file_path) : null,
                'short_pdf_name' => $shortPdf?->original_name,
                'short_pdf_uploaded_at' => $shortPdf?->created_at?->toISOString(),
            ]);
        });

        return response()->json(['success' => true, 'data' => $mappedBooks->values(), 'meta' => ['current_page' => $books->currentPage(), 'last_page' => $books->lastPage(), 'per_page' => $books->perPage(), 'total' => $books->total()]]);
    }

    public function updateBook(Request $request, $bookId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $book = Book::where('author_id', $author->id)->findOrFail($bookId);
        $validated = $request->validate(['title' => ['sometimes', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'price' => ['nullable', 'numeric', 'min:0'], 'cover_path' => ['nullable', 'string']]);
        $book->update($validated);

        return response()->json(['success' => true, 'message' => 'Book updated successfully', 'data' => $book->fresh()]);
    }

    public function uploadShortPdf(Request $request, int $bookId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $book = Book::where('author_id', $author->id)->findOrFail($bookId);
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $existingFiles = BookFile::where('book_id', $book->id)
            ->where('file_type', 'proof')
            ->where('notes', 'short_pdf_preview')
            ->get();

        foreach ($existingFiles as $existingFile) {
            if ($existingFile->file_path) {
                Storage::disk('public')->delete($existingFile->file_path);
            }
            $existingFile->delete();
        }

        $file = $request->file('file');
        $path = $file->store("books/{$book->id}/short-pdf", 'public');

        $bookFile = BookFile::create([
            'book_id' => $book->id,
            'file_type' => 'proof',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'uploaded_by' => auth()->id(),
            'notes' => 'short_pdf_preview',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'PDF singkat berhasil diupload.',
            'data' => [
                'book_id' => $book->id,
                'short_pdf_url' => Storage::disk('public')->url($bookFile->file_path),
                'short_pdf_name' => $bookFile->original_name,
                'short_pdf_uploaded_at' => $bookFile->created_at?->toISOString(),
                'short_pdf_size' => $bookFile->file_size,
            ],
        ], 201);
    }

    public function contracts(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $bookIds = Book::where('author_id', $author->id)->pluck('id');
        $query = Contract::with(['book.author', 'marketplace'])->whereIn('book_id', $bookIds)->orderBy('created_at', 'desc');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('book_id')) {
            $query->where('book_id', $request->book_id);
        }

        $contracts = $query->paginate($request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $contracts->items(), 'meta' => ['current_page' => $contracts->currentPage(), 'last_page' => $contracts->lastPage(), 'per_page' => $contracts->perPage(), 'total' => $contracts->total()]]);
    }

    public function signContract(Request $request, $contractId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $bookIds = Book::where('author_id', $author->id)->pluck('id');
        $contract = Contract::whereIn('book_id', $bookIds)->findOrFail($contractId);
        if ($contract->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Contract status must be pending to sign'], 422);
        }

        $validated = $request->validate(['accepted' => ['required', 'boolean'], 'notes' => ['nullable', 'string']]);
        $contract->update(['status' => $validated['accepted'] ? 'approved' : 'rejected', 'notes' => $validated['notes'] ?? $contract->notes, 'approved_at' => $validated['accepted'] ? now() : null]);

        return response()->json(['success' => true, 'message' => $validated['accepted'] ? 'Contract signed' : 'Contract rejected', 'data' => $contract->fresh()]);
    }

    public function royalties(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = RoyaltyCalculation::with(['author', 'payment'])
            ->where('author_id', $author->id)
            ->orderBy('period_month', 'desc');

        if ($request->filled('period_month')) {
            $query->where('period_month', $request->period_month);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $royalties = $query->paginate($request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $royalties->items(), 'meta' => ['current_page' => $royalties->currentPage(), 'last_page' => $royalties->lastPage(), 'per_page' => $royalties->perPage(), 'total' => $royalties->total()]]);
    }

    public function royaltyReport(Request $request, $royaltyId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $royalty = RoyaltyCalculation::with(['author', 'payment', 'items.sale.marketplace', 'items.book'])
            ->where('author_id', $author->id)
            ->findOrFail($royaltyId);

        $totalSales = $royalty->items->sum('quantity');
        $totalRevenue = $royalty->items->sum(fn ($item) => $item->quantity * $item->net_price);
        
        // Use a default or get from first item if needed
        $royaltyRate = $royalty->items->first()?->royalty_percentage ?? 0;

        return response()->json(['success' => true, 'data' => [
            'royalty' => $royalty,
            'breakdown' => [
                'total_sales' => $totalSales, 
                'total_revenue' => $totalRevenue, 
                'royalty_rate' => $royaltyRate, 
                'calculated_royalty' => $royalty->total_amount, 
                'platform_fee' => $royalty->platform_fee ?? 0, 
                'net_royalty' => $royalty->total_amount
            ],
            'sales_breakdown' => $royalty->items->map(fn ($item) => [
                'marketplace' => $item->sale?->marketplace?->name, 
                'book_title' => $item->book?->title,
                'quantity' => $item->quantity, 
                'net_price' => $item->net_price, 
                'subtotal' => $item->quantity * $item->net_price,
                'royalty_amount' => $item->amount
            ]),
        ]]);
    }

    public function sales(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = Sale::with(['book', 'marketplace'])
            ->whereHas('book', fn($q) => $q->where('author_id', $author->id))
            ->orderBy('period_month', 'desc');

        if ($request->filled('period_month')) {
            $query->where('period_month', $request->period_month);
        }
        if ($request->filled('marketplace_id')) {
            $query->where('marketplace_id', $request->marketplace_id);
        }

        $sales = $query->paginate($request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $sales->items(), 'meta' => ['current_page' => $sales->currentPage(), 'last_page' => $sales->lastPage(), 'per_page' => $sales->perPage(), 'total' => $sales->total()]]);
    }

    public function profile(): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $author]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'], 'pen_name' => ['nullable', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:16'], 'bio' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'], 'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'], 'province' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'], 'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['nullable', 'string', 'max:50'], 'bank_account_name' => ['nullable', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:20'],
            'social_links' => ['nullable', 'array'],
            'social_links.website' => ['nullable', 'url', 'max:255'],
            'social_links.instagram' => ['nullable', 'string', 'max:100'],
            'social_links.twitter' => ['nullable', 'string', 'max:100'],
            'social_links.facebook' => ['nullable', 'string', 'max:100'],
            'language' => ['nullable', 'string', 'max:10'],
        ]);

        $author->update($validated);
        $author->checkProfileCompleteness();

        return response()->json(['success' => true, 'message' => 'Profil berhasil diperbarui.', 'data' => $author->fresh()]);
    }

    public function uploadKtp(Request $request): JsonResponse
    {
        $request->validate(['ktp_photo' => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:2048']]);
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        if ($author->ktp_path) {
            Storage::disk('local')->delete($author->ktp_path);
        }
        $path = $request->file('ktp_photo')->store("authors/{$author->id}/ktp", 'local');
        $author->update(['ktp_path' => $path]);
        $author->checkProfileCompleteness();

        return response()->json(['success' => true, 'message' => 'Foto KTP berhasil diupload.', 'data' => ['path' => $path]]);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate(['photo' => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:2048']]);
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        if ($author->photo_path) {
            Storage::disk('local')->delete($author->photo_path);
        }
        $path = $request->file('photo')->store("authors/{$author->id}/photos", 'local');
        $author->update(['photo_path' => $path]);

        return response()->json(['success' => true, 'message' => 'Foto profil berhasil diupload.', 'data' => ['path' => $path]]);
    }

    public function printOrders(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $orders = PrintOrder::with(['book'])->where('author_id', $author->id)->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $orders->items(), 'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'per_page' => $orders->perPage(), 'total' => $orders->total()]]);
    }

    public function storePrintOrder(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $validated = $request->validate(['book_id' => ['required', 'exists:books,id'], 'quantity' => ['required', 'integer', 'min:1'], 'notes' => ['nullable', 'string']]);
        $book = Book::where('id', $validated['book_id'])->where('author_id', $author->id)->firstOrFail();

        $order = PrintOrder::create(['author_id' => $author->id, 'book_id' => $book->id, 'quantity' => $validated['quantity'], 'notes' => $validated['notes'] ?? null, 'status' => 'pending']);

        return response()->json(['success' => true, 'message' => 'Pesanan cetak berhasil dibuat.', 'data' => $order->load('book')], 201);
    }

    public function publishingRequests(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = PublishingRequest::query()
            ->where('author_id', $author->id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->string('search'));
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('genre', 'like', "%{$search}%")
                    ->orWhere('synopsis', 'like', "%{$search}%");
            });
        }

        $requests = $query->paginate((int) $request->integer('per_page', 15));
        $statusOptions = collect(PublishingRequestStatus::cases())->map(fn (PublishingRequestStatus $status): array => [
            'value' => $status->value,
            'label' => $status->label(),
            'color' => $status->color(),
        ])->values();

        $mapped = collect($requests->items())->map(function (PublishingRequest $item): array {
            $status = PublishingRequestStatus::tryFrom($item->status);

            return [
                'id' => $item->id,
                'title' => $item->title,
                'genre' => $item->genre,
                'synopsis' => $item->synopsis,
                'status' => $item->status,
                'status_label' => $status?->label() ?? ucfirst($item->status),
                'status_color' => $status?->color() ?? 'default',
                'created_at' => $item->created_at?->toISOString(),
                'updated_at' => $item->updated_at?->toISOString(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $mapped,
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
                'status_options' => $statusOptions,
            ],
        ]);
    }

    public function storePublishingRequest(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'synopsis' => ['required', 'string'],
            'genre' => ['required', 'string', 'max:100'],
            'manuscript' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $manuscriptPath = null;
        if ($request->hasFile('manuscript')) {
            $manuscriptPath = $request->file('manuscript')->store("authors/{$author->id}/manuscripts", 'local');
        }

        $pubRequest = PublishingRequest::create([
            'author_id' => $author->id,
            'title' => $validated['title'],
            'synopsis' => $validated['synopsis'],
            'genre' => $validated['genre'],
            'manuscript_path' => $manuscriptPath,
            'status' => PublishingRequestStatus::SUBMITTED->value,
        ]);
        $pubRequest->statusHistories()->create(['from_status' => null, 'to_status' => 'submitted', 'notes' => 'Naskah dikirim oleh penulis.', 'changed_by' => auth()->id(), 'changed_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Pengajuan penerbitan berhasil dikirim.', 'data' => $pubRequest], 201);
    }

    public function bookTracking(Request $request, $bookId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $book = Book::where('author_id', $author->id)->findOrFail($bookId);
        $bookLogs = \App\Models\BookStatusLog::where('book_id', $book->id)->orderBy('created_at')->get()->map(fn ($log) => ['type' => 'penerbitan', 'status' => $log->status, 'notes' => $log->notes, 'changed_at' => $log->created_at->toISOString()]);

        return response()->json(['success' => true, 'data' => ['book' => $book, 'timeline' => $bookLogs->values()]]);
    }

    public function downloadTemplate(Request $request, $contractId): \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $bookIds = Book::where('author_id', $author->id)->pluck('id');
        $contract = Contract::whereIn('book_id', $bookIds)->findOrFail($contractId);
        if (! $contract->file_path || ! Storage::disk('local')->exists($contract->file_path)) {
            return response()->json(['success' => false, 'message' => 'File kontrak tidak ditemukan.'], 404);
        }

        return Storage::disk('local')->download($contract->file_path);
    }

    public function uploadSigned(Request $request, $contractId): JsonResponse
    {
        $request->validate(['signed_file' => ['required', 'file', 'mimes:pdf,jpeg,png,jpg', 'max:5120']]);
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $bookIds = Book::where('author_id', $author->id)->pluck('id');
        $contract = Contract::whereIn('book_id', $bookIds)->findOrFail($contractId);
        $path = $request->file('signed_file')->store("contracts/signed/{$author->id}", 'local');
        $contract->update(['status' => 'approved', 'approved_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Dokumen tanda tangan berhasil diupload.', 'data' => $contract->fresh()]);
    }

    public function ebooks(Request $request): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = Book::where('author_id', $author->id)
            ->where('type', 'ebook')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $ebooks = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $ebooks->items(),
            'meta' => [
                'current_page' => $ebooks->currentPage(),
                'last_page' => $ebooks->lastPage(),
                'per_page' => $ebooks->perPage(),
                'total' => $ebooks->total(),
            ],
        ]);
    }

    public function ebookStats(int $bookId): JsonResponse
    {
        $author = $this->getAuthenticatedAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $book = Book::where('author_id', $author->id)->where('type', 'ebook')->findOrFail($bookId);

        $sales = Sale::where('book_id', $book->id)
            ->selectRaw('COUNT(*) as total_transactions, SUM(quantity) as total_sold, SUM(net_amount) as total_revenue')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'book' => $book,
                'total_transactions' => $sales->total_transactions ?? 0,
                'total_sold' => $sales->total_sold ?? 0,
                'total_revenue' => $sales->total_revenue ?? 0,
            ],
        ]);
    }

    private function getAuthenticatedAuthor(): ?Author
    {
        $user = auth()->user();
        if (! $user) {
            return null;
        }

        $author = Author::where('user_id', $user->id)->first();
        if (! $author) {
            $author = Author::where('email', $user->email)->first();
        }

        return $author;
    }
}
