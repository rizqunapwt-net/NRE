<?php

use App\Http\Controllers\UnifiedLoginController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // Named 'login' route — Laravel's auth middleware redirects here
    Route::get('login', fn () => redirect('/admin/login'))
        ->name('login');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [UnifiedLoginController::class, 'logout'])
        ->name('logout');
});
