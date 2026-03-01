<?php

namespace Tests\Feature\Console;

use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImportBooksFromFolderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create fake storage for testing
        Storage::fake('books');
    }

    public function test_import_command_dry_run(): void
    {
        // Create temporary test folder structure
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book-1', 0777, true);

        // Create dummy files
        file_put_contents($testFolder . '/test-book-1/cover.jpg', 'dummy-cover-content');
        file_put_contents($testFolder . '/test-book-1/book.pdf', 'dummy-pdf-content');
        file_put_contents($testFolder . '/test-book-1/info.txt', "Title: Test Book\nAuthor: Test Author");

        // Run command with --dry-run
        $this->artisan('books:import', [
            'path' => $testFolder,
            '--dry-run' => true,
        ])
        ->expectsOutputToContain('DRY RUN MODE')
        ->expectsOutputToContain('Processing: Test Book')
        ->assertExitCode(0);

        // No books should be created in dry-run mode
        $this->assertDatabaseCount('books', 0);

        // Cleanup
        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_creates_book(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book-1', 0777, true);

        // Create dummy files
        file_put_contents($testFolder . '/test-book-1/cover.jpg', 'dummy-cover-content');
        file_put_contents($testFolder . '/test-book-1/book.pdf', 'dummy-pdf-content');
        file_put_contents($testFolder . '/test-book-1/info.txt', "Title: Test Book\nAuthor: Test Author");

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true, // Skip actual upload in test
        ])
        ->expectsOutputToContain('Processing:')
        ->assertExitCode(0);

        // Book should be created
        $this->assertDatabaseHas('books', [
            'type' => 'publishing',
            'status' => 'importing', // Should be importing since we skipped upload
        ]);

        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_skips_duplicate_isbn(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book-1', 0777, true);

        // Create author first
        $author = \App\Models\Author::factory()->create();

        // Create book with ISBN first
        \App\Models\Book::create([
            'title' => 'Existing Book',
            'isbn' => '978-602-1234-56-7',
            'type' => 'publishing',
            'status' => 'published',
            'author_id' => $author->id,
        ]);

        // Create required files + metadata file with same ISBN
        file_put_contents($testFolder . '/test-book-1/cover.jpg', 'dummy-cover');
        file_put_contents($testFolder . '/test-book-1/book.pdf', 'dummy-pdf');
        file_put_contents($testFolder . '/test-book-1/metadata.json', json_encode([
            'title' => 'Duplicate Book',
            'author' => $author->name,
            'isbn' => '978-602-1234-56-7',
        ]));

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true,
        ])
        ->expectsOutputToContain('Skipped (already exists)')
        ->assertExitCode(0);

        // Should still only have 1 book
        $this->assertDatabaseCount('books', 1);

        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_tracks_batch_id(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book-1', 0777, true);

        file_put_contents($testFolder . '/test-book-1/cover.jpg', 'dummy-cover');
        file_put_contents($testFolder . '/test-book-1/book.pdf', 'dummy-pdf');
        file_put_contents($testFolder . '/test-book-1/info.txt', "Title: Test Book\nAuthor: Test Author");

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true,
        ])
        ->assertExitCode(0);

        // Check batch_id is set
        $book = Book::first();
        $this->assertNotNull($book);
        if ($book) {
            $this->assertNotNull($book->import_batch_id);
            $this->assertEquals('folder:test-book-1', $book->import_source);
        }

        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_handles_missing_files(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/empty-folder', 0777, true);

        // No PDF or cover in folder

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true,
        ])
        ->expectsOutputToContain('Skip')
        ->assertExitCode(0);

        // No books should be created
        $this->assertDatabaseCount('books', 0);

        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_parses_json_metadata(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book', 0777, true);

        file_put_contents($testFolder . '/test-book/metadata.json', json_encode([
            'title' => 'Book from JSON',
            'author' => 'JSON Author',
            'price' => 150000,
            'category' => 'Technology',
            'isbn' => '978-602-9876-54-3',
        ]));

        file_put_contents($testFolder . '/test-book/cover.jpg', 'dummy-cover');
        file_put_contents($testFolder . '/test-book/book.pdf', 'dummy-pdf');

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true,
        ])
        ->assertExitCode(0);

        $book = Book::first();
        $this->assertNotNull($book);
        if ($book) {
            $this->assertEquals('Book from JSON', $book->title);
            $this->assertEquals(150000, $book->price);
        }

        $this->cleanupTestFolder($testFolder);
    }

    public function test_import_command_parses_txt_metadata(): void
    {
        $testFolder = sys_get_temp_dir() . '/books_import_test_' . uniqid();
        @mkdir($testFolder . '/test-book', 0777, true);

        file_put_contents($testFolder . '/test-book/info.txt', "Title: Book from TXT\nAuthor: TXT Author\nPrice: 120000");
        file_put_contents($testFolder . '/test-book/cover.jpg', 'dummy-cover');
        file_put_contents($testFolder . '/test-book/book.pdf', 'dummy-pdf');

        $this->artisan('books:import', [
            'path' => $testFolder,
            '--skip-upload' => true,
        ])
        ->assertExitCode(0);

        $book = Book::first();
        $this->assertNotNull($book);
        if ($book) {
            $this->assertEquals('Book from TXT', $book->title);
            $this->assertEquals(120000, $book->price);
        }

        $this->cleanupTestFolder($testFolder);
    }

    private function cleanupTestFolder(string $folder): void
    {
        if (is_dir($folder)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($folder, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST
            );

            foreach ($files as $file) {
                if ($file->isDir()) {
                    rmdir($file->getPathname());
                } else {
                    unlink($file->getPathname());
                }
            }

            rmdir($folder);
        }
    }
}
