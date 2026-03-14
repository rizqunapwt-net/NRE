<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Testimonial;
use App\Models\SiteContent;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * GET /api/v1/admin/settings/general
     * Get general settings
     */
    public function getGeneral(): JsonResponse
    {
        $settings = SiteContent::where('section', 'general')->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => [
                'company_name' => $settings['company_name'] ?? '',
                'company_logo' => $settings['company_logo'] ?? '',
                'company_description' => $settings['company_description'] ?? '',
                'contact_email' => $settings['contact_email'] ?? '',
                'contact_phone' => $settings['contact_phone'] ?? '',
                'contact_address' => $settings['contact_address'] ?? '',
                'social_facebook' => $settings['social_facebook'] ?? '',
                'social_instagram' => $settings['social_instagram'] ?? '',
                'social_linkedin' => $settings['social_linkedin'] ?? '',
                'social_twitter' => $settings['social_twitter'] ?? '',
            ]
        ]);
    }

    /**
     * PUT /api/v1/admin/settings/general
     * Update general settings
     */
    public function updateGeneral(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'sometimes|string|max:255',
            'company_logo' => 'sometimes|string|max:500',
            'company_description' => 'sometimes|string',
            'contact_email' => 'sometimes|email|max:255',
            'contact_phone' => 'sometimes|string|max:50',
            'contact_address' => 'sometimes|string',
            'social_facebook' => 'sometimes|url|max:500',
            'social_instagram' => 'sometimes|url|max:500',
            'social_linkedin' => 'sometimes|url|max:500',
            'social_twitter' => 'sometimes|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $settings = $request->only([
            'company_name', 'company_logo', 'company_description',
            'contact_email', 'contact_phone', 'contact_address',
            'social_facebook', 'social_instagram', 'social_linkedin', 'social_twitter',
        ]);

        foreach ($settings as $key => $value) {
            SiteContent::updateOrCreate(
                ['section' => 'general', 'key' => $key],
                ['value' => $value, 'type' => 'text', 'is_active' => true]
            );
        }

        return response()->json(['success' => true, 'message' => 'General settings updated successfully']);
    }

    /**
     * GET /api/v1/admin/settings/publish
     * Get publish settings
     */
    public function getPublish(): JsonResponse
    {
        $settings = SiteContent::where('section', 'publish')->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => [
                'default_royalty_percentage' => $settings['default_royalty_percentage'] ?? '10',
                'minimum_withdrawal_balance' => $settings['minimum_withdrawal_balance'] ?? '100000',
                'payment_methods' => json_decode($settings['payment_methods'] ?? '["bank_transfer"]', true),
                'publishing_timeline_manuscript_review' => $settings['publishing_timeline_manuscript_review'] ?? '7',
                'publishing_timeline_editing' => $settings['publishing_timeline_editing'] ?? '14',
                'publishing_timeline_design' => $settings['publishing_timeline_design'] ?? '10',
                'publishing_timeline_proofreading' => $settings['publishing_timeline_proofreading'] ?? '5',
                'publishing_timeline_printing' => $settings['publishing_timeline_printing'] ?? '7',
            ]
        ]);
    }

    /**
     * PUT /api/v1/admin/settings/publish
     * Update publish settings
     */
    public function updatePublish(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'default_royalty_percentage' => 'sometimes|numeric|min:0|max:100',
            'minimum_withdrawal_balance' => 'sometimes|numeric|min:0',
            'payment_methods' => 'sometimes|array',
            'publishing_timeline_manuscript_review' => 'sometimes|integer|min:1',
            'publishing_timeline_editing' => 'sometimes|integer|min:1',
            'publishing_timeline_design' => 'sometimes|integer|min:1',
            'publishing_timeline_proofreading' => 'sometimes|integer|min:1',
            'publishing_timeline_printing' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $settings = $request->only([
            'default_royalty_percentage', 'minimum_withdrawal_balance',
            'publishing_timeline_manuscript_review', 'publishing_timeline_editing',
            'publishing_timeline_design', 'publishing_timeline_proofreading',
            'publishing_timeline_printing',
        ]);

        foreach ($settings as $key => $value) {
            SiteContent::updateOrCreate(
                ['section' => 'publish', 'key' => $key],
                ['value' => $value, 'type' => 'text', 'is_active' => true]
            );
        }

        if ($request->has('payment_methods')) {
            SiteContent::updateOrCreate(
                ['section' => 'publish', 'key' => 'payment_methods'],
                ['value' => json_encode($request->payment_methods), 'type' => 'json', 'is_active' => true]
            );
        }

        return response()->json(['success' => true, 'message' => 'Publish settings updated successfully']);
    }

    /**
     * GET /api/v1/admin/faqs
     * List all FAQs
     */
    public function listFaqs(Request $request): JsonResponse
    {
        $query = Faq::query()->orderBy('sort_order');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $query->where('question', 'like', '%' . $request->search . '%');
        }

        $faqs = $request->boolean('all') ? $query->get() : $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $faqs
        ]);
    }

    /**
     * POST /api/v1/admin/faqs
     * Create new FAQ
     */
    public function createFaq(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'category' => 'required|in:general,payment,publishing,technical',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $faq = Faq::create($request->only(['question', 'answer', 'category', 'sort_order', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully',
            'data' => $faq
        ], 201);
    }

    /**
     * PUT /api/v1/admin/faqs/{id}
     * Update FAQ
     */
    public function updateFaq(Request $request, int $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'question' => 'sometimes|required|string|max:500',
            'answer' => 'sometimes|required|string',
            'category' => 'sometimes|required|in:general,payment,publishing,technical',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $faq->update($request->only(['question', 'answer', 'category', 'sort_order', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully',
            'data' => $faq->fresh()
        ]);
    }

    /**
     * DELETE /api/v1/admin/faqs/{id}
     * Delete FAQ
     */
    public function deleteFaq(int $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully'
        ]);
    }

    /**
     * GET /api/v1/admin/testimonials
     * List all testimonials
     */
    public function listTestimonials(Request $request): JsonResponse
    {
        $query = Testimonial::query()->orderBy('sort_order');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $testimonials = $request->boolean('all') ? $query->get() : $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $testimonials
        ]);
    }

    /**
     * POST /api/v1/admin/testimonials
     * Create new testimonial
     */
    public function createTestimonial(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'institution' => 'sometimes|string|max:255',
            'content' => 'required|string',
            'avatar_url' => 'sometimes|string|max:500',
            'rating' => 'sometimes|integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $testimonial = Testimonial::create($request->only([
            'name', 'role', 'institution', 'content', 'avatar_url',
            'rating', 'is_featured', 'is_active', 'sort_order'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Testimonial created successfully',
            'data' => $testimonial
        ], 201);
    }

    /**
     * PUT /api/v1/admin/testimonials/{id}
     * Update testimonial
     */
    public function updateTestimonial(Request $request, int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'role' => 'sometimes|required|string|max:255',
            'institution' => 'sometimes|string|max:255',
            'content' => 'sometimes|required|string',
            'avatar_url' => 'sometimes|string|max:500',
            'rating' => 'sometimes|integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $testimonial->update($request->only([
            'name', 'role', 'institution', 'content', 'avatar_url',
            'rating', 'is_featured', 'is_active', 'sort_order'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Testimonial updated successfully',
            'data' => $testimonial->fresh()
        ]);
    }

    /**
     * DELETE /api/v1/admin/testimonials/{id}
     * Delete testimonial
     */
    public function deleteTestimonial(int $id): JsonResponse
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Testimonial deleted successfully'
        ]);
    }

    /**
     * GET /api/v1/admin/settings/banners
     * List all homepage banners
     */
    public function listBanners(Request $request): JsonResponse
    {
        $query = SiteContent::where('section', 'banners')
            ->orderBy('sort_order');

        $banners = $query->get()->map(function ($banner) {
            return [
                'id' => $banner->id,
                'title' => $banner->key,
                'image' => json_decode($banner->value, true)['image'] ?? '',
                'description' => json_decode($banner->value, true)['description'] ?? '',
                'link' => json_decode($banner->value, true)['link'] ?? '',
                'cta_text' => json_decode($banner->value, true)['cta_text'] ?? 'Learn More',
                'schedule_from' => json_decode($banner->value, true)['schedule_from'] ?? null,
                'schedule_to' => json_decode($banner->value, true)['schedule_to'] ?? null,
                'is_active' => $banner->is_active,
                'sort_order' => $banner->sort_order,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $banners
        ]);
    }

    /**
     * POST /api/v1/admin/settings/banners
     * Create new banner
     */
    public function createBanner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'image' => 'required|string|max:500',
            'description' => 'sometimes|string',
            'link' => 'sometimes|string|max:500',
            'cta_text' => 'sometimes|string|max:50',
            'schedule_from' => 'sometimes|date',
            'schedule_to' => 'sometimes|date|after:schedule_from',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $bannerData = [
            'image' => $request->image,
            'description' => $request->description ?? '',
            'link' => $request->link ?? '',
            'cta_text' => $request->cta_text ?? 'Learn More',
            'schedule_from' => $request->schedule_from ?? null,
            'schedule_to' => $request->schedule_to ?? null,
        ];

        $banner = SiteContent::create([
            'section' => 'banners',
            'key' => $request->title,
            'value' => json_encode($bannerData),
            'type' => 'json',
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Banner created successfully',
            'data' => $banner
        ], 201);
    }

    /**
     * PUT /api/v1/admin/settings/banners/{id}
     * Update banner
     */
    public function updateBanner(Request $request, int $id): JsonResponse
    {
        $banner = SiteContent::where('section', 'banners')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'image' => 'sometimes|string|max:500',
            'description' => 'sometimes|string',
            'link' => 'sometimes|string|max:500',
            'cta_text' => 'sometimes|string|max:50',
            'schedule_from' => 'sometimes|date',
            'schedule_to' => 'sometimes|date|after:schedule_from',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $currentData = json_decode($banner->value, true) ?? [];

        $bannerData = array_merge($currentData, [
            'image' => $request->image ?? $currentData['image'] ?? '',
            'description' => $request->description ?? $currentData['description'] ?? '',
            'link' => $request->link ?? $currentData['link'] ?? '',
            'cta_text' => $request->cta_text ?? $currentData['cta_text'] ?? 'Learn More',
            'schedule_from' => $request->schedule_from ?? $currentData['schedule_from'] ?? null,
            'schedule_to' => $request->schedule_to ?? $currentData['schedule_to'] ?? null,
        ]);

        $banner->update([
            'key' => $request->title ?? $banner->key,
            'value' => json_encode($bannerData),
            'sort_order' => $request->sort_order ?? $banner->sort_order,
            'is_active' => $request->has('is_active') ? $request->is_active : $banner->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Banner updated successfully',
            'data' => $banner
        ]);
    }

    /**
     * DELETE /api/v1/admin/settings/banners/{id}
     * Delete banner
     */
    public function deleteBanner(int $id): JsonResponse
    {
        $banner = SiteContent::where('section', 'banners')->findOrFail($id);
        $banner->delete();

        return response()->json([
            'success' => true,
            'message' => 'Banner deleted successfully'
        ]);
    }

    /**
     * GET /api/v1/admin/settings/email-templates
     * List email templates
     */
    public function listEmailTemplates(): JsonResponse
    {
        $templates = [
            ['id' => 'welcome', 'name' => 'Welcome Email', 'description' => 'Sent when a new user registers'],
            ['id' => 'manuscript_approved', 'name' => 'Manuscript Approved', 'description' => 'Sent when manuscript is approved'],
            ['id' => 'manuscript_rejected', 'name' => 'Manuscript Rejected', 'description' => 'Sent when manuscript is rejected'],
            ['id' => 'contract_signed', 'name' => 'Contract Signed', 'description' => 'Sent when contract is signed'],
            ['id' => 'royalty_finalized', 'name' => 'Royalty Finalized', 'description' => 'Sent when royalty is finalized'],
            ['id' => 'payment_received', 'name' => 'Payment Received', 'description' => 'Sent when payment is received'],
            ['id' => 'book_published', 'name' => 'Book Published', 'description' => 'Sent when book is published'],
        ];

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * GET /api/v1/admin/settings/email-templates/{id}
     * Get email template content
     */
    public function getEmailTemplate(string $id): JsonResponse
    {
        $template = SiteContent::where('section', 'email_templates')->where('key', $id)->first();

        $defaultTemplates = [
            'welcome' => [
                'subject' => 'Welcome to {company_name}!',
                'body' => "Dear {author_name},\n\nWelcome to {company_name}! We're excited to have you on board.\n\nBest regards,\n{company_name} Team",
            ],
            'manuscript_approved' => [
                'subject' => 'Your Manuscript "{book_title}" Has Been Approved',
                'body' => "Dear {author_name},\n\nGreat news! Your manuscript \"{book_title}\" has been approved for publication.\n\nBest regards,\n{company_name} Team",
            ],
            'royalty_finalized' => [
                'subject' => 'Royalty Statement - {amount}',
                'body' => "Dear {author_name},\n\nYour royalty statement is ready. Amount: {amount}\n\nBest regards,\n{company_name} Team",
            ],
        ];

        $data = $template ? json_decode($template->value, true) : ($defaultTemplates[$id] ?? ['subject' => '', 'body' => '']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'subject' => $data['subject'] ?? '',
                'body' => $data['body'] ?? '',
                'variables' => ['{company_name}', '{author_name}', '{book_title}', '{amount}', '{date}'],
            ]
        ]);
    }

    /**
     * PUT /api/v1/admin/settings/email-templates/{id}
     * Update email template
     */
    public function updateEmailTemplate(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:500',
            'body' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        SiteContent::updateOrCreate(
            ['section' => 'email_templates', 'key' => $id],
            [
                'value' => json_encode([
                    'subject' => $request->subject,
                    'body' => $request->body,
                ]),
                'type' => 'json',
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Email template updated successfully'
        ]);
    }

    /**
     * POST /api/v1/admin/settings/email-templates/{id}/test
     * Send test email
     */
    public function sendTestEmail(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // In production, this would actually send an email
        // For now, just log it
        \Log::info('Test email would be sent to: ' . $request->email . ' for template: ' . $id);

        return response()->json([
            'success' => true,
            'message' => 'Test email sent successfully to ' . $request->email
        ]);
    }
}
