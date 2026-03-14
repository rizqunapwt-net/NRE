<?php

use App\Http\Controllers\Api\Percetakan\CustomerController;
use App\Http\Controllers\Api\Percetakan\MaterialController;
use App\Http\Controllers\Api\Percetakan\OrderController as PercetakanOrderController;
use App\Http\Controllers\Api\Percetakan\ProductionJobController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\AuthorAccountController;
use App\Http\Controllers\Api\V1\AuthorCrudController;
use App\Http\Controllers\Api\V1\AuthorPortalController;
use App\Http\Controllers\Api\V1\AuthorRegisterController;
use App\Http\Controllers\Api\V1\BookOrderController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\GoogleAuthController;
use App\Http\Controllers\Api\V1\ManuscriptController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PublicSiteController;
use App\Http\Controllers\Api\V1\PublishingController;
use App\Http\Controllers\Api\V1\PublishingRequestController;
use App\Http\Controllers\Api\V1\RoyaltyCalculationController;
use App\Http\Controllers\Api\V1\SalesImportController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SiteContentController;
use App\Http\Controllers\Api\V1\BookFileController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\RepositoryController;
use App\Http\Controllers\UnifiedLoginController;
use Illuminate\Support\Facades\Route;

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC APIs (No Authentication Required)
// ══════════════════════════════════════════════════════════════════════════
Route::prefix('v1')->group(function (): void {
    // Health Check Endpoints (for Docker/K8s)
    Route::get('/health', [HealthController::class, 'health']);
    Route::get('/ready', [HealthController::class, 'ready']);
    Route::get('/live', [HealthController::class, 'live']);

    // Payment Webhook (dipanggil oleh payment gateway)
    // Middleware verify.webhook akan detect gateway otomatis dari payload
    Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle'])
        ->middleware('verify.webhook');

    // Authentication
    Route::post('/auth/login', [UnifiedLoginController::class, 'apiLogin'])->middleware('throttle:10,1')->name('login');
    Route::post('/auth/register', [UnifiedLoginController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password', [UnifiedLoginController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [UnifiedLoginController::class, 'resetPassword'])->middleware('throttle:5,1');

    // Author Registration (Complete Profile)
    Route::post('/authors/register', [AuthorRegisterController::class, 'register'])->middleware('throttle:5,1');
    Route::get('/authors/check-username', [AuthorRegisterController::class, 'checkUsername']);
    Route::get('/authors/check-email', [AuthorRegisterController::class, 'checkEmail']);

    // Google OAuth (Requires 'web' middleware for session state/CSRF)
    Route::middleware(['web', 'throttle:auth'])->group(function () {
        Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
    });

    // Public Tracking
    Route::get('/tracking', [\App\Http\Controllers\Api\V1\PublicTrackingController::class, 'track']);

    // Public Site Content (Landing Page)
    Route::prefix('public')->group(function () {
        Route::get('/site-content', [PublicSiteController::class, 'siteContent']);
        Route::get('/faqs', [PublicSiteController::class, 'faqs']);
        Route::get('/testimonials', [PublicSiteController::class, 'testimonials']);
        Route::get('/catalog', [PublicSiteController::class, 'catalog']);
        Route::get('/catalog/grouped', [PublicSiteController::class, 'catalogGrouped']);
        Route::get('/catalog/{id}', [PublicSiteController::class, 'bookDetail']);
        Route::get('/categories', [PublicSiteController::class, 'categories']);
        Route::get('/authors', [PublicSiteController::class, 'authors']);
        Route::get('/stats', [PublicSiteController::class, 'stats']);
        // Blog & Articles
        Route::get('/blog', [PublicSiteController::class, 'blog']);
        Route::get('/blog/{id}', [PublicSiteController::class, 'blogDetail']);
        
        // Phase 3-6: Repository & Academic Citations
        Route::get('/repository', [RepositoryController::class, 'index']);
        Route::get('/repository/{slug}', [RepositoryController::class, 'show']);
        Route::get('/repository/{slug}/cite', [RepositoryController::class, 'cite']);
        Route::get('/sitasi', [RepositoryController::class, 'index']);
        Route::get('/sitasi/{slug}', [RepositoryController::class, 'show']);
        Route::get('/sitasi/{slug}/cite', [RepositoryController::class, 'cite']);

    }
    );

    // Scholar endpoints (tanpa prefix /public)
    Route::get('/search', [RepositoryController::class, 'search']);
    Route::get('/books/{id}/cite', [RepositoryController::class, 'citeById'])->whereNumber('id');
    Route::get('/books/{id}/cite/all', [RepositoryController::class, 'citeAll'])->whereNumber('id');
    Route::get('/books/{id}/cite/download', [RepositoryController::class, 'citeDownload'])->whereNumber('id');
});

// ══════════════════════════════════════════════════════════════════════════
// PROTECTED APIs (Authentication Required)
// ══════════════════════════════════════════════════════════════════════════
Route::prefix('v1')->middleware('auth:sanctum')->group(function (): void {

    // ── Auth (always accessible) ──
    Route::get('/auth/me', [UnifiedLoginController::class, 'me'])->name('auth.me');
    Route::post('/auth/logout', [UnifiedLoginController::class, 'logout'])->name('auth.logout');
    Route::post('/auth/change-password', [UnifiedLoginController::class, 'changePassword'])->name('auth.change-password');

    // ══════════════════════════════════════════════════════════════════════
    // Phase 3-6: Digital Library — User Library & Purchases
    // ══════════════════════════════════════════════════════════════════════
    Route::prefix('user')->group(function () {
        Route::get('/library', [\App\Http\Controllers\Api\V1\UserLibraryController::class, 'index']);
        Route::get('/purchases', [\App\Http\Controllers\Api\V1\UserLibraryController::class, 'purchases']);
        
        // Phase 8: Author Verification
        Route::post('/request-author-verification', [\App\Http\Controllers\Api\V1\AuthorVerificationController::class, 'requestVerification']);
        Route::get('/verification-status', [\App\Http\Controllers\Api\V1\AuthorVerificationController::class, 'verificationStatus']);
    });

    // Book Purchase
    Route::post('/books/{book}/purchase', [\App\Http\Controllers\Api\V1\BookPurchaseController::class, 'store']);
    Route::get('/purchases/{transactionId}/status', [\App\Http\Controllers\Api\V1\BookPurchaseController::class, 'status']);

    // ══════════════════════════════════════════════════════════════════════
    // ADMIN PANEL — All Admin-Only Endpoints
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware(['admin', 'password.changed'])->group(function () {

        // ── Admin Dashboard & Stats ──
        Route::get('/admin/dashboard-stats', [AdminDashboardController::class, 'bookStats']);
        
        // ── User Management (Admin Only) ──
        Route::get('/admin/users', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'index']);
        Route::get('/admin/users/roles', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'roles']);
        Route::get('/admin/users/{user}', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'show']);
        Route::post('/admin/users', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'store']);
        Route::put('/admin/users/{user}', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'update']);
        Route::patch('/admin/users/{user}/toggle-active', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'toggleActive']);
        Route::delete('/admin/users/{user}', [\App\Http\Controllers\Api\V1\UserManagementController::class, 'destroy']);

        // ── Admin Chat ──
        Route::get('/admin/chat/conversations', [ChatController::class, 'adminConversations']);
        Route::get('/admin/chat/{userId}/messages', [ChatController::class, 'adminMessages']);
        Route::post('/admin/chat/{userId}/reply', [ChatController::class, 'adminReply']);

        // ── Author Account Management ──
        Route::get('/admin/authors/without-account', [AuthorAccountController::class, 'withoutAccount']);
        Route::post('/admin/authors/{author}/create-account', [AuthorAccountController::class, 'createAccount']);

        // ── Authors CRUD ──
        Route::get('/admin/authors/stats', [AuthorCrudController::class, 'stats']);
        Route::get('/admin/authors', [AuthorCrudController::class, 'index']);
        Route::post('/admin/authors', [AuthorCrudController::class, 'store']);
        Route::get('/admin/authors/{id}', [AuthorCrudController::class, 'show']);
        Route::put('/admin/authors/{id}', [AuthorCrudController::class, 'update']);
        Route::delete('/admin/authors/{id}', [AuthorCrudController::class, 'destroy']);

        // ── Publishing & Books ──
        Route::get('/books', [PublishingController::class, 'books']);
        Route::get('/books/isbn-tracking', [PublishingController::class, 'isbnTracking']);
        Route::get('/books/{id}', [PublishingController::class, 'bookDetail']);
        Route::post('/books', [PublishingController::class, 'storeBook']);
        Route::patch('/books/{id}', [PublishingController::class, 'updateBook']);
        Route::patch('/books/{id}/status', [PublishingController::class, 'updateBookStatus']);
        Route::get('/books/{id}/files', [PublishingController::class, 'bookFiles']);
        Route::post('/books/{id}/files', [PublishingController::class, 'uploadBookFile'])->middleware('throttle:20,1');
        Route::post('/admin/books/{id}/parse', [PublishingController::class, 'triggerParse']);
        Route::get('/books/{id}/logs', [PublishingController::class, 'bookStatusLogs']);
        Route::get('/book-statuses', [PublishingController::class, 'statusList']);

        // ── Publishing Requests (Naskah Masuk) ──
        Route::get('/publishing-requests/stats', [PublishingRequestController::class, 'stats']);
        Route::get('/publishing-requests', [PublishingRequestController::class, 'index']);
        Route::get('/publishing-requests/{id}', [PublishingRequestController::class, 'show']);
        Route::patch('/publishing-requests/{id}/status', [PublishingRequestController::class, 'updateStatus']);
        Route::patch('/publishing-requests/{id}/notes', [PublishingRequestController::class, 'addNotes']);
        Route::delete('/publishing-requests/{id}', [PublishingRequestController::class, 'destroy']);

        // ── Legal Deposit ──
        Route::get('/legal-deposits', [PublishingController::class, 'legalDeposits']);

        // ── Authors (Legacy — keep for backward compat) ──
        Route::get('/authors', [PublishingController::class, 'authors']);
        Route::post('/authors', [PublishingController::class, 'storeAuthor']);

        // ── Contracts ──
        Route::get('/contracts', [PublishingController::class, 'contracts']);
        Route::get('/contracts/{id}', [PublishingController::class, 'contractDetail']);
        Route::post('/contracts', [ContractController::class, 'store']);
        Route::patch('/contracts/{id}', [PublishingController::class, 'updateContract']);
        Route::put('/contracts/{id}/approve', [PublishingController::class, 'approveContract']);
        Route::put('/contracts/{id}/reject', [PublishingController::class, 'rejectContract']);

        // ── Phase 3-6: Digital Library — Admin Book Access Management ──
        Route::get('/admin/book-access', [\App\Http\Controllers\Api\V1\BookAccessController::class, 'index']);
        Route::post('/admin/book-access', [\App\Http\Controllers\Api\V1\BookAccessController::class, 'store']);
        Route::patch('/admin/book-access/{bookAccess}', [\App\Http\Controllers\Api\V1\BookAccessController::class, 'toggle']);
        Route::get('/admin/purchases', [\App\Http\Controllers\Api\V1\BookPurchaseController::class, 'adminIndex']);

        // ── Phase 8: Admin Author Verification Management ──
        Route::get('/admin/author-verification/pending', [\App\Http\Controllers\Api\V1\AdminAuthorVerificationController::class, 'pendingList']);
        Route::post('/admin/author-verification/{userId}/approve', [\App\Http\Controllers\Api\V1\AdminAuthorVerificationController::class, 'approve']);
        Route::post('/admin/author-verification/{userId}/reject', [\App\Http\Controllers\Api\V1\AdminAuthorVerificationController::class, 'reject']);

        // ── Sales & Orders ──
        Route::get('/sales', [BookOrderController::class, 'sales']);
        Route::post('/sales', [BookOrderController::class, 'storeSale']);
        Route::get('/sales/stats', [BookOrderController::class, 'salesStats']);
        Route::get('/print-orders', [BookOrderController::class, 'orders']);
        Route::post('/print-orders', [BookOrderController::class, 'storeOrder']);
        Route::patch('/print-orders/{order}/status', [BookOrderController::class, 'updateOrderStatus']);
        Route::post('/sales/import', SalesImportController::class)->middleware('throttle:sales-import');

        // ── Website Management (CMS) ──
        Route::prefix('website')->group(function () {
            Route::get('/content', [SiteContentController::class, 'index']);
            Route::post('/content', [SiteContentController::class, 'store']);
            Route::post('/content/bulk', [SiteContentController::class, 'bulkUpdate']);
            Route::get('/faqs', [SiteContentController::class, 'faqIndex']);
            Route::post('/faqs', [SiteContentController::class, 'faqStore']);
            Route::put('/faqs/{faq}', [SiteContentController::class, 'faqUpdate']);
            Route::delete('/faqs/{faq}', [SiteContentController::class, 'faqDestroy']);
            Route::get('/testimonials', [SiteContentController::class, 'testimonialIndex']);
            Route::post('/testimonials', [SiteContentController::class, 'testimonialStore']);
            Route::put('/testimonials/{testimonial}', [SiteContentController::class, 'testimonialUpdate']);
            Route::delete('/testimonials/{testimonial}', [SiteContentController::class, 'testimonialDestroy']);
        }
        );

    }
    );

    // ── Royalties & Payments ──
    Route::get('/royalties', [RoyaltyCalculationController::class, 'index'])->middleware('admin');
    Route::get('/royalties/{royaltyCalculation}', [RoyaltyCalculationController::class, 'show'])->middleware('admin');
    Route::post('/royalties/calculate', [RoyaltyCalculationController::class, 'calculate'])->middleware('admin');
    Route::put('/royalties/{royaltyCalculation}/finalize', [RoyaltyCalculationController::class, 'finalize'])->middleware('admin');
    Route::post('/royalties/{royaltyCalculation}/invoice', [RoyaltyCalculationController::class, 'invoice'])->middleware('admin');
    Route::put('/payments/{payment}/mark-paid', [PaymentController::class, 'markPaid'])->middleware('admin');

    // ── Admin Dashboards ──
    Route::prefix('dashboard')->middleware('admin')->group(function () {
        Route::get('/books', [AdminDashboardController::class, 'books']);
        Route::get('/books/stats', [AdminDashboardController::class, 'bookStats']);
        Route::get('/authors', [AdminDashboardController::class, 'authors']);
    }
    );

    // ══════════════════════════════════════════════════════════════════════
    // USER PORTAL — Verified-User Endpoints
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware(['user.portal', 'password.changed'])->group(function () {
        Route::get('/user/dashboard', [AuthorPortalController::class, 'dashboard']);
        Route::get('/user/profile', [AuthorPortalController::class, 'profile']);
        Route::patch('/user/profile', [AuthorPortalController::class, 'updateProfile']);
        Route::post('/user/profile/upload-ktp', [AuthorPortalController::class, 'uploadKtp'])->middleware('throttle:10,1');
        Route::post('/user/profile/upload-photo', [AuthorPortalController::class, 'uploadPhoto'])->middleware('throttle:10,1');
        Route::get('/user/books', [AuthorPortalController::class, 'books']);
        Route::patch('/user/books/{book}', [AuthorPortalController::class, 'updateBook']);
        Route::post('/user/books/{book}/short-pdf', [AuthorPortalController::class, 'uploadShortPdf'])->middleware('throttle:20,1');

        // Require profile completion
        Route::middleware('profile.complete')->group(function () {
            Route::get('/user/contracts', [AuthorPortalController::class, 'contracts']);
            Route::post('/user/contracts/{contract}/sign', [AuthorPortalController::class, 'signContract']);
            Route::get('/user/contracts/{contract}/download-template', [AuthorPortalController::class, 'downloadTemplate']);
            Route::post('/user/contracts/{contract}/upload-signed', [AuthorPortalController::class, 'uploadSigned']);
            Route::get('/user/royalties', [AuthorPortalController::class, 'royalties']);
            Route::get('/user/royalties/{id}/report', [AuthorPortalController::class, 'royaltyReport']);
            Route::get('/user/sales', [AuthorPortalController::class, 'sales']);
            Route::get('/user/print-orders', [AuthorPortalController::class, 'printOrders']);
            Route::post('/user/print-orders', [AuthorPortalController::class, 'storePrintOrder']);
            Route::get('/user/publishing-requests', [AuthorPortalController::class, 'publishingRequests']);
            Route::post('/user/publishing-requests', [AuthorPortalController::class, 'storePublishingRequest']);
            Route::get('/user/books/{book}/tracking', [AuthorPortalController::class, 'bookTracking']);
        }
        );

    // ── User Chat ──
        Route::get('/user/chat', [ChatController::class, 'index']);
        Route::post('/user/chat', [ChatController::class, 'store']);
        Route::get('/user/chat/unread', [ChatController::class, 'unread']);

        // ── Manuscripts ──
        Route::get('/user/manuscripts', [ManuscriptController::class, 'index']);
        Route::post('/user/manuscripts', [ManuscriptController::class, 'store']);
        Route::get('/user/manuscripts/{id}', [ManuscriptController::class, 'show']);
        Route::put('/user/manuscripts/{id}', [ManuscriptController::class, 'update']);
        Route::delete('/user/manuscripts/{id}', [ManuscriptController::class, 'destroy']);
        Route::post('/user/manuscripts/{id}/submit', [ManuscriptController::class, 'submit']);
        Route::post('/user/manuscripts/{id}/upload', [ManuscriptController::class, 'uploadFile']);
        Route::get('/user/manuscripts/{id}/progress', [ManuscriptController::class, 'progress']);

        // ── E-Books ──
        Route::get('/user/ebooks', [AuthorPortalController::class, 'ebooks']);
        Route::get('/user/ebooks/{id}/stats', [AuthorPortalController::class, 'ebookStats']);

        // ── Notifications ──
        Route::get('/user/notifications', [NotificationController::class, 'index']);
        Route::put('/user/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::put('/user/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::put('/user/notification-preferences', [NotificationController::class, 'updatePreferences']);

        // ── Sessions ──
        Route::get('/user/sessions', [SessionController::class, 'index']);
        Route::delete('/user/sessions/{id}', [SessionController::class, 'destroy']);
    }
    );

    // ══════════════════════════════════════════════════════════════════════
    // PERCETAKAN (Printing Press) — Admin-Only
    // ══════════════════════════════════════════════════════════════════════
    Route::prefix('percetakan')->middleware('admin')->group(function () {
        Route::get('/orders/statistics', [PercetakanOrderController::class, 'statistics']);
        Route::apiResource('orders', PercetakanOrderController::class);
        Route::get('/production-jobs/statistics', [ProductionJobController::class, 'statistics']);
        Route::apiResource('production-jobs', ProductionJobController::class);
        Route::get('/materials/statistics', [MaterialController::class, 'statistics']);
        Route::get('/materials/low-stock', [MaterialController::class, 'lowStock']);
        Route::post('/materials/{material}/adjust-stock', [MaterialController::class, 'adjustStock']);
        Route::apiResource('materials', MaterialController::class);
        Route::get('/customers/statistics', [CustomerController::class, 'allStatistics']);
        Route::get('/customers/list', [CustomerController::class, 'list']);
        Route::get('/customers/{customer}/orders', [CustomerController::class, 'orders']);
        Route::get('/customers/{customer}/statistics', [CustomerController::class, 'statistics']);
        Route::apiResource('customers', CustomerController::class);
    }
    );

});

// =============================================================================
// Phase 1 — Digital Library: Book File Routes
// =============================================================================

// Public file access (tidak perlu auth)
Route::prefix('v1/public')->group(function () {
    Route::get('/books/{book}/cover',   [BookFileController::class, 'cover']);
    Route::get('/books/{book}/preview', [BookFileController::class, 'preview']);
    Route::get('/books/{book}/preview-stream', [BookFileController::class, 'previewStream']);
    Route::get('/books/{book}/cover-image', [BookFileController::class, 'coverImage']);
});

// Authenticated file access (baca PDF penuh — harus punya akses beli)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('/books/{book}/read', [BookFileController::class, 'read'])->middleware('check.book.access');
});

// Admin file management
Route::prefix('v1')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/books/{book}/upload-cover', [BookFileController::class, 'uploadCover']);
    Route::post('/admin/books/{book}/upload-pdf',   [BookFileController::class, 'uploadPdf']);
});
