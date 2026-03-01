<?php

namespace Tests\Unit\Services;

use App\Services\WebhookVerificationService;
use Illuminate\Http\Request;
use Tests\TestCase;

class WebhookVerificationServiceTest extends TestCase
{
    public function test_midtrans_signature_verification(): void
    {
        config(['services.midtrans.server_key' => 'test-server-key']);

        $service = new WebhookVerificationService();

        $orderId = 'ORDER-123';
        $statusCode = '200';
        $grossAmount = '100000';
        $expectedSignature = hash('sha512', "{$orderId}{$statusCode}{$grossAmount}test-server-key");

        $request = Request::create('/webhook', 'POST', [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $expectedSignature,
        ]);

        $result = $service->verifyMidtrans($request);
        $this->assertTrue($result);
    }

    public function test_midtrans_rejects_invalid_signature(): void
    {
        config(['services.midtrans.server_key' => 'test-server-key']);

        $service = new WebhookVerificationService();

        $request = Request::create('/webhook', 'POST', [
            'order_id' => 'ORDER-123',
            'status_code' => '200',
            'gross_amount' => '100000',
            'signature_key' => 'invalid-signature',
        ]);

        $this->assertFalse($service->verifyMidtrans($request));
    }

    public function test_verify_routing_to_correct_gateway(): void
    {
        config([
            'services.midtrans.server_key' => 'test-key',
        ]);

        $service = new WebhookVerificationService();

        // Test Midtrans routing
        $orderId = 'ORDER-123';
        $midtransSignature = hash('sha512', "{$orderId}200100000test-key");

        $midtransRequest = Request::create('/webhook', 'POST', [
            'order_id' => $orderId,
            'signature_key' => $midtransSignature,
            'status_code' => '200',
            'gross_amount' => '100000',
        ]);

        $this->assertTrue($service->verify($midtransRequest, 'midtrans'));
    }

    public function test_verify_returns_false_for_unknown_gateway(): void
    {
        $service = new WebhookVerificationService();
        $request = new Request();

        $this->assertFalse($service->verify($request, 'unknown'));
    }
}
