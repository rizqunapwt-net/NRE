<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\SiteContent;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    // ── Site Content CRUD ──

    /**
     * Sanitize HTML content to prevent XSS attacks.
     */
    private function sanitizeHtml(string $html): string
    {
        // Allow only safe HTML tags
        $allowedTags = '<p><br><strong><em><u><ul><ol><li><a><img><h1><h2><h3><h4><h5><h6><div><span><blockquote><code><pre>';
        
        return strip_tags($html, $allowedTags);
    }

    public function index(Request $request): JsonResponse
    {
        $query = SiteContent::orderBy('section')->orderBy('sort_order');

        if ($request->has('section')) {
            $query->section($request->section);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section' => 'required|string|max:50',
            'key' => 'required|string|max:100',
            'value' => 'nullable|string',
            'type' => 'in:text,html,json,image',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        // Sanitize HTML content if type is html
        if (isset($validated['value']) && $validated['type'] === 'html') {
            $validated['value'] = $this->sanitizeHtml($validated['value']);
        }

        $content = SiteContent::updateOrCreate(
            ['section' => $validated['section'], 'key' => $validated['key']],
            $validated
        );

        return response()->json(['data' => $content, 'message' => 'Konten berhasil disimpan.'], 201);
    }

    public function update(Request $request, SiteContent $siteContent): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'nullable|string',
            'type' => 'in:text,html,json,image',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        // Sanitize HTML content if type is html
        if (isset($validated['value']) && $validated['type'] === 'html') {
            $validated['value'] = $this->sanitizeHtml($validated['value']);
        }

        $siteContent->update($validated);

        return response()->json(['data' => $siteContent, 'message' => 'Konten berhasil diperbarui.']);
    }

    public function destroy(SiteContent $siteContent): JsonResponse
    {
        $siteContent->delete();

        return response()->json(['message' => 'Konten berhasil dihapus.']);
    }

    /**
     * POST /api/v1/admin/site-content/bulk
     * Bulk upsert site content (used by the CMS editor).
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.section' => 'required|string|max:50',
            'items.*.key' => 'required|string|max:100',
            'items.*.value' => 'nullable|string',
            'items.*.type' => 'in:text,html,json,image',
        ]);

        foreach ($validated['items'] as $item) {
            SiteContent::setValue(
                $item['section'],
                $item['key'],
                $item['value'] ?? '',
                $item['type'] ?? 'text'
            );
        }

        return response()->json(['message' => 'Konten berhasil diperbarui.']);
    }

    // ── FAQ CRUD ──

    public function faqIndex(): JsonResponse
    {
        return response()->json(['data' => Faq::orderBy('sort_order')->get()]);
    }

    public function faqStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'category' => 'string|max:50',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $faq = Faq::create($validated);

        return response()->json(['data' => $faq, 'message' => 'FAQ berhasil ditambahkan.'], 201);
    }

    public function faqUpdate(Request $request, Faq $faq): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'string|max:500',
            'answer' => 'string',
            'category' => 'string|max:50',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $faq->update($validated);

        return response()->json(['data' => $faq, 'message' => 'FAQ berhasil diperbarui.']);
    }

    public function faqDestroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return response()->json(['message' => 'FAQ berhasil dihapus.']);
    }

    // ── Testimonial CRUD ──

    public function testimonialIndex(): JsonResponse
    {
        return response()->json(['data' => Testimonial::orderBy('sort_order')->get()]);
    }

    public function testimonialStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'role' => 'nullable|string|max:100',
            'institution' => 'nullable|string|max:200',
            'content' => 'required|string',
            'avatar_url' => 'nullable|string',
            'rating' => 'integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $testimonial = Testimonial::create($validated);

        return response()->json(['data' => $testimonial, 'message' => 'Testimoni berhasil ditambahkan.'], 201);
    }

    public function testimonialUpdate(Request $request, Testimonial $testimonial): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:200',
            'role' => 'nullable|string|max:100',
            'institution' => 'nullable|string|max:200',
            'content' => 'string',
            'avatar_url' => 'nullable|string',
            'rating' => 'integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $testimonial->update($validated);

        return response()->json(['data' => $testimonial, 'message' => 'Testimoni berhasil diperbarui.']);
    }

    public function testimonialDestroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return response()->json(['message' => 'Testimoni berhasil dihapus.']);
    }
}
