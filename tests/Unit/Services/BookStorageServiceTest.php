<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Services\BookStorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BookStorageServiceTest extends TestCase
{
    use RefreshDatabase;

    private BookStorageService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config(['books.disk' => 'books']);
        $this->service = new BookStorageService();
        Storage::fake('books');
        Storage::fake('public');
    }

    /** @test */
    public function it_can_store_book_cover()
    {
        $book = Book::factory()->create(['is_published' => false]);
        $file = UploadedFile::fake()->image('cover.jpg');

        $path = $this->service->uploadCover($book, $file);

        $this->assertNotNull($path);
        Storage::disk('books')->assertExists($path);
        $this->assertEquals($path, $book->fresh()->cover_path);
    }

    /** @test */
    public function it_can_store_book_pdf()
    {
        $book = Book::factory()->create();
        $pdfPath = public_path('docs/api-reference.pdf');
        if (file_exists($pdfPath)) {
            $file = new UploadedFile($pdfPath, 'api-reference.pdf', 'application/pdf', null, true);
        } else {
            $file = UploadedFile::fake()->create('book.pdf', 1024, 'application/pdf');
        }

        $path = $this->service->uploadFullPdf($book, $file);

        $this->assertNotNull($path);
        Storage::disk('books')->assertExists($path);
        $this->assertEquals($path, $book->fresh()->pdf_full_path);
    }

    /** @test */
    public function it_deletes_old_file_when_uploading_new_one()
    {
        $book = Book::factory()->create(['is_published' => false]);
        $oldFile = UploadedFile::fake()->image('old.jpg');
        $oldPath = $this->service->uploadCover($book, $oldFile);
        
        Storage::disk('books')->assertExists($oldPath);

        sleep(1); // Ensure different timestamp
        $newFile = UploadedFile::fake()->image('new.jpg');
        $this->service->uploadCover($book->fresh(), $newFile);

        Storage::disk('books')->assertMissing($oldPath);
    }
}
