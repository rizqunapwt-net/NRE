<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Payments\PaymentService;
use App\Domain\Royalty\RoyaltyCalculationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\CalculateRoyaltyRequest;
use App\Http\Requests\FinalizeRoyaltyRequest;
use App\Models\RoyaltyCalculation;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class RoyaltyCalculationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly RoyaltyCalculationService $royaltyCalculationService,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $calculations = RoyaltyCalculation::with(['author', 'items.book'])
            ->when($request->period_month, fn($q) => $q->where('period_month', $request->period_month))
            ->latest()
            ->paginate(min($request->integer('per_page', 15), 100));

        return $this->success($calculations);
    }

    public function show(RoyaltyCalculation $royaltyCalculation): JsonResponse
    {
        return $this->success($royaltyCalculation->load(['author', 'items.book', 'items.sale']));
    }

    public function calculate(CalculateRoyaltyRequest $request): JsonResponse
    {
        try {
            $calculations = $this->royaltyCalculationService->calculateForPeriod(
                periodMonth: $request->validated('period_month'),
                user: $request->user(),
            );
        } catch (ConflictHttpException $exception) {
            return $this->error($exception->getMessage(), 409);
        }

        return $this->success($calculations);
    }

    public function finalize(FinalizeRoyaltyRequest $request, RoyaltyCalculation $royaltyCalculation): JsonResponse
    {
        try {
            $royaltyCalculation = $this->royaltyCalculationService->finalize($royaltyCalculation, $request->user());
        } catch (ConflictHttpException $exception) {
            return $this->error($exception->getMessage(), 409);
        }

        return $this->success($royaltyCalculation->load('author'));
    }

    public function update(Request $request, RoyaltyCalculation $royaltyCalculation): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:royalty_items,id',
            'items.*.royalty_percentage' => 'required|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            $royaltyCalculation = $this->royaltyCalculationService->updateItems(
                $royaltyCalculation, 
                $validated['items']
            );
            
            if ($request->has('notes')) {
                $royaltyCalculation->update(['notes' => $validated['notes']]);
            }

        } catch (ConflictHttpException $exception) {
            return $this->error($exception->getMessage(), 409);
        }

        return $this->success($royaltyCalculation);
    }

    public function invoice(RoyaltyCalculation $royaltyCalculation): JsonResponse
    {
        try {
            $payment = $this->paymentService->generateInvoice($royaltyCalculation, request()->user());
        } catch (ConflictHttpException $exception) {
            return $this->error($exception->getMessage(), 409);
        }

        return $this->success($payment, 201);
    }

    public function pay(Request $request, RoyaltyCalculation $royaltyCalculation): JsonResponse
    {
        $request->validate([
            'payment_reference' => 'required|string|max:255',
            'paid_at' => 'required|date|before_or_equal:today',
            'payment_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if (!$royaltyCalculation->payment) {
            return $this->error('Invoice belum dibuat untuk royalti ini.', 400);
        }

        $payment = $this->paymentService->markPaid(
            $royaltyCalculation->payment,
            $request->user(),
            $request->payment_reference,
            $request->paid_at,
            $request->file('payment_proof')
        );

        return $this->success($payment);
    }
}
