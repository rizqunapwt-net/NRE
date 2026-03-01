<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\ManuscriptProposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ManuscriptController extends Controller
{
    private function getAuthor(): ?Author
    {
        return Author::where('user_id', auth()->id())->first();
    }

    public function index(Request $request): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $query = ManuscriptProposal::with(['author'])
            ->where('author_id', $author->id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $s = $request->string('search')->trim()->toString();
            $query->where(fn ($q) => $q->where('title', 'like', "%{$s}%")->orWhere('synopsis', 'like', "%{$s}%"));
        }

        $manuscripts = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $manuscripts->items(),
            'meta' => [
                'current_page' => $manuscripts->currentPage(),
                'last_page' => $manuscripts->lastPage(),
                'per_page' => $manuscripts->perPage(),
                'total' => $manuscripts->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'synopsis' => ['required', 'string'],
            'genre' => ['required', 'string', 'max:100'],
            'target_audience' => ['nullable', 'string'],
            'unique_selling_points' => ['nullable', 'string'],
            'table_of_contents' => ['nullable', 'array'],
            'estimated_pages' => ['nullable', 'integer', 'min:1'],
        ]);

        $manuscript = ManuscriptProposal::create(array_merge($validated, [
            'author_id' => $author->id,
            'status' => 'draft',
        ]));

        return response()->json(['success' => true, 'message' => 'Naskah berhasil dibuat.', 'data' => $manuscript], 201);
    }

    public function show(int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::with(['author', 'manuscriptVersions'])
            ->where('author_id', $author->id)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $manuscript]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::where('author_id', $author->id)->findOrFail($id);

        if (! in_array($manuscript->status, ['draft', 'revised'])) {
            return response()->json(['success' => false, 'message' => 'Naskah yang sudah disubmit tidak dapat diedit.'], 422);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'synopsis' => ['sometimes', 'string'],
            'genre' => ['sometimes', 'string', 'max:100'],
            'target_audience' => ['nullable', 'string'],
            'unique_selling_points' => ['nullable', 'string'],
            'table_of_contents' => ['nullable', 'array'],
            'estimated_pages' => ['nullable', 'integer', 'min:1'],
        ]);

        $manuscript->update($validated);

        return response()->json(['success' => true, 'message' => 'Naskah berhasil diperbarui.', 'data' => $manuscript->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::where('author_id', $author->id)->findOrFail($id);

        if (! in_array($manuscript->status, ['draft'])) {
            return response()->json(['success' => false, 'message' => 'Hanya naskah draft yang dapat dihapus.'], 422);
        }

        if ($manuscript->manuscript_file_path) {
            Storage::disk('local')->delete($manuscript->manuscript_file_path);
        }

        $manuscript->delete();

        return response()->json(['success' => true, 'message' => 'Naskah berhasil dihapus.']);
    }

    public function submit(int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::where('author_id', $author->id)->findOrFail($id);

        if (! in_array($manuscript->status, ['draft', 'revised'])) {
            return response()->json(['success' => false, 'message' => 'Naskah ini tidak dapat disubmit.'], 422);
        }

        if (! $manuscript->manuscript_file_path) {
            return response()->json(['success' => false, 'message' => 'Upload file naskah terlebih dahulu sebelum submit.'], 422);
        }

        $manuscript->update(['status' => 'submitted']);

        return response()->json(['success' => true, 'message' => 'Naskah berhasil disubmit untuk direview.', 'data' => $manuscript->fresh()]);
    }

    public function uploadFile(Request $request, int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::where('author_id', $author->id)->findOrFail($id);

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        if ($manuscript->manuscript_file_path) {
            Storage::disk('local')->delete($manuscript->manuscript_file_path);
        }

        $path = $request->file('file')->store("manuscripts/{$author->id}", 'local');
        $manuscript->update(['manuscript_file_path' => $path]);

        return response()->json(['success' => true, 'message' => 'File naskah berhasil diupload.', 'data' => ['path' => $path]]);
    }

    public function progress(int $id): JsonResponse
    {
        $author = $this->getAuthor();
        if (! $author) {
            return response()->json(['success' => false, 'message' => 'Author profile not found'], 404);
        }

        $manuscript = ManuscriptProposal::with(['editorialStages', 'editorialAssignments'])
            ->where('author_id', $author->id)
            ->findOrFail($id);

        $stages = $manuscript->editorialStages ?? collect();

        return response()->json([
            'success' => true,
            'data' => [
                'manuscript_id' => $manuscript->id,
                'title' => $manuscript->title,
                'status' => $manuscript->status,
                'status_label' => $manuscript->status_label,
                'editorial_notes' => $manuscript->editorial_notes,
                'stages' => $stages,
                'reviewed_at' => $manuscript->reviewed_at,
            ],
        ]);
    }
}
