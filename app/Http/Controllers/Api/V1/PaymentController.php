<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Payments\PaymentService;
use App\Http\Controllers\Controller;
use App\Http\Requests\MarkPaymentPaidRequest;
use App\Models\Payment;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PaymentService $paymentService) {}

    public function index(): JsonResponse
    {
        $payments = Payment::with(['royaltyCalculation.author'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'method' => 'Bank Transfer', // Default for now
                'amount' => (float) $p->amount,
                'status' => $p->status->value,
                'date' => $p->paid_at ? $p->paid_at->toISOString() : $p->created_at->toISOString(),
            ]);

        return response()->json($payments);
    }

    public function markPaid(MarkPaymentPaidRequest $request, Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->markPaid(
            payment: $payment,
            user: $request->user(),
            paymentReference: $request->validated('payment_reference'),
            paidAt: $request->validated('paid_at'),
        );

        return $this->success($payment);
    }
}
