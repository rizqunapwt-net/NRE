<?php

namespace App\Support\ApiDocs;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Routing\Route as IlluminateRoute;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

class ApiDocsGenerator
{
    public function generate(bool $force = true): array
    {
        File::ensureDirectoryExists($this->docsDirectory());

        $exitCode = Artisan::call('scribe:generate', array_filter([
            '--force' => $force ?: null,
        ]));

        if ($exitCode !== 0) {
            throw new \RuntimeException('Scribe generation failed: '.trim(Artisan::output()));
        }

        if (! File::exists($this->yamlPath())) {
            throw new \RuntimeException('Scribe did not produce openapi.yaml in public/docs.');
        }

        $spec = Yaml::parseFile($this->yamlPath()) ?? [];

        if (! is_array($spec)) {
            throw new \RuntimeException('Generated OpenAPI YAML could not be parsed.');
        }

        $spec = $this->enrich($spec);

        File::put(
            $this->jsonPath(),
            json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        $this->generatePdf($spec);

        return [
            'json_path' => $this->jsonPath(),
            'yaml_path' => $this->yamlPath(),
            'pdf_path' => $this->pdfPath(),
            'scribe_output' => trim(Artisan::output()),
            'paths_count' => count($spec['paths'] ?? []),
        ];
    }

    public function loadSpec(): array
    {
        if (! File::exists($this->jsonPath())) {
            throw new \RuntimeException('OpenAPI JSON has not been generated yet. Run php artisan docs:generate.');
        }

        $decoded = json_decode((string) File::get($this->jsonPath()), true);

        if (! is_array($decoded)) {
            throw new \RuntimeException('Stored OpenAPI JSON is invalid.');
        }

        return $decoded;
    }

    public function docsDirectory(): string
    {
        return public_path('docs');
    }

    public function jsonPath(): string
    {
        return $this->docsDirectory().DIRECTORY_SEPARATOR.'openapi.json';
    }

    public function yamlPath(): string
    {
        return $this->docsDirectory().DIRECTORY_SEPARATOR.'openapi.yaml';
    }

    public function pdfPath(): string
    {
        return $this->docsDirectory().DIRECTORY_SEPARATOR.'api-reference.pdf';
    }

    private function enrich(array $spec): array
    {
        $spec['openapi'] = $spec['openapi'] ?? '3.0.3';
        $spec['info'] = array_merge([
            'title' => config('app.name').' API Reference',
            'version' => env('APP_VERSION', '1.0.0'),
            'description' => 'Generated API reference for Swagger UI, ReDoc, and PDF export.',
        ], Arr::get($spec, 'info', []));
        $spec['servers'] = $this->buildServers();
        $spec['components'] = $spec['components'] ?? [];
        $spec['components']['schemas'] = array_merge(
            $spec['components']['schemas'] ?? [],
            $this->baseSchemas()
        );
        $spec['components']['securitySchemes'] = array_merge(
            $spec['components']['securitySchemes'] ?? [],
            [
                'BearerAuth' => [
                    'type' => 'http',
                    'scheme' => 'bearer',
                    'bearerFormat' => 'Sanctum Token',
                    'description' => 'Use a Laravel Sanctum bearer token from the login endpoint.',
                ],
            ]
        );

        $routeMap = $this->routeMetadataMap();
        $paths = [];

        foreach ($spec['paths'] ?? [] as $path => $operations) {
            $normalizedPath = $this->normalizePath($path);
            $paths[$normalizedPath] = [];

            foreach ($operations as $method => $operation) {
                if (! is_array($operation)) {
                    $paths[$normalizedPath][$method] = $operation;
                    continue;
                }

                $httpMethod = strtoupper($method);
                $routeKey = $httpMethod.' '.$normalizedPath;
                $route = $routeMap[$routeKey] ?? null;

                $operation['summary'] = $this->resolveSummary($operation, $route);
                $operation['operationId'] = $operation['operationId'] ?? $this->buildOperationId($normalizedPath, $httpMethod);
                $operation['tags'] = $this->resolveTags($operation, $normalizedPath);
                $operation['description'] = $this->buildDescription($operation['description'] ?? '', $route);
                $operation['x-authentication'] = $route['auth'] ?? false;
                $operation['x-rate-limit'] = $route['rate_limit'] ?? 'No explicit throttle middleware configured.';

                if (($route['auth'] ?? false) === true) {
                    $operation['security'] = $operation['security'] ?? [['BearerAuth' => []]];
                } else {
                    $operation['security'] = $operation['security'] ?? [];
                }

                $operation['parameters'] = $this->withParameterExamples($operation['parameters'] ?? []);

                if (isset($operation['requestBody']) && is_array($operation['requestBody'])) {
                    $operation['requestBody'] = $this->withRequestBodyExamples($operation['requestBody']);
                }

                $operation['responses'] = $this->withStandardResponses(
                    $operation['responses'] ?? [],
                    $httpMethod
                );

                $paths[$normalizedPath][$method] = $operation;
            }
        }

        ksort($paths);
        $spec['paths'] = $paths;

        return $spec;
    }

    private function generatePdf(array $spec): void
    {
        $previousMemoryLimit = ini_get('memory_limit');
        @ini_set('memory_limit', '512M');

        $pdf = Pdf::loadView('pdf.api-docs', [
            'spec' => [
                'info' => $spec['info'] ?? [],
                'servers' => $spec['servers'] ?? [],
                'operations' => $this->pdfOperations($spec),
            ],
            'generatedAt' => now(),
            'baseUrl' => config('app.url'),
        ])->setPaper('a4', 'portrait');

        try {
            File::put($this->pdfPath(), $pdf->output());
        } finally {
            if ($previousMemoryLimit !== false) {
                @ini_set('memory_limit', (string) $previousMemoryLimit);
            }
        }
    }

    private function pdfOperations(array $spec): array
    {
        $operations = [];

        foreach (($spec['paths'] ?? []) as $path => $pathOperations) {
            foreach ($pathOperations as $method => $operation) {
                if (! is_array($operation)) {
                    continue;
                }

                $operations[] = [
                    'method' => strtoupper((string) $method),
                    'path' => $path,
                    'summary' => (string) ($operation['summary'] ?? 'API operation'),
                    'description' => Str::limit(trim((string) ($operation['description'] ?? '')), 280),
                    'tags' => implode(', ', $operation['tags'] ?? []),
                    'auth' => ! empty($operation['x-authentication']) ? 'Bearer token required' : 'Public',
                    'rate_limit' => (string) ($operation['x-rate-limit'] ?? 'No explicit throttle middleware configured.'),
                    'parameter_count' => count($operation['parameters'] ?? []),
                    'request_body_types' => implode(', ', array_keys($operation['requestBody']['content'] ?? [])),
                    'status_codes' => implode(', ', array_keys($operation['responses'] ?? [])),
                ];
            }
        }

        return $operations;
    }

    private function routeMetadataMap(): array
    {
        $map = [];

        foreach (Route::getRoutes() as $route) {
            /** @var IlluminateRoute $route */
            $uri = '/'.ltrim($route->uri(), '/');

            foreach ($route->methods() as $method) {
                if (in_array($method, ['HEAD', 'OPTIONS'], true)) {
                    continue;
                }

                $map[$method.' '.$uri] = [
                    'uri' => $uri,
                    'name' => $route->getName(),
                    'middleware' => $route->gatherMiddleware(),
                    'auth' => $this->requiresAuthentication($route),
                    'rate_limit' => $this->resolveRateLimit($route),
                    'action' => $route->getActionName(),
                ];
            }
        }

        return $map;
    }

    private function buildServers(): array
    {
        $baseUrl = rtrim((string) config('app.url'), '/');

        return [[
            'url' => $baseUrl !== '' ? $baseUrl : '/',
            'description' => 'Application base URL',
        ]];
    }

    private function baseSchemas(): array
    {
        return [
            'StandardSuccessResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean', 'example' => true],
                    'message' => ['type' => 'string', 'nullable' => true, 'example' => 'Request processed successfully.'],
                    'data' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                    'errors' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                ],
            ],
            'StandardErrorResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean', 'example' => false],
                    'message' => ['type' => 'string', 'example' => 'The request could not be processed.'],
                    'data' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                    'errors' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                ],
            ],
        ];
    }

    private function normalizePath(string $path): string
    {
        return '/'.ltrim($path, '/');
    }

    private function resolveSummary(array $operation, ?array $route): string
    {
        if (! empty($operation['summary'])) {
            return (string) $operation['summary'];
        }

        if (! empty($route['action']) && str_contains($route['action'], '@')) {
            [, $method] = explode('@', $route['action']);

            return Str::headline($method);
        }

        if (! empty($route['name'])) {
            return Str::headline(str_replace(['.', '-'], ' ', $route['name']));
        }

        return 'API operation';
    }

    private function resolveTags(array $operation, string $path): array
    {
        if (! empty($operation['tags']) && is_array($operation['tags'])) {
            return $operation['tags'];
        }

        $segments = collect(explode('/', trim($path, '/')))
            ->filter()
            ->values();

        $firstMeaningful = $segments
            ->reject(fn (string $segment): bool => in_array($segment, ['api', 'v1'], true))
            ->first();

        return [Str::headline($firstMeaningful ?: 'General')];
    }

    private function buildDescription(string $description, ?array $route): string
    {
        $parts = array_values(array_filter([
            trim($description),
            $this->authenticationLine($route),
            $this->rateLimitLine($route),
        ]));

        return implode("\n\n", $parts);
    }

    private function authenticationLine(?array $route): string
    {
        if (($route['auth'] ?? false) === true) {
            return 'Authentication: Bearer token required.';
        }

        return 'Authentication: Public endpoint.';
    }

    private function rateLimitLine(?array $route): string
    {
        return 'Rate limit: '.($route['rate_limit'] ?? 'No explicit throttle middleware configured.');
    }

    private function requiresAuthentication(IlluminateRoute $route): bool
    {
        foreach ($route->gatherMiddleware() as $middleware) {
            if (Str::startsWith($middleware, 'auth:') || $middleware === 'auth' || $middleware === 'auth:sanctum') {
                return true;
            }
        }

        return false;
    }

    private function resolveRateLimit(IlluminateRoute $route): string
    {
        $middleware = $route->gatherMiddleware();
        $throttles = collect($middleware)
            ->filter(fn (string $item): bool => Str::startsWith($item, 'throttle:'))
            ->values();

        if ($throttles->isEmpty()) {
            return 'No explicit throttle middleware configured.';
        }

        return $throttles->map(function (string $throttle): string {
            $definition = Str::after($throttle, 'throttle:');

            return $this->describeThrottle($definition);
        })->implode('; ');
    }

    private function describeThrottle(string $definition): string
    {
        $namedLimiters = [
            'api' => '60 requests per minute per authenticated user or IP.',
            'auth' => '10 requests per minute per IP.',
            'sales-import' => '30 requests per minute per authenticated user or IP.',
            'purchases' => '5 requests per minute per authenticated user.',
            'pdf-read' => '30 requests per minute per authenticated user.',
            'webhooks' => '100 requests per minute per IP.',
        ];

        if (array_key_exists($definition, $namedLimiters)) {
            return $namedLimiters[$definition];
        }

        $parts = array_map('trim', explode(',', $definition));

        if (count($parts) >= 2 && is_numeric($parts[0]) && is_numeric($parts[1])) {
            $attempts = (int) $parts[0];
            $minutes = (int) $parts[1];

            return "{$attempts} requests per {$minutes} minute(s).";
        }

        return "Throttle middleware configured: {$definition}.";
    }

    private function withParameterExamples(array $parameters): array
    {
        return array_map(function ($parameter): array {
            if (! is_array($parameter)) {
                return $parameter;
            }

            if (! array_key_exists('example', $parameter)) {
                $parameter['example'] = $this->inferExample(
                    Arr::get($parameter, 'schema.type'),
                    (string) ($parameter['name'] ?? 'value')
                );
            }

            return $parameter;
        }, $parameters);
    }

    private function withRequestBodyExamples(array $requestBody): array
    {
        foreach (($requestBody['content'] ?? []) as $contentType => $content) {
            if (! is_array($content)) {
                continue;
            }

            if (! isset($content['example']) && isset($content['schema']) && is_array($content['schema'])) {
                $requestBody['content'][$contentType]['example'] = $this->buildExampleFromSchema($content['schema']);
            }
        }

        return $requestBody;
    }

    private function withStandardResponses(array $responses, string $httpMethod): array
    {
        $successCode = $this->defaultSuccessCode($httpMethod);

        if (! isset($responses[$successCode])) {
            $responses[$successCode] = $this->jsonResponse(
                $successCode,
                $this->successDescription($httpMethod),
                $this->successExample($successCode)
            );
        } else {
            $responses[$successCode] = $this->ensureJsonExample(
                $responses[$successCode],
                $this->successExample($successCode)
            );
        }

        foreach (['400', '401', '404', '422', '500'] as $statusCode) {
            if (! isset($responses[$statusCode])) {
                $responses[$statusCode] = $this->jsonResponse(
                    $statusCode,
                    $this->errorDescription($statusCode),
                    $this->errorExample($statusCode)
                );
            } else {
                $responses[$statusCode] = $this->ensureJsonExample(
                    $responses[$statusCode],
                    $this->errorExample($statusCode)
                );
            }
        }

        ksort($responses);

        return $responses;
    }

    private function defaultSuccessCode(string $httpMethod): string
    {
        return match ($httpMethod) {
            'POST' => '201',
            default => '200',
        };
    }

    private function successDescription(string $httpMethod): string
    {
        return match ($httpMethod) {
            'POST' => 'Created',
            'DELETE' => 'Deleted',
            default => 'Success',
        };
    }

    private function errorDescription(string $statusCode): string
    {
        return match ($statusCode) {
            '400' => 'Bad Request',
            '401' => 'Unauthorized',
            '404' => 'Not Found',
            '422' => 'Validation Error',
            '500' => 'Internal Server Error',
            default => 'Error',
        };
    }

    private function jsonResponse(string $statusCode, string $description, array $example): array
    {
        return [
            'description' => $description,
            'content' => [
                'application/json' => [
                    'schema' => [
                        '$ref' => str_starts_with($statusCode, '2')
                            ? '#/components/schemas/StandardSuccessResponse'
                            : '#/components/schemas/StandardErrorResponse',
                    ],
                    'example' => $example,
                ],
            ],
        ];
    }

    private function ensureJsonExample(array $response, array $example): array
    {
        $response['content'] = $response['content'] ?? [];
        $response['content']['application/json'] = $response['content']['application/json'] ?? [];
        $response['content']['application/json']['example'] = $response['content']['application/json']['example'] ?? $example;

        return $response;
    }

    private function successExample(string $statusCode): array
    {
        return [
            'success' => true,
            'message' => $statusCode === '201' ? 'Resource created successfully.' : 'Request processed successfully.',
            'data' => [
                'id' => 1,
            ],
            'errors' => new \stdClass(),
        ];
    }

    private function errorExample(string $statusCode): array
    {
        return match ($statusCode) {
            '401' => [
                'success' => false,
                'message' => 'Tidak terautentikasi.',
                'data' => null,
                'errors' => new \stdClass(),
            ],
            '404' => [
                'success' => false,
                'message' => 'Resource not found.',
                'data' => null,
                'errors' => new \stdClass(),
            ],
            '422' => [
                'success' => false,
                'message' => 'Validasi gagal.',
                'data' => null,
                'errors' => [
                    'field' => ['The field is required.'],
                ],
            ],
            '500' => [
                'success' => false,
                'message' => 'An unexpected server error occurred.',
                'data' => null,
                'errors' => new \stdClass(),
            ],
            default => [
                'success' => false,
                'message' => 'The request could not be processed.',
                'data' => null,
                'errors' => new \stdClass(),
            ],
        };
    }

    private function buildOperationId(string $path, string $httpMethod): string
    {
        $segments = collect(explode('/', trim($path, '/')))
            ->map(fn (string $segment): string => Str::camel(str_replace(['{', '}'], '', $segment)))
            ->implode('_');

        return Str::camel(strtolower($httpMethod).'_'.$segments);
    }

    private function buildExampleFromSchema(array $schema): mixed
    {
        if (array_key_exists('example', $schema)) {
            return $schema['example'];
        }

        if (($schema['type'] ?? null) === 'array') {
            $items = $schema['items'] ?? ['type' => 'string'];

            return [$this->buildExampleFromSchema(is_array($items) ? $items : ['type' => 'string'])];
        }

        if (($schema['type'] ?? null) === 'object' || isset($schema['properties'])) {
            $example = [];

            foreach (($schema['properties'] ?? []) as $name => $propertySchema) {
                if (is_array($propertySchema)) {
                    $example[$name] = $this->buildExampleFromSchema($propertySchema);
                }
            }

            return $example;
        }

        return $this->inferExample($schema['type'] ?? 'string', $schema['title'] ?? 'value');
    }

    private function inferExample(?string $type, string $name): mixed
    {
        return match ($type) {
            'integer' => 1,
            'number' => 99.9,
            'boolean' => true,
            'array' => [],
            'string' => $this->inferStringExample($name),
            default => $this->inferStringExample($name),
        };
    }

    private function inferStringExample(string $name): string
    {
        $normalized = Str::lower($name);

        return match (true) {
            str_contains($normalized, 'email') => 'user@example.com',
            str_contains($normalized, 'phone') => '08123456789',
            str_contains($normalized, 'slug') => 'contoh-slug',
            str_contains($normalized, 'date') => now()->toDateString(),
            str_contains($normalized, 'time') => now()->toIso8601String(),
            str_contains($normalized, 'status') => 'draft',
            str_contains($normalized, 'token') => 'your-token',
            str_contains($normalized, 'password') => 'secret-password',
            str_contains($normalized, 'file') || str_contains($normalized, 'image') => 'binary-file',
            default => 'example-'.$normalized,
        };
    }
}
