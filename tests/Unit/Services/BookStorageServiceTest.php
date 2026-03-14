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
        $this->service = new BookStorageService();
        Storage::fake('private');
        Storage::fake('public');
    }

    /** @test */
    public function it_can_store_book_cover()
    {
        $book = Book::factory()->create();
        $file = UploadedFile::fake()->image('cover.jpg');

        $path = $this->service->storeCover($book, $file);

        $this->assertNotNull($path);
        Storage::disk('private')->assertExists($path);
        $this->assertEquals($path, $book->fresh()->cover_path);
    }

    /** @test */
    public function it_can_store_book_pdf()
    {
        $book = Book::factory()->create();
        $file = UploadedFile::fake()->create('book.pdf', 1024, 'application/pdf');

        $path = $this->service->storePdf($book, $file);

        $this->assertNotNull($path);
        Storage::disk('private')->assertExists($path);
        $this->assertEquals($path, $book->fresh()->pdf_full_path);
    }

    /** @test */
    public function it_deletes_old_file_when_uploading_new_one()
    {
        $book = Book::factory()->create();
        $oldFile = UploadedFile::fake()->image('old.jpg');
        $oldPath = $this->service->storeCover($book, $oldFile);
        
        Storage::disk('private')->assertExists($oldPath);

        $newFile = UploadedFile::fake()->image('new.jpg');
        $this->service->storeCover($book, $newFile);

        Storage::disk('private')->assertMissing($oldPath);
    }
}
