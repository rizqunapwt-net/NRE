<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Services\CitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CitationBibtexEscapingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_bibtex_escapes_special_characters(): void
    {
        $book = Book::withoutEvents(fn () => Book::factory()->create([
            'title' => 'Analisis & Evaluasi: Metode {Baru} untuk 100% Akurasi',
            'published_year' => 2026,
        ]));

        $service = app(CitationService::class);
        $bibtex = $service->generate($book, 'bibtex');

        $this->assertStringContainsString('@book', $bibtex);
        $this->assertStringContainsString('\\&', $bibtex);
        $this->assertStringContainsString('\\{', $bibtex);
        $this->assertStringContainsString('\\}', $bibtex);
        $this->assertStringContainsString('\\%', $bibtex);
    }

    public function test_bibtex_normal_title_unchanged(): void
    {
        $book = Book::withoutEvents(fn () => Book::factory()->create([
            'title' => 'Belajar Laravel',
            'published_year' => 2026,
        ]));

        $service = app(CitationService::class);
        $bibtex = $service->generate($book, 'bibtex');

        $this->assertStringContainsString('Belajar Laravel', $bibtex);
    }
}
