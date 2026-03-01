<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'password.changed' => \App\Http\Middleware\EnsurePasswordChanged::class,
            'profile.complete' => \App\Http\Middleware\EnsureProfileComplete::class,
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
            'user.portal' => \App\Http\Middleware\EnsureUserPortalAccess::class,
            'verify.webhook'    => \App\Http\Middleware\VerifyWebhookSignature::class,
            'check.book.access' => \App\Http\Middleware\CheckBookAccess::class,
            'check.book.ownership' => \App\Http\Middleware\CheckBookOwnership::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\RequestIdMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Validasi gagal.',
                    'errors' => $exception->errors(),
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Tidak terautentikasi.',
                    'errors' => [],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Akses ditolak.',
                    'errors' => [],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 403);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'message' => $exception->getMessage() ?: 'Terjadi kesalahan.',
                    'errors' => [],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], $exception->getStatusCode());
        });
    })->create();
