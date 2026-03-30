<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\DigitalLibrary\Services\BookPurchaseService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(
        private BookPurchaseService $purchaseService,
    ) {}

    /**
     * POST /api/v1/webhooks/payment
     * Callback dari payment gateway (Midtrans/Xendit).
     * 
     * Middleware: verify.webhook:midtrans atau verify.webhook:xendit
     */
    public function handle(Request $request): JsonResponse
    {
        $transactionId = $this->extractTransactionId($request);
        $gatewayId = $this->extractGatewayId($request);
        $status = $this->extractStatus($request);

        Log::info('Payment webhook received', [
            'gateway' => $this->detectGateway($request),
            'transaction_id' => $transactionId,
            'gateway_id' => $gatewayId,
            'status' => $status,
            'ip' => $request->ip(),
        ]);

        if (!$transactionId) {
            Log::warning('Payment webhook missing transaction ID', ['ip' => $request->ip()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Transaction ID tidak ditemukan dalam payload',
            ], 400);
        }

        // Idempotency: Cek apakah sudah diproses
        if ($gatewayId && $this->isWebhookProcessed($gatewayId)) {
            Log::info('Webhook already processed', [
                'gateway_id' => $gatewayId,
                'transaction_id' => $transactionId,
            ]);

            return response()->json([
                'status' => 'already_processed',
                'message' => 'Webhook sudah diproses sebelumnya',
            ]);
        }

        // Gunakan lock untuk prevent race condition
        $lock = Cache::lock("webhook_lock:{$transactionId}", 10);

        try {
            if (!$lock->get()) {
                Log::info('Webhook sedang diproses', ['transaction_id' => $transactionId]);
                return response()->json([
                    'status' => 'processing',
                    'message' => 'Webhook sedang diproses',
                ], 202);
            }

            DB::transaction(function () use ($request, $transactionId, $gatewayId, $status) {
                // Log webhook untuk audit trail
                $this->logWebhook($request, $transactionId, $gatewayId);

                // Proses jika status menunjukkan pembayaran berhasil
                if ($this->isPaymentSuccessful($status)) {
                    $this->purchaseService->confirmPayment(
                        $transactionId,
                        $gatewayId,
                        $request->all()
                    );

                    Log::info('Payment confirmed successfully', [
                        'transaction_id' => $transactionId,
                        'gateway_id' => $gatewayId,
                    ]);
                } else {
                    Log::info('Payment not successful', [
                        'transaction_id' => $transactionId,
                        'status' => $status,
                    ]);
                }
            });

            return response()->json([
                'status' => 'ok',
                'message' => 'Webhook diproses dengan sukses',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Payment webhook: purchase not found', [
                'transaction_id' => $transactionId,
                'gateway_id' => $gatewayId,
            ]);

            return response()->json([
                'status' => 'not_found',
                'message' => 'Transaksi tidak ditemukan',
            ]);

        } catch (\Throwable $e) {
            Log::error('Payment webhook error', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'transaction_id' => $transactionId,
                'gateway_id' => $gatewayId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memproses webhook',
            ], 500);

        } finally {
            if ($lock) {
                $lock->release();
            }
        }
    }

    /**
     * Detect payment gateway dari struktur request.
     */
    private function detectGateway(Request $request): string
    {
        if ($request->has('order_id') && $request->has('signature_key')) {
            return 'midtrans';
        }

        if ($request->header('x-callback-token')) {
            return 'xendit';
        }

        if ($request->has('transaction_status')) {
            return 'midtrans';
        }

        if ($request->has('status') && $request->has('external_id')) {
            return 'xendit';
        }

        return 'unknown';
    }

    /**
     * Extract transaction ID dari request.
     */
    private function extractTransactionId(Request $request): ?string
    {
        return $request->input('order_id')
            ?? $request->input('transaction_id')
            ?? $request->input('external_id')
            ?? $request->input('reference_id');
    }

    /**
     * Extract gateway ID dari request.
     */
    private function extractGatewayId(Request $request): ?string
    {
        return $request->input('payment_id')
            ?? $request->input('id')
            ?? $request->input('transaction_time');
    }

    /**
     * Extract status dari request.
     */
    private function extractStatus(Request $request): ?string
    {
        return $request->input('transaction_status')
            ?? $request->input('status')
            ?? $request->input('payment_status');
    }

    /**
     * Cek apakah status menunjukkan pembayaran berhasil.
     */
    private function isPaymentSuccessful(?string $status): bool
    {
        return in_array($status, [
            'capture',
            'settlement',
            'PAID',
            'COMPLETED',
            'SUCCESS',
        ], true);
    }

    /**
     * Cek apakah webhook sudah diproses sebelumnya (idempotency).
     */
    private function isWebhookProcessed(string $gatewayId): bool
    {
        return DB::table('webhook_logs')
            ->where('gateway_id', $gatewayId)
            ->where('processed_at', '>', now()->subHours(24))
            ->exists();
    }

    /**
     * Log webhook untuk audit trail.
     */
    private function logWebhook(Request $request, string $transactionId, ?string $gatewayId): void
    {
        DB::table('webhook_logs')->insert([
            'transaction_id' => $transactionId,
            'gateway_id' => $gatewayId,
            'gateway_type' => $this->detectGateway($request),
            'payload' => json_encode($request->all()),
            'signature' => $request->header('x-callback-token')
                ?? $request->input('signature_key'),
            'processed_at' => now(),
            'created_at' => now(),
        ]);
    }
}
