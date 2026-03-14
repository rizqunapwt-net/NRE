<?php

namespace App\Jobs;

use App\Models\Book;
use App\Models\BookPreview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class GeneratePreviewPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300; // 5 menit max
    public array $backoff = [10, 30, 60]; // Exponential backoff

    public function __construct(
        private Book   $book,
        private string $fullPdfPath,
        private int    $previewPages = 10,
    ) {
        $this->onQueue('high');
    }

    public function handle(): void
    {
        ini_set('memory_limit', '512M');

        $sourceDisk = (string) config('books.disk', 'books');
        if (! Storage::disk($sourceDisk)->exists($this->fullPdfPath)) {
            $sourceDisk = 'public';
        }

        if (! Storage::disk($sourceDisk)->exists($this->fullPdfPath)) {
            Log::warning("GeneratePreviewPdf skipped for book {$this->book->id}: source PDF missing at {$this->fullPdfPath}");
            return;
        }

        $destinationDisk = (string) config('books.disk', 'books');
        $tempFullPath = tempnam(sys_get_temp_dir(), 'pdf_full_');
        $tempPreviewPath = tempnam(sys_get_temp_dir(), 'pdf_preview_');

        if ($tempFullPath === false || $tempPreviewPath === false) {
            Log::warning("GeneratePreviewPdf skipped for book {$this->book->id}: could not create temp files");
            return;
        }

        try {
            file_put_contents(
                $tempFullPath,
                Storage::disk($sourceDisk)->get($this->fullPdfPath)
            );

            $pageCount = $this->extractPages($tempFullPath, $tempPreviewPath, $this->previewPages);
            $previewPages = min($this->previewPages, $pageCount);

            $previewPath = "pdfs/preview/{$this->book->id}_preview.pdf";
            Storage::disk($destinationDisk)->put(
                $previewPath,
                file_get_contents($tempPreviewPath),
                ['visibility' => 'private']
            );

            $bookUpdates = ['pdf_preview_path' => $previewPath];
            if (! $this->book->total_pdf_pages) {
                $bookUpdates['total_pdf_pages'] = $pageCount;
            }
            if (! $this->book->page_count) {
                $bookUpdates['page_count'] = $pageCount;
            }

            $this->book->update($bookUpdates);

            BookPreview::updateOrCreate(
                ['book_id' => $this->book->id],
                [
                    'preview_pages'    => $previewPages,
                    'allow_preview'    => true,
                    'preview_pdf_path' => $previewPath,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning("Could not generate preview for book {$this->book->id}: " . $e->getMessage());
        } finally {
            @unlink($tempPreviewPath);
            @unlink($tempFullPath);
        }
    }

    /**
     * Extract N halaman pertama dari PDF menggunakan FPDI dengan watermark.
     */
    private function extractPages(string $sourcePath, string $destPath, int $pages): int
    {
        $pdf       = new Fpdi();
        $pageCount = $pdf->setSourceFile($sourcePath);

        if ($pageCount < 1) {
            throw new \RuntimeException('PDF tidak memiliki halaman yang bisa dipreview.');
        }

        $extract   = min($pages, $pageCount);

        for ($i = 1; $i <= $extract; $i++) {
            $templateId = $pdf->importPage($i);
            $size       = $pdf->getTemplateSize($templateId);
            
            // Tentukan orientasi halaman
            $orientation = $size['width'] > $size['height'] ? 'L' : 'P';
            $pdf->AddPage($orientation, [$size['width'], $size['height']]);
            
            // Import halaman asli
            $pdf->useTemplate($templateId);
            
            // Tambah watermark "PREVIEW" diagonal
            $this->addWatermark($pdf, $size['width'], $size['height']);
            
            // Tambah footer
            $this->addFooter($pdf, $size['width'], $size['height'], $i, $extract);
        }

        $pdf->Output($destPath, 'F');

        return $pageCount;
    }

    /**
     * Tambah watermark sederhana yang kompatibel dengan FPDI/FPDF default.
     */
    private function addWatermark(Fpdi $pdf, float $width, float $height): void
    {
        $pdf->SetTextColor(220, 220, 220);
        $pdf->SetFont('Helvetica', 'B', 32);

        $text = 'PREVIEW';
        $textWidth = $pdf->GetStringWidth($text);
        $x = max(8.0, ($width - $textWidth) / 2);
        $y = max(35.0, $height / 2);

        $pdf->Text($x, $y, $text);
        $pdf->SetTextColor(0, 0, 0);
    }

    /**
     * Tambah footer di bawah halaman.
     */
    private function addFooter(Fpdi $pdf, float $width, float $height, int $currentPage, int $totalPages): void
    {
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->SetY($height - 15);
        
        $footerText = "Preview - Halaman {$currentPage} dari {$totalPages} - Beli full version di rizquna.id";
        $pdf->Cell($width, 10, $footerText, 0, 0, 'C');
        
        $pdf->SetTextColor(0, 0, 0);
    }

    /**
     * Handler ketika job gagal setelah semua percobaan.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GeneratePreviewPdf failed for book {$this->book->id}: {$exception->getMessage()}");
    }
}
