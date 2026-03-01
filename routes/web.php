<?php

use Illuminate\Support\Facades\Route;

/*
 |--------------------------------------------------------------------------
 | Web Routes — SPA Fallback
 |--------------------------------------------------------------------------
 | Serve React SPA for all routes except /api/*
 | API routes handled by routes/api.php via RouteServiceProvider
 |--------------------------------------------------------------------------
 */

// SPA fallback — catch all non-API routes
Route::get('/{any}', function () {
    // Testing: return simple HTML response
    if (app()->environment('testing')) {
        return response('<html><body>Test Response</body></html>')
            ->header('Content-Type', 'text/html');
    }
    // Always serve built index.html (works for both local and production)
    $path = public_path('build/index.html');
    if (file_exists($path)) {
        return response(file_get_contents($path))
            ->header('Content-Type', 'text/html');
    }

    return response('App not built yet. Run: cd admin-panel && npm run build', 200);
})->where('any', '^(?!api|assets|images|favicon).*$');
