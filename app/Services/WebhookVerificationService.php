<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookVerificationService
{
    /**
     * Verify Midtrans webhook signature.
     * 
     * Signature = SHA512(order_id + status_code + gross_amount + server_key)
     */
    public function verifyMidtrans(Request $request): bool
    {
        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $serverKey = config('services.midtrans.server_key');

        if (!$serverKey || !$orderId || !$statusCode || !$grossAmount) {
            Log::warning('Midtrans webhook missing required fields', [
                'order_id' => $orderId,
                'status_code' => $statusCode,
                'gross_amount' => $grossAmount,
            ]);
            return false;
        }

        $signatureKey = hash('sha512', "{$orderId}{$statusCode}{$grossAmount}{$serverKey}");
        $providedSignature = $request->input('signature_key');

        $isValid = hash_equals($signatureKey, $providedSignature ?? '');

        if (!$isValid) {
            Log::warning('Midtrans webhook signature mismatch', [
                'order_id' => $orderId,
                'expected' => substr($signatureKey, 0, 16) . '...',
                'provided' => substr($providedSignature ?? '', 0, 16) . '...',
            ]);
        }

        return $isValid;
    }

    /**
     * Verify webhook signature.
     * Currently supports Midtrans only.
     */
    public function verify(Request $request, string $gateway = 'midtrans'): bool
    {
        if (strtolower($gateway) !== 'midtrans') {
            Log::warning('Unsupported payment gateway', ['gateway' => $gateway]);
            return false;
        }
        return $this->verifyMidtrans($request);
    }
}
