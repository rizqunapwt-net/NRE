<?php

namespace App\Http\Controllers\Api\Percetakan;

use App\Http\Controllers\Controller;
use App\Http\Resources\Percetakan\CustomerResource;
use App\Http\Resources\Percetakan\OrderResource;
use App\Models\Percetakan\Customer;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $query = Customer::with('user');

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by city
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        // Search by name, code, email, or phone
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('code', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%')
                    ->orWhere('phone', 'like', '%'.$request->search.'%')
                    ->orWhere('company_name', 'like', '%'.$request->search.'%');
            });
        }

        // Sort
        $allowedSorts = ['name', 'code', 'email', 'company_name', 'created_at', 'updated_at'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts) ? $request->get('sort_by') : 'name';
        $sortOrder = in_array($request->get('sort_order'), ['asc', 'desc']) ? $request->get('sort_order') : 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $customers = $query->paginate($perPage);

        return $this->success(CustomerResource::collection($customers), 200, [
            'current_page' => $customers->currentPage(),
            'total' => $customers->total(),
            'per_page' => $customers->perPage(),
            'last_page' => $customers->lastPage(),
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:retail,corporate,reseller'],
            'email' => ['nullable', 'email', 'max:255', 'unique:percetakan_customers,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'credit_limit' => ['nullable', 'numeric', 'min:0', 'default:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0', 'default:0'],
            'discount_percentage' => ['nullable', 'numeric', 'between:0,100', 'default:0'],
            'notes' => ['nullable', 'string'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        // Generate customer code
        $code = 'CUST-'.date('Ymd').'-'.str_pad(Customer::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);
        $validated['code'] = $code;

        $customer = Customer::create($validated);

        return $this->success(new CustomerResource($customer), 201, ['message' => 'Customer berhasil dibuat']);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['user', 'orders' => function ($q) {
            $q->with('product')->orderBy('created_at', 'desc')->limit(10);
        }]);

        return $this->success(new CustomerResource($customer));
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:retail,corporate,reseller'],
            'email' => ['nullable', 'email', 'max:255', 'unique:percetakan_customers,email,'.$customer->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'between:0,100'],
            'status' => ['sometimes', 'in:active,inactive,blacklisted'],
            'notes' => ['nullable', 'string'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $customer->update($validated);

        return $this->success(new CustomerResource($customer->fresh(['user'])), 200, ['message' => 'Customer berhasil diupdate']);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        // Check if customer has orders
        if ($customer->orders()->count() > 0) {
            return $this->error('Customer tidak dapat dihapus karena memiliki order', 422);
        }

        $customer->update(['status' => 'inactive']);

        return $this->success(null, 200, ['message' => 'Customer berhasil dihapus (soft delete)']);
    }

    /**
     * Get customer's orders.
     */
    public function orders(Customer $customer, Request $request): JsonResponse
    {
        $query = $customer->orders()->with(['product', 'sales']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $allowedSorts = ['created_at', 'updated_at', 'order_date', 'total_amount', 'status'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts) ? $request->get('sort_by') : 'created_at';
        $sortOrder = $request->get('sort_order') === 'asc' ? 'asc' : 'desc';
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

    /**
     * Get customer statistics.
     */
    public function statistics(Customer $customer): JsonResponse
    {
        $stats = [
            'total_orders' => $customer->orders()->count(),
            'orders_by_status' => [
                'inquiry' => $customer->orders()->where('status', 'inquiry')->count(),
                'confirmed' => $customer->orders()->where('status', 'confirmed')->count(),
                'in_production' => $customer->orders()->where('status', 'in_production')->count(),
                'completed' => $customer->orders()->where('status', 'completed')->count(),
                'delivered' => $customer->orders()->where('status', 'delivered')->count(),
            ],
            'total_revenue' => $customer->orders()->sum('total_amount'),
            'formatted_total_revenue' => 'Rp '.number_format($customer->orders()->sum('total_amount'), 0, ',', '.'),
            'outstanding_balance' => $customer->orders()->sum('balance_due'),
            'formatted_outstanding' => 'Rp '.number_format($customer->orders()->sum('balance_due'), 0, ',', '.'),
            'average_order_value' => $customer->orders()->avg('total_amount') ?? 0,
            'last_order_date' => $customer->orders()->latest()->first()?->order_date?->format('Y-m-d'),
            'credit_utilization' => $customer->credit_limit > 0
                ? round(($customer->orders()->sum('balance_due') / $customer->credit_limit) * 100, 2)
                : 0,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get customer list for dropdown/autocomplete.
     */
    public function list(Request $request): JsonResponse
    {
        $query = Customer::where('status', 'active')
            ->select('id', 'code', 'name', 'company_name', 'type', 'email', 'phone');

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('code', 'like', '%'.$request->search.'%')
                    ->orWhere('company_name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $customers = $query->limit(50)->get();

        return $this->success($customers->map(fn ($c) => [
            'id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'company_name' => $c->company_name,
            'full_name' => $c->company_name ?? $c->name,
            'type' => $c->type,
            'email' => $c->email,
            'phone' => $c->phone,
        ]));
    }

    /**
     * Get all customer statistics.
     */
    public function allStatistics(): JsonResponse
    {
        $stats = [
            'total_customers' => Customer::where('status', 'active')->count(),
            'by_type' => [
                'retail' => Customer::where('type', 'retail')->where('status', 'active')->count(),
                'corporate' => Customer::where('type', 'corporate')->where('status', 'active')->count(),
                'reseller' => Customer::where('type', 'reseller')->where('status', 'active')->count(),
            ],
            'by_status' => [
                'active' => Customer::where('status', 'active')->count(),
                'inactive' => Customer::where('status', 'inactive')->count(),
                'blacklisted' => Customer::where('status', 'blacklisted')->count(),
            ],
            'with_credit' => Customer::where('credit_limit', '>', 0)->where('status', 'active')->count(),
            'total_credit_extended' => Customer::where('status', 'active')->sum('credit_limit'),
            'total_outstanding' => Customer::where('status', 'active')
                ->join('percetakan_orders', 'percetakan_customers.id', '=', 'percetakan_orders.customer_id')
                ->sum('percetakan_orders.balance_due'),
            'top_customers' => Customer::withCount(['orders' => function ($q) {
                $q->selectRaw('SUM(total_amount) as total_revenue')
                    ->orderByDesc('total_revenue');
            }])
                ->orderByDesc('orders_count')
                ->limit(10)
                ->get()
                ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'company_name' => $c->company_name,
                'total_orders' => $c->orders_count,
            ]),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
