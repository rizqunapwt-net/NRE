<?php

namespace App\Http\Controllers\Docs;

use App\Http\Controllers\Controller;
use App\Support\ApiDocs\ApiDocsGenerator;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ApiDocsController extends Controller
{
    public function swagger(): View
    {
        return view('docs.swagger', [
            'specUrl' => url('/docs/openapi.json'),
            'pdfUrl' => url('/docs/pdf'),
            'redocUrl' => url('/docs/redoc'),
        ]);
    }

    public function redoc(): View
    {
        return view('docs.redoc', [
            'specUrl' => url('/docs/openapi.json'),
            'pdfUrl' => url('/docs/pdf'),
            'swaggerUrl' => url('/docs/swagger'),
        ]);
    }

    public function openApi(ApiDocsGenerator $generator): JsonResponse
    {
        try {
            $spec = $generator->loadSpec();
        } catch (\RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => null,
                'errors' => new \stdClass(),
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($spec);
    }

    public function pdf(ApiDocsGenerator $generator): BinaryFileResponse|JsonResponse
    {
        $pdfPath = $generator->pdfPath();

        if (! file_exists($pdfPath)) {
            return response()->json([
                'success' => false,
                'message' => 'PDF export has not been generated yet. Run php artisan docs:generate.',
                'data' => null,
                'errors' => new \stdClass(),
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->file($pdfPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="api-reference.pdf"',
        ]);
    }
}
