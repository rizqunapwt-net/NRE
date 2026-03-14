<?php

namespace App\Http\Controllers\Api\Percetakan;

use App\Http\Controllers\Controller;
use App\Http\Resources\Percetakan\ProductionJobResource;
use App\Models\Percetakan\Order;
use App\Models\Percetakan\ProductionJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductionJobController extends Controller
{
    /**
     * Display a listing of production jobs.
     */
    public function index(Request $request)
    {
        $query = ProductionJob::with(['order.customer', 'machine', 'operator', 'supervisor', 'jobCards']);

        // Filter by stage
        if ($request->filled('stage')) {
            $query->where('stage', $request->stage);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by order
        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        // Filter by machine
        if ($request->filled('machine_id')) {
            $query->where('machine_id', $request->machine_id);
        }

        // Filter by operator
        if ($request->filled('operator_id')) {
            $query->where('operator_id', $request->operator_id);
        }

        // Search by job number
        if ($request->filled('search')) {
            $query->where('job_number', 'like', '%'.$request->search.'%');
        }

        // Sort
        $allowedSorts = ['created_at', 'updated_at', 'job_number', 'status', 'started_at', 'completed_at'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts) ? $request->get('sort_by') : 'created_at';
        $sortOrder = in_array($request->get('sort_order'), ['asc', 'desc']) ? $request->get('sort_order') : 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $jobs = $query->paginate($perPage);

        return ProductionJobResource::collection($jobs);
    }

    /**
     * Store a newly created production job.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:percetakan_orders,id'],
            'stage' => ['required', 'in:pre-press,printing,finishing,qc,packaging'],
            'machine_id' => ['nullable', 'exists:percetakan_machines,id'],
            'operator_id' => ['nullable', 'exists:users,id'],
            'supervisor_id' => ['nullable', 'exists:users,id'],
            'instructions' => ['nullable', 'string'],
        ]);

        // Generate job number
        $jobNumber = 'JOB-'.date('Ymd').'-'.str_pad(ProductionJob::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

        $job = ProductionJob::create([
            'job_number' => $jobNumber,
            'order_id' => $validated['order_id'],
            'stage' => $validated['stage'],
            'status' => 'pending',
            'machine_id' => $validated['machine_id'] ?? null,
            'operator_id' => $validated['operator_id'] ?? null,
            'supervisor_id' => $validated['supervisor_id'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Production job berhasil dibuat',
            'data' => new ProductionJobResource($job->load(['order.customer', 'machine', 'operator'])),
        ], 201);
    }

    /**
     * Display the specified production job.
     */
    public function show(ProductionJob $productionJob): JsonResponse
    {
        $productionJob->load(['order.customer', 'machine', 'operator', 'supervisor', 'jobCards']);

        return response()->json([
            'success' => true,
            'data' => new ProductionJobResource($productionJob),
        ]);
    }

    /**
     * Update the specified production job.
     */
    public function update(Request $request, ProductionJob $productionJob): JsonResponse
    {
        $validated = $request->validate([
            'stage' => ['sometimes', 'in:pre-press,printing,finishing,qc,packaging'],
            'status' => ['sometimes', 'in:pending,in_progress,completed,on_hold'],
            'machine_id' => ['nullable', 'exists:percetakan_machines,id'],
            'operator_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $productionJob->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Production job berhasil diupdate',
            'data' => new ProductionJobResource($productionJob->fresh(['order.customer', 'machine', 'operator'])),
        ]);
    }

    /**
     * Remove the specified production job.
     */
    public function destroy(ProductionJob $productionJob): JsonResponse
    {
        if ($productionJob->isInProgress()) {
            return response()->json([
                'success' => false,
                'message' => 'Production job yang sedang berjalan tidak dapat dihapus.',
            ], 422);
        }

        $productionJob->delete();

        return response()->json([
            'success' => true,
            'message' => 'Production job berhasil dihapus.',
        ]);
    }

    /**
     * Get production statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_jobs' => ProductionJob::count(),
            'by_stage' => [
                'pre-press' => ProductionJob::where('stage', 'pre-press')->count(),
                'printing' => ProductionJob::where('stage', 'printing')->count(),
                'finishing' => ProductionJob::where('stage', 'finishing')->count(),
                'qc' => ProductionJob::where('stage', 'qc')->count(),
                'packaging' => ProductionJob::where('stage', 'packaging')->count(),
            ],
            'by_status' => [
                'pending' => ProductionJob::where('status', 'pending')->count(),
                'in_progress' => ProductionJob::where('status', 'in_progress')->count(),
                'completed' => ProductionJob::where('status', 'completed')->count(),
                'on_hold' => ProductionJob::where('status', 'on_hold')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
