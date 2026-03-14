<?php

namespace App\Providers;

use App\Domain\DigitalLibrary\Events\BookPurchased;
use App\Domain\DigitalLibrary\Listeners\GrantAccessAfterPurchase;
use App\Domain\DigitalLibrary\Listeners\SendPurchaseNotification;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Spatie\Activitylog\Models\Activity;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\BookAccessService::class);
        $this->app->singleton(\App\Services\CitationService::class);
        $this->app->singleton(\App\Services\CatalogCacheService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(BookPurchased::class, GrantAccessAfterPurchase::class);
        Event::listen(BookPurchased::class, SendPurchaseNotification::class);

        $observers = [
            [\App\Models\Book::class, \App\Observers\BookObserver::class],
            [\App\Models\Sale::class, \App\Observers\SaleObserver::class],
        ];

        $optionalObservers = [
            ['App\Models\SalesImport', 'App\Observers\SalesImportObserver'],
            ['App\Models\RoyaltyCalculation', 'App\Observers\RoyaltyCalculationObserver'],
            ['App\Models\Accounting\Journal', 'App\Observers\Accounting\JournalObserver'],
        ];

        foreach ($observers as [$model, $observer]) {
            try {
                $model::observe($observer);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Observer registration skipped: {$e->getMessage()}");
            }
        }

        foreach ($optionalObservers as [$model, $observer]) {
            try {
                if (class_exists($model) && class_exists($observer)) {
                    $model::observe($observer);
                }
            } catch (\Throwable $e) {
                // Silently skip
            }
        }

        $this->validateEnvironment();

        // ─── Validate PDF Parser Dependencies ───
        \App\Services\PdfParserService::validateDependencies();

        // ─── Validate Google Workspace Configuration ───
        \App\Services\Google\GoogleWorkspaceService::validateConfiguration();

        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('sales-import', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('purchases', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()->id);
        });

        RateLimiter::for('pdf-read', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()->id);
        });

        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip());
        });

        try {
            if (class_exists(Activity::class)) {
                Activity::creating(function (Activity $activity): void {
                    if (app()->runningInConsole()) {
                        return;
                    }

                    $properties = collect($activity->properties ?? []);
                    $properties->put('request_meta', [
                        'ip_address' => request()->ip(),
                        'method' => request()->method(),
                        'path' => request()->path(),
                        'route_name' => optional(request()->route())->getName(),
                        'user_agent' => str((string) request()->userAgent())->limit(500)->value(),
                    ]);
                    $activity->properties = $properties;
                });
            }
        } catch (\Throwable $e) {
            // Skip
        }
    }

    private function validateEnvironment(): void
    {
        $missingVars = [];
        $critical = [
            'APP_KEY',
            'DB_CONNECTION',
            'MIDTRANS_SERVER_KEY',
            'MIDTRANS_CLIENT_KEY',
            'MIDTRANS_MERCHANT_ID',
        ];

        foreach ($critical as $var) {
            if (!env($var)) {
                $missingVars[] = $var;
            }
        }

        // Google Workspace is optional but recommended
        $googleCritical = [
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
        ];

        foreach ($googleCritical as $var) {
            if (!env($var)) {
                \Illuminate\Support\Facades\Log::warning("Optional environment variable missing: {$var}. Google Login will be disabled.");
            }
        }

        if (!empty($missingVars)) {
            if (app()->environment('production')) {
                throw new \RuntimeException(
                    "Missing critical environment variables: " . implode(', ', $missingVars)
                );
            } else {
                foreach ($missingVars as $var) {
                    \Illuminate\Support\Facades\Log::error("Critical environment variable missing: {$var}");
                }
            }
        }
    }
}
