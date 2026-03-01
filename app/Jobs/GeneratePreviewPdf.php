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

        $disk = 'books';
        if (!Storage::disk($disk)->exists($this->fullPdfPath)) {
            $disk = 'public';
        }

        // Download full PDF ke temporary file
        $tempFullPath = tempnam(sys_get_temp_dir(), 'pdf_full_');
        file_put_contents(
            $tempFullPath,
            Storage::disk($disk)->get($this->fullPdfPath)
        );

        try {
            // Buat preview PDF
            $tempPreviewPath = tempnam(sys_get_temp_dir(), 'pdf_preview_');
            $this->extractPages($tempFullPath, $tempPreviewPath, $this->previewPages);

            // Upload preview ke S3/MinIO
            $previewPath = "pdfs/preview/{$this->book->id}_preview.pdf";
            Storage::disk($disk)->put(
                $previewPath,
                file_get_contents($tempPreviewPath),
                ['visibility' => 'private']
            );

            // Update book record
            $this->book->update(['pdf_preview_path' => $previewPath]);

            // Update atau create book_previews record
            BookPreview::updateOrCreate(
                ['book_id' => $this->book->id],
                [
                    'preview_pages'    => $this->previewPages,
                    'allow_preview'    => true,
                    'preview_pdf_path' => $previewPath,
                ]
            );

            @unlink($tempPreviewPath);
        } catch (\Exception $e) {
            Log::warning("Could not generate preview for book {$this->book->id}: " . $e->getMessage());
        }

        // Cleanup temp files
        @unlink($tempFullPath);
    }

    /**
     * Extract N halaman pertama dari PDF menggunakan FPDI dengan watermark.
     */
    private function extractPages(string $sourcePath, string $destPath, int $pages): void
    {
        $pdf       = new Fpdi();
        $pageCount = $pdf->setSourceFile($sourcePath);
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
    }

    /**
     * Tambah watermark "PREVIEW" diagonal di tengah halaman.
     */
    private function addWatermark(Fpdi $pdf, float $width, float $height): void
    {
        // Simpan state graphics
        $pdf->SetAlpha(0.3); // Transparency 30%
        $pdf->SetTextColor(200, 200, 200); // Abu-abu terang
        $pdf->SetFont('helvetica', 'B', 50); // Font besar
        
        // Hitung posisi tengah
        $text = 'PREVIEW';
        $textWidth = $pdf->GetStringWidth($text);
        
        // Rotasi 45 derajat di tengah halaman
        $pdf->StartTransform();
        $pdf->Rotate(45, $width / 2, $height / 2);
        $pdf->Text(($width - $textWidth) / 2, $height / 2, $text);
        $pdf->StopTransform();
        
        // Restore state
        $pdf->SetAlpha(1.0);
        $pdf->SetTextColor(0, 0, 0);
    }

    /**
     * Tambah footer di bawah halaman.
     */
    private function addFooter(Fpdi $pdf, float $width, float $height, int $currentPage, int $totalPages): void
    {
        $pdf->SetFontSize(8);
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
