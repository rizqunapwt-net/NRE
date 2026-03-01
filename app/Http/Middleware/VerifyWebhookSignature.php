<?php

namespace App\Http\Middleware;

use App\Services\WebhookVerificationService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    public function __construct(
        private WebhookVerificationService $verificationService,
    ) {}

    /**
     * Handle an incoming webhook request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $gateway = ''): Response
    {
        // Detect gateway from request or parameter
        $gateway = $gateway ?: $this->detectGateway($request);

        if (!$gateway) {
            Log::warning('Webhook gateway not specified', ['ip' => $request->ip()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Payment gateway not specified',
            ], 400);
        }

        // Verify signature
        if (!$this->verificationService->verify($request, $gateway)) {
            Log::warning('Webhook signature verification failed', [
                'gateway' => $gateway,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'status' => 'unauthorized',
                'message' => 'Invalid webhook signature',
            ], 401);
        }

        Log::info('Webhook signature verified successfully', [
            'gateway' => $gateway,
            'ip' => $request->ip(),
        ]);

        return $next($request);
    }

    /**
     * Detect payment gateway from request structure (Midtrans only).
     */
    private function detectGateway(Request $request): string
    {
        // Midtrans specific fields
        if ($request->has('order_id') && $request->has('signature_key')) {
            return 'midtrans';
        }

        if ($request->has('transaction_status')) {
            return 'midtrans';
        }

        return '';
    }
}
