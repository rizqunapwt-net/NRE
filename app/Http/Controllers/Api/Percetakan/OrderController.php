<?php

namespace App\Http\Controllers\Api\Percetakan;

use App\Http\Controllers\Controller;
use App\Http\Requests\Percetakan\StoreOrderRequest;
use App\Http\Requests\Percetakan\UpdateOrderRequest;
use App\Http\Resources\Percetakan\OrderResource;
use App\Models\Percetakan\Order;
use App\Models\Percetakan\OrderSpecification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Order::with(['customer', 'product', 'specification', 'sales']);

        if ($status = $request->query('status')) {
            $query->where('status', '=', $status);
        }

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', '=', $customerId);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('order_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('order_date', '<=', $request->to_date);
        }

        if ($request->filled('search')) {
            $query->where('order_number', 'like', '%'.$request->search.'%');
        }

        $allowedSorts = ['created_at', 'updated_at', 'order_date', 'total_amount', 'status', 'order_number', 'deadline'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts) ? $request->get('sort_by') : 'created_at';
        $sortOrder = in_array($request->get('sort_order'), ['asc', 'desc']) ? $request->get('sort_order') : 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $orders = $query->paginate($perPage);

        return $this->success(OrderResource::collection($orders), 200, [
            'current_page' => $orders->currentPage(),
            'total' => $orders->total(),
            'per_page' => $orders->perPage(),
            'last_page' => $orders->lastPage(),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $orderNumber = 'ORD-'.date('Ymd').'-'.str_pad(Order::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

        $quantity = $request->quantity;
        $unitPrice = $request->unit_price;
        $subtotal = $quantity * $unitPrice;
        $discountAmount = $request->discount_amount ?? 0;
        $taxAmount = ($subtotal - $discountAmount) * 0.11;
        $totalAmount = $subtotal - $discountAmount + $taxAmount;
        $depositPct = $request->deposit_percentage ?? 50;
        $depositAmount = $totalAmount * ($depositPct / 100);

        $order = Order::create([
            'order_number' => $orderNumber,
            'customer_id' => $request->customer_id,
            'sales_id' => auth()->id(),
            'status' => 'inquiry',
            'product_id' => $request->product_id,
            'specifications' => $request->specifications,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'deposit_percentage' => $depositPct,
            'deposit_amount' => $depositAmount,
            'deposit_paid' => 0,
            'balance_due' => $totalAmount,
            'order_date' => now()->format('Y-m-d'),
            'deadline' => $request->deadline,
            'priority' => $request->priority ?? 'normal',
            'is_rush_order' => $request->is_rush_order ?? false,
            'production_notes' => $request->production_notes,
            'customer_notes' => $request->customer_notes,
        ]);

        OrderSpecification::create([
            'order_id' => $order->id,
            'size' => $request->specifications['size'],
            'paper_type' => $request->specifications['paper_type'],
            'paper_weight' => $request->specifications['paper_weight'],
            'colors_inside' => $request->specifications['colors_inside'],
            'colors_outside' => $request->specifications['colors_outside'],
            'binding_type' => $request->specifications['binding_type'] ?? null,
            'finishing' => $request->specifications['finishing'] ?? null,
            'pages_count' => $request->specifications['pages_count'] ?? null,
            'print_run' => $request->specifications['print_run'] ?? 1,
            'waste_allowance' => $request->specifications['waste_allowance'] ?? 5,
            'custom_fields' => $request->specifications['custom_fields'] ?? null,
        ]);

        return $this->success(new OrderResource($order->load(['customer', 'product', 'specification'])), 201, ['message' => 'Order berhasil dibuat']);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['customer', 'product', 'specification', 'productionJobs', 'invoices']);

        return $this->success(new OrderResource($order));
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $updateData = $request->validated();

        if (isset($updateData['unit_price']) || isset($updateData['quantity'])) {
            $quantity = $updateData['quantity'] ?? $order->quantity;
            $unitPrice = $updateData['unit_price'] ?? $order->unit_price;
            $subtotal = $quantity * $unitPrice;
            $discountAmount = $updateData['discount_amount'] ?? $order->discount_amount;
            $taxAmount = ($subtotal - $discountAmount) * 0.11;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;

            $updateData['subtotal'] = $subtotal;
            $updateData['tax_amount'] = $taxAmount;
            $updateData['total_amount'] = $totalAmount;
            $updateData['balance_due'] = $totalAmount - ($order->deposit_paid ?? 0);
        }

        if (isset($updateData['specifications'])) {
            $order->specification?->update([
                'size' => $updateData['specifications']['size'] ?? $order->specification->size,
                'paper_type' => $updateData['specifications']['paper_type'] ?? $order->specification->paper_type,
                'paper_weight' => $updateData['specifications']['paper_weight'] ?? $order->specification->paper_weight,
                'colors_inside' => $updateData['specifications']['colors_inside'] ?? $order->specification->colors_inside,
                'colors_outside' => $updateData['specifications']['colors_outside'] ?? $order->specification->colors_outside,
                'binding_type' => $updateData['specifications']['binding_type'] ?? $order->specification->binding_type,
                'finishing' => $updateData['specifications']['finishing'] ?? $order->specification->finishing,
                'pages_count' => $updateData['specifications']['pages_count'] ?? $order->specification->pages_count,
                'print_run' => $updateData['specifications']['print_run'] ?? $order->specification->print_run,
                'waste_allowance' => $updateData['specifications']['waste_allowance'] ?? $order->specification->waste_allowance,
            ]);
            unset($updateData['specifications']);
        }

        $order->update($updateData);

        return $this->success(new OrderResource($order->fresh(['customer', 'product', 'specification'])), 200, ['message' => 'Order berhasil diupdate']);
    }

    public function destroy(Order $order): JsonResponse
    {
        if (in_array($order->status, ['in_production', 'completed', 'delivered'])) {
            return $this->error('Order tidak dapat dibatalkan karena sudah dalam produksi', 422);
        }

        $order->update(['status' => 'cancelled']);

        return $this->success(null, 200, ['message' => 'Order berhasil dibatalkan']);
    }

    public function statistics(): JsonResponse
    {
        $stats = [
            'total_orders' => Order::count(),
            'by_status' => [
                'inquiry' => Order::where('status', 'inquiry')->count(),
                'quoted' => Order::where('status', 'quoted')->count(),
                'confirmed' => Order::where('status', 'confirmed')->count(),
                'in_production' => Order::where('status', 'in_production')->count(),
                'completed' => Order::where('status', 'completed')->count(),
                'delivered' => Order::where('status', 'delivered')->count(),
            ],
            'this_month' => [
                'orders' => Order::whereMonth('created_at', now()->month)->count(),
                'revenue' => Order::whereMonth('created_at', now()->month)->sum('total_amount'),
            ],
            'pending_approval' => Order::whereIn('status', ['inquiry', 'quoted'])->count(),
            'urgent_orders' => Order::where('is_rush_order', true)->orWhere('priority', 'urgent')->count(),
        ];

        return $this->success($stats);
    }
}
