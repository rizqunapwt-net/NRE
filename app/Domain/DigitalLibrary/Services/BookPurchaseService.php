<?php

namespace App\Domain\DigitalLibrary\Services;

use App\Models\Book;
use App\Models\BookPurchase;
use App\Models\User;
use App\Services\BookAccessService;
use App\Services\WebhookVerificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookPurchaseService
{
    public function __construct(
        private BookAccessService $accessService,
    ) {}

    /**
     * Initiate pembelian buku dengan idempotency check.
     *
     * @return array{purchase: BookPurchase, payment_url: string|null, is_existing: bool}
     * @throws \DomainException Jika user sudah punya akses aktif
     */
    public function initiatePurchase(
        User $user,
        Book $book,
        string $accessType = 'permanent',
        string $paymentMethod = 'midtrans'
    ): array {
        return DB::transaction(function () use ($user, $book, $accessType, $paymentMethod) {
            // Lock user row untuk prevent race condition
            $user = User::lockForUpdate()->find($user->id);

            // Cek akses aktif (user sudah beli sebelumnya)
            if ($this->accessService->hasAccess($user, $book)) {
                throw new \DomainException('Anda sudah memiliki akses ke buku ini.');
            }

            // Cek apakah sudah ada pembelian PENDING untuk buku ini
            // Idempotency: prevent double purchase dari double-click
            $existingPending = BookPurchase::where('user_id', $user->id)
                ->where('book_id', $book->id)
                ->where('payment_status', 'pending')
                ->where('created_at', '>', now()->subHours(2)) // pending max 2 jam
                ->first();

            if ($existingPending) {
                // Return existing pending purchase (idempotent)
                return [
                    'purchase' => $existingPending,
                    'payment_url' => $this->generatePaymentUrl($existingPending),
                    'is_existing' => true,
                ];
            }

            // Create new purchase
            $purchase = BookPurchase::create([
                'user_id' => $user->id,
                'book_id' => $book->id,
                'amount_paid' => $book->price ?? 0,
                'currency' => 'IDR',
                'payment_method' => $paymentMethod,
                'payment_status' => 'pending',
                'transaction_id' => $this->generateTransactionId(),
                'access_type' => $accessType,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'expires_at' => now()->addHours(2), // pending expires dalam 2 jam
            ]);

            return [
                'purchase' => $purchase,
                'payment_url' => $this->generatePaymentUrl($purchase),
                'is_existing' => false,
            ];
        });
    }

    /**
     * Konfirmasi pembayaran dengan idempotency.
     * Dipanggil dari webhook setelah signature verified.
     */
    public function confirmPayment(
        string $transactionId,
        ?string $gatewayId,
        array $metadata = []
    ): BookPurchase {
        $gatewayId ??= $transactionId; // Fallback ke transaction_id jika gateway_id tidak ada
        return DB::transaction(function () use ($transactionId, $gatewayId, $metadata) {
            // Lock purchase untuk prevent race condition dari multiple webhook calls
            $purchase = BookPurchase::where('transaction_id', $transactionId)
                ->lockForUpdate()
                ->firstOrFail();

            // Idempotency: Jika sudah paid, return saja (webhook retry)
            if ($purchase->isPaid()) {
                return $purchase;
            }

            // Mark as paid
            $purchase->markAsPaid($gatewayId, $metadata);

            // OTOMATIS: Grant akses ke buku
            $this->accessService->grantAfterPayment($purchase);

            // Dispatch events (notification, analytics, dll)
            event(new \App\Domain\DigitalLibrary\Events\BookPurchased($purchase));

            return $purchase->fresh();
        });
    }

    /**
     * Generate transaction ID unik.
     */
    private function generateTransactionId(): string
    {
        return 'TXN-' . strtoupper(Str::random(16));
    }

    /**
     * Generate URL pembayaran menggunakan Midtrans Snap.
     */
    private function generatePaymentUrl(BookPurchase $purchase): ?string
    {
        // Configure Midtrans
        \Midtrans\Config::$serverKey    = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized  = true;
        \Midtrans\Config::$is3ds        = true;

        $params = [
            'transaction_details' => [
                'order_id'     => $purchase->transaction_id,
                'gross_amount' => (int) $purchase->amount_paid,
            ],
            'customer_details' => [
                'first_name' => $purchase->user->name,
                'email'      => $purchase->user->email,
            ],
            'item_details' => [
                [
                    'id'       => "BOOK-{$purchase->book_id}",
                    'price'    => (int) $purchase->amount_paid,
                    'quantity' => 1,
                    'name'     => str($purchase->book->title)->limit(50)->value(),
                ]
            ],
            // URL redirect setelah user selesai bayar (Frontend)
            'callbacks' => [
                'finish' => config('app.frontend_url', 'http://localhost:3000') . "/purchases/{$purchase->transaction_id}/status",
            ]
        ];

        try {
            $snapToken = \Midtrans\Snap::getSnapToken($params);
            // Kita bisa return Snap Token ke frontend (jika pakai Snap Pop-up)
            // Atau return Redirect URL (jika mau redirect ke halaman Midtrans)
            return "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Midtrans Error for TXN {$purchase->transaction_id}: " . $e->getMessage());
            
            // Fallback: Return manual confirmation URL untuk testing jika gateway down
            return config('app.url') . "/api/v1/purchases/{$purchase->transaction_id}/confirm";
        }
    }

    /**
     * Get purchase by transaction ID.
     */
    public function getByTransactionId(string $transactionId): ?BookPurchase
    {
        return BookPurchase::where('transaction_id', $transactionId)->first();
    }

    /**
     * Get pending purchases yang expired.
     */
    public function getExpiredPendingPurchases(int $hours = 2)
    {
        return BookPurchase::where('payment_status', 'pending')
            ->where('created_at', '<', now()->subHours($hours))
            ->get();
    }

    /**
     * Cancel expired pending purchases.
     */
    public function cancelExpiredPurchases(int $hours = 2): int
    {
        return BookPurchase::where('payment_status', 'pending')
            ->where('created_at', '<', now()->subHours($hours))
            ->update(['payment_status' => 'expired']);
    }
}
