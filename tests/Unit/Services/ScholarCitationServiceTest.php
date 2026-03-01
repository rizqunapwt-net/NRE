<?php

namespace Tests\Unit\Services;

use App\Models\Author;
use App\Models\Book;
use App\Services\ScholarCitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarCitationServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createPublishedBook(array $overrides = []): Book
    {
        $author = Author::factory()->create(['name' => 'Dr. Warto']);

        return Book::factory()->create(array_merge([
            'title' => 'Sinyal dari Desa',
            'subtitle' => 'Transformasi Sosial',
            'author_id' => $author->id,
            'published_year' => 2026,
            'isbn' => '978-634-7576-13-2',
            'is_published' => true,
        ], $overrides));
    }

    public function test_generate_apa_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'apa');

        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('2026', $citation);
        $this->assertStringContainsString('Rizquna', $citation);
    }

    public function test_generate_mla_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'mla');

        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('2026', $citation);
    }

    public function test_generate_chicago_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'chicago');

        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('Jakarta', $citation);
    }

    public function test_generate_ieee_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'ieee');

        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('2026', $citation);
    }

    public function test_generate_bibtex_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'bibtex');

        $this->assertStringContainsString('@book{', $citation);
        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('978-634-7576-13-2', $citation);
    }

    public function test_generate_ris_format(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $citation = $service->generate($book, 'ris');

        $this->assertStringContainsString('TY  - BOOK', $citation);
        $this->assertStringContainsString('Sinyal dari Desa', $citation);
        $this->assertStringContainsString('ER  -', $citation);
    }

    public function test_generate_all_returns_all_formats(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $all = $service->generateAll($book);

        $this->assertArrayHasKey('apa', $all);
        $this->assertArrayHasKey('mla', $all);
        $this->assertArrayHasKey('chicago', $all);
        $this->assertArrayHasKey('ieee', $all);
        $this->assertArrayHasKey('bibtex', $all);
        $this->assertArrayHasKey('ris', $all);

        foreach ($all as $citation) {
            $this->assertNotEmpty($citation);
        }
    }

    public function test_invalid_format_throws_exception(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $this->expectException(\InvalidArgumentException::class);
        $service->generate($book, 'invalid_format');
    }

    public function test_turabian_maps_to_chicago(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $chicago = $service->generate($book, 'chicago');
        $turabian = $service->generate($book, 'turabian');

        $this->assertEquals($chicago, $turabian);
    }

    public function test_generate_download_ris(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $payload = $service->generateDownload($book, 'ris');

        $this->assertArrayHasKey('content', $payload);
        $this->assertArrayHasKey('mime', $payload);
        $this->assertArrayHasKey('extension', $payload);
        $this->assertEquals('ris', $payload['extension']);
        $this->assertStringContainsString('TY  - BOOK', $payload['content']);
    }

    public function test_generate_download_bib(): void
    {
        $book = $this->createPublishedBook();
        $service = app(ScholarCitationService::class);

        $payload = $service->generateDownload($book, 'bib');

        $this->assertEquals('bib', $payload['extension']);
        $this->assertStringContainsString('@book{', $payload['content']);
    }
}
