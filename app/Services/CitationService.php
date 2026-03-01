<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookCitation;
use Illuminate\Support\Facades\Cache;

class CitationService
{
    private const CACHE_TTL = 86400; // 24 jam

    /**
     * Generate citation string in the requested format dengan caching.
     * All formats generated at runtime — no stored strings in DB.
     *
     * @param  string  $format  apa|mla|chicago|ieee
     */
    public function generate(Book $book, string $format = 'apa'): string
    {
        $cacheKey = "citation:{$book->id}:{$format}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($book, $format) {
            $citation = $book->citation;
            $author   = $book->author;

            $authorName    = $author?->name ?? 'Unknown Author';
            $title         = $book->title ?? 'Untitled';
            $year          = $citation?->publication_year ?? ($book->published_year ?? now()->year);
            $publisher     = $citation?->getEffectivePublisherName() ?? 'Penerbit Rizquna Elfath';
            $city          = $citation?->getEffectiveCity() ?? 'Jakarta';
            $edition       = $citation?->edition;
            $doi           = $citation?->doi;

            return match (strtolower($format)) {
                'mla'     => $this->formatMla($authorName, $title, $publisher, $city, $year, $edition, $doi),
                'chicago' => $this->formatChicago($authorName, $title, $publisher, $city, $year, $edition, $doi),
                'ieee'    => $this->formatIeee($authorName, $title, $publisher, $city, $year, $doi),
                'bibtex'  => $this->generateBibtex($book),
                default   => $this->formatApa($authorName, $title, $publisher, $city, $year, $edition, $doi),
            };
        });
    }

    /**
     * Generate all citation formats dengan caching.
     */
    public function generateAll(Book $book): array
    {
        $cacheKey = "citation:{$book->id}:all";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($book) {
            return [
                'apa'     => $this->generate($book, 'apa'),
                'mla'     => $this->generate($book, 'mla'),
                'chicago' => $this->generate($book, 'chicago'),
                'ieee'    => $this->generate($book, 'ieee'),
                'bibtex'  => $this->generateBibtex($book),
            ];
        });
    }

    /**
     * Invalidate cache saat book atau citation diupdate.
     */
    public function invalidateCache(Book $book): void
    {
        Cache::forget("citation:{$book->id}:apa");
        Cache::forget("citation:{$book->id}:mla");
        Cache::forget("citation:{$book->id}:chicago");
        Cache::forget("citation:{$book->id}:ieee");
        Cache::forget("citation:{$book->id}:all");
        Cache::forget("citation:{$book->id}:bibtex");
    }

    // ─── Private Formatters ───

    private function formatApa(
        string $author, string $title, string $publisher,
        string $city, int $year, ?string $edition, ?string $doi
    ): string {
        $parts   = [];
        $parts[] = "{$author}. ({$year}).";
        $parts[] = $edition ? "{$title} ({$edition} ed.)." : "{$title}.";
        $parts[] = "{$city}: {$publisher}.";
        if ($doi) {
            $parts[] = "https://doi.org/{$doi}";
        }

        return implode(' ', $parts);
    }

    private function formatMla(
        string $author, string $title, string $publisher,
        string $city, int $year, ?string $edition, ?string $doi
    ): string {
        $editionStr = $edition ? ", {$edition} ed." : '';
        $doiStr     = $doi ? " doi:{$doi}." : '';

        return "{$author}. \"{$title}\"{$editionStr}. {$publisher}, {$year}.{$doiStr}";
    }

    private function formatChicago(
        string $author, string $title, string $publisher,
        string $city, int $year, ?string $edition, ?string $doi
    ): string {
        $editionStr = $edition ? ", {$edition} edition" : '';
        $doiStr     = $doi ? " doi:{$doi}." : '.';

        return "{$author}. {$title}{$editionStr}. {$city}: {$publisher}, {$year}{$doiStr}";
    }

    private function formatIeee(
        string $author, string $title, string $publisher,
        string $city, int $year, ?string $doi
    ): string {
        $doiStr = $doi ? ", doi: {$doi}" : '';

        return "{$author}, \"{$title},\" {$publisher}, {$city}, {$year}{$doiStr}.";
    }

    /**
     * Generate BibTeX format.
     */
    private function generateBibtex(Book $book): string
    {
        $citation = $book->citation;
        $author = $book->author;
        
        $authorName = $author?->name ?? 'Unknown';
        $year = $citation?->publication_year ?? ($book->published_year ?? date('Y'));
        $key = strtolower(explode(' ', $authorName)[0]) . $year;

        $escape = fn (string $s) => str_replace(['\\', '{', '}', '&', '#', '%', '_'], ['\\\\', '\\{', '\\}', '\\&', '\\#', '\\%', '\\_'], $s);

        $bibtex = "@book{{$key},\n";
        $bibtex .= "  title     = {" . $escape($book->title) . "},\n";
        $bibtex .= "  author    = {" . $escape($authorName) . "},\n";
        $bibtex .= "  year      = {" . $year . "},\n";
        $bibtex .= "  publisher = {Penerbit Rizquna Elfath},\n";
        $bibtex .= "  address   = {Jakarta},\n";
        
        if ($book->isbn) {
            $bibtex .= "  isbn      = {" . $book->isbn . "},\n";
        }
        
        if ($citation?->doi) {
            $bibtex .= "  doi       = {" . $citation->doi . "},\n";
        }
        
        $bibtex .= "}\n";

        return $bibtex;
    }
}
