<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Models\BookCitation;
use App\Models\User;
use App\Services\CitationService;
use App\Services\WebhookVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class CitationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_generate_apa_citation(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        app(CitationService::class)->invalidateCache($book);

        $service = app(CitationService::class);
        $citation = $service->generate($book, 'apa');

        $this->assertStringContainsString('Belajar Laravel', $citation);
        $this->assertStringContainsString('2024', $citation);
        $this->assertStringContainsString('Penerbit Rizquna Elfath', $citation);
    }

    public function test_generate_mla_citation(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);
        $citation = $service->generate($book, 'mla');

        $this->assertStringContainsString('Belajar Laravel', $citation);
        $this->assertStringContainsString('2024', $citation);
    }

    public function test_generate_chicago_citation(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);
        $citation = $service->generate($book, 'chicago');

        $this->assertStringContainsString('Belajar Laravel', $citation);
        $this->assertStringContainsString('Jakarta', $citation);
    }

    public function test_generate_ieee_citation(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);
        $citation = $service->generate($book, 'ieee');

        $this->assertStringContainsString('Belajar Laravel', $citation);
        $this->assertStringContainsString('2024', $citation);
    }

    public function test_generate_bibtex_citation(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
            'isbn' => '978-602-1234-56-7',
        ]);

        $service = app(CitationService::class);
        $citation = $service->generate($book, 'bibtex');

        $this->assertStringContainsString('@book', $citation);
        $this->assertStringContainsString('Belajar Laravel', $citation);
        $this->assertStringContainsString('978-602-1234-56-7', $citation);
    }

    public function test_generate_all_citations(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);
        $all = $service->generateAll($book);

        $this->assertArrayHasKey('apa', $all);
        $this->assertArrayHasKey('mla', $all);
        $this->assertArrayHasKey('chicago', $all);
        $this->assertArrayHasKey('ieee', $all);
        $this->assertArrayHasKey('bibtex', $all);
    }

    public function test_citation_is_cached(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);

        // First call
        $service->generate($book, 'apa');

        // Second call (should use cache)
        $cacheKey = "citation:{$book->id}:apa";
        $this->assertTrue(\Illuminate\Support\Facades\Cache::has($cacheKey));
    }

    public function test_cache_is_invalidated_on_update(): void
    {
        $book = Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2024,
        ]);

        $service = app(CitationService::class);

        // Generate and cache
        $service->generate($book, 'apa');
        $cacheKey = "citation:{$book->id}:apa";
        $this->assertTrue(\Illuminate\Support\Facades\Cache::has($cacheKey));

        // Invalidate
        $service->invalidateCache($book);
        $this->assertFalse(\Illuminate\Support\Facades\Cache::has($cacheKey));
    }
}
