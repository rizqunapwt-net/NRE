<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SavedSearch;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedSearchController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $searches = $request->user()->savedSearches()->latest()->get();
        return $this->success($searches);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
        ]);

        $savedSearch = $request->user()->savedSearches()->create($validated);

        return $this->success($savedSearch, 201);
    }

    public function destroy(SavedSearch $savedSearch): JsonResponse
    {
        if ($savedSearch->user_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $savedSearch->delete();
        return $this->success(null, 204);
    }
}
