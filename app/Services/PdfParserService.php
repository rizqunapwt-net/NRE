<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use setasign\Fpdi\Fpdi;

class PdfParserService
{
    /**
     * Validate that required PDF parser dependencies are available.
     * Called during application boot to warn about missing tools.
     */
    public static function validateDependencies(): void
    {
        $missing = [];

        // Python3 is used for advanced PDF text extraction
        if (!self::commandExists('python3')) {
            $missing[] = 'python3 (optional: for advanced PDF parsing)';
        }

        // pdftotext is a fallback for PDF text extraction
        if (!self::commandExists('pdftotext')) {
            $missing[] = 'pdftotext (optional: for basic PDF parsing fallback)';
        }

        if (!empty($missing)) {
            \Illuminate\Support\Facades\Log::warning(
                'PDF parser dependencies missing (PDF parsing will be degraded): ' . implode(', ', $missing)
            );
        }
    }

    /**
     * Parse PDF dan kembalikan payload siap simpan ke DB.
     *
     * @return array{
     *   subtitle:?string,
     *   publisher:?string,
     *   publisher_city:?string,
     *   year:?int,
     *   edition:?string,
     *   abstract:?string,
     *   full_text:?string,
     *   total_pdf_pages:int,
     *   bibliography_start_page:?int,
     *   pdf_metadata:array<string, mixed>,
     *   references:array<int, array<string, mixed>>
     * }
     */
    public function parse(string $storagePath): array
    {
        ['path' => $pdfPath, 'temporary' => $temporary] = $this->prepareLocalPdf($storagePath);

        try {
            $totalPages = $this->extractTotalPages($pdfPath);

            $parsed = $this->runPythonParser($pdfPath);
            $source = 'python';

            if (! is_array($parsed) || empty($parsed['page_texts'])) {
                $parsed = $this->runPdftotextParser($pdfPath, $totalPages);
                $source = 'pdftotext';
            }

            if (! is_array($parsed)) {
                $parsed = [
                    'metadata' => [],
                    'page_texts' => [],
                    'text' => '',
                ];
                $source = 'none';
            }

            $pageTexts = array_values(array_filter(
                $parsed['page_texts'] ?? [],
                fn (mixed $text): bool => is_string($text)
            ));

            $fullText = trim(implode("\n\n", $pageTexts));
            if ($fullText === '') {
                $fullText = trim((string) ($parsed['text'] ?? ''));
            }
            if ($fullText !== '') {
                $fullText = Str::limit($fullText, 900000, '');
            }

            $metadata = is_array($parsed['metadata'] ?? null) ? $parsed['metadata'] : [];

            [$abstract] = $this->extractAbstract($pageTexts, $fullText);
            [$bibliographyStartPage, $references] = $this->extractReferences($pageTexts);

            $titleFromMeta = $this->stringOrNull($metadata['Title'] ?? $metadata['title'] ?? null);
            $firstPage = $pageTexts[0] ?? '';
            $subtitle = $this->extractSubtitle($firstPage, $titleFromMeta);
            $publisher = $this->extractPublisher($metadata, $fullText);
            $publisherCity = $this->extractPublisherCity($fullText);
            $year = $this->extractYear($metadata, $fullText);
            $edition = $this->extractEdition($fullText);
            $authors = $this->extractAuthors($metadata, $firstPage);
            $editors = $this->extractEditors($metadata, $pageTexts, $fullText);

            return [
                'subtitle' => $subtitle,
                'publisher' => $publisher,
                'publisher_city' => $publisherCity,
                'year' => $year,
                'edition' => $edition,
                'abstract' => $abstract,
                'full_text' => $fullText !== '' ? $fullText : null,
                'total_pdf_pages' => $totalPages,
                'bibliography_start_page' => $bibliographyStartPage,
                'pdf_metadata' => [
                    'source' => $source,
                    'title' => $titleFromMeta,
                    'authors' => $authors,
                    'editors' => $editors,
                    'raw' => $metadata,
                ],
                'references' => $references,
            ];
        } finally {
            if ($temporary && is_file($pdfPath)) {
                @unlink($pdfPath);
            }
        }
    }

    /**
     * @return array{path:string, temporary:bool}
     */
    private function prepareLocalPdf(string $storagePath): array
    {
        if (is_file($storagePath)) {
            return [
                'path' => $storagePath,
                'temporary' => false,
            ];
        }

        foreach (['books', 'public', 'local'] as $disk) {
            try {
                if (! Storage::disk($disk)->exists($storagePath)) {
                    continue;
                }

                $driver = (string) config("filesystems.disks.{$disk}.driver", 'local');
                if ($driver === 'local') {
                    $candidate = Storage::disk($disk)->path($storagePath);
                    if (is_file($candidate)) {
                        return [
                            'path' => $candidate,
                            'temporary' => false,
                        ];
                    }
                }

                $temp = tempnam(sys_get_temp_dir(), 'book_pdf_');
                if ($temp === false) {
                    throw new RuntimeException('Gagal membuat temporary file PDF.');
                }
                file_put_contents($temp, Storage::disk($disk)->get($storagePath));

                return [
                    'path' => $temp,
                    'temporary' => true,
                ];
            } catch (\Throwable) {
                continue;
            }
        }

        throw new RuntimeException("PDF tidak ditemukan pada path: {$storagePath}");
    }

    private function extractTotalPages(string $pdfPath): int
    {
        try {
            $fpdi = new Fpdi();
            return (int) $fpdi->setSourceFile($pdfPath);
        } catch (\Throwable) {
            return 0;
        }
    }

    /**
     * @return array{metadata:array<string,mixed>,page_texts:array<int,string>}|null
     */
    private function runPythonParser(string $pdfPath): ?array
    {
        if (! $this->commandExists('python3')) {
            return null;
        }

        $script = <<<'PY'
import json
import sys

try:
    import pdfplumber
except Exception:
    print("")
    sys.exit(0)

path = sys.argv[1]
result = {"metadata": {}, "page_texts": []}

try:
    with pdfplumber.open(path) as pdf:
        result["metadata"] = pdf.metadata or {}
        for page in pdf.pages:
            result["page_texts"].append(page.extract_text() or "")
except Exception:
    print("")
    sys.exit(0)

print(json.dumps(result, ensure_ascii=False))
PY;

        $scriptPath = tempnam(sys_get_temp_dir(), 'pdf_parser_');
        if ($scriptPath === false) {
            return null;
        }
        file_put_contents($scriptPath, $script);

        try {
            $cmd = 'python3 ' . escapeshellarg($scriptPath) . ' ' . escapeshellarg($pdfPath) . ' 2>/dev/null';
            $output = shell_exec($cmd);
            if (! is_string($output) || trim($output) === '') {
                return null;
            }

            $decoded = json_decode($output, true);
            if (! is_array($decoded)) {
                return null;
            }

            return [
                'metadata' => is_array($decoded['metadata'] ?? null) ? $decoded['metadata'] : [],
                'page_texts' => is_array($decoded['page_texts'] ?? null) ? $decoded['page_texts'] : [],
            ];
        } finally {
            @unlink($scriptPath);
        }
    }

    /**
     * @return array{metadata:array<string,mixed>,page_texts:array<int,string>,text:string}|null
     */
    private function runPdftotextParser(string $pdfPath, int $totalPages): ?array
    {
        if (! $this->commandExists('pdftotext')) {
            return null;
        }

        $cmd = 'pdftotext -layout ' . escapeshellarg($pdfPath) . ' - 2>/dev/null';
        $output = shell_exec($cmd);

        if (! is_string($output) || trim($output) === '') {
            return null;
        }

        $pages = array_map('trim', preg_split('/\f/', $output) ?: []);
        $pages = array_values(array_filter($pages, fn (string $text): bool => $text !== ''));

        if ($pages === [] && $totalPages > 0) {
            $pages = array_fill(0, $totalPages, '');
        }

        return [
            'metadata' => [],
            'page_texts' => $pages,
            'text' => $output,
        ];
    }

    /**
     * @param  array<int,string>  $pageTexts
     * @return array{0:?string,1:?int}
     */
    private function extractAbstract(array $pageTexts, string $fullText): array
    {
        $haystacks = [];
        foreach (array_slice($pageTexts, 0, 5) as $index => $text) {
            $haystacks[] = [$text, $index + 1];
        }
        $haystacks[] = [$fullText, null];

        foreach ($haystacks as [$text, $page]) {
            if (! is_string($text) || $text === '') {
                continue;
            }

            $pattern = '/(?:^|\n)\s*(abstrak|abstract)\s*[:\-]?\s*(.{120,3000}?)(?:\n\s*(kata kunci|keywords|pendahuluan|introduction)\b|$)/isu';
            if (preg_match($pattern, $text, $matches)) {
                return [trim($matches[2]), $page];
            }
        }

        return [null, null];
    }

    /**
     * @param  array<int,string>  $pageTexts
     * @return array{0:?int,1:array<int,array<string,mixed>>}
     */
    private function extractReferences(array $pageTexts): array
    {
        $startPage = null;

        foreach ($pageTexts as $idx => $text) {
            $lower = Str::lower($text);
            if (
                str_contains($lower, 'daftar pustaka')
                || str_contains($lower, 'bibliography')
                || str_contains($lower, 'references')
            ) {
                $startPage = $idx + 1;
                break;
            }
        }

        if ($startPage === null) {
            return [null, []];
        }

        $rawLines = [];
        foreach (array_slice($pageTexts, $startPage - 1) as $text) {
            $lines = preg_split('/\R/', $text) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (mb_strlen($line) < 15) {
                    continue;
                }
                if (preg_match('/^(daftar pustaka|bibliography|references)$/i', $line)) {
                    continue;
                }
                $rawLines[] = preg_replace('/\s+/', ' ', $line);
            }
        }

        $merged = [];
        foreach ($rawLines as $line) {
            $isNewEntry = (bool) preg_match('/^(\[\d+\]|\d+\.|[A-Z][A-Za-z\-\']+,?\s+[A-Z])/u', $line);
            if ($isNewEntry || $merged === []) {
                $merged[] = $line;
                continue;
            }

            $last = array_key_last($merged);
            $merged[$last] .= ' ' . $line;
        }

        $references = [];
        foreach ($merged as $idx => $referenceText) {
            $references[] = $this->parseReferenceLine($referenceText, $idx + 1);
        }

        return [$startPage, $references];
    }

    /**
     * @return array<string,mixed>
     */
    private function parseReferenceLine(string $rawText, int $order): array
    {
        $rawText = trim($rawText);
        $doi = null;
        $url = null;
        $isbn = null;
        $year = null;

        if (preg_match('/\b10\.\d{4,9}\/[-._;()\/:A-Z0-9]+\b/i', $rawText, $match)) {
            $doi = $match[0];
        }
        if (preg_match('/https?:\/\/\S+/i', $rawText, $match)) {
            $url = rtrim($match[0], '.,;');
        }
        if (preg_match('/ISBN(?:-1[03])?\s*[:\-]?\s*([0-9Xx\-]+)/i', $rawText, $match)) {
            $isbn = strtoupper($match[1]);
        }
        if (preg_match('/\b(19|20)\d{2}\b/', $rawText, $match)) {
            $year = (int) $match[0];
        }

        $segments = preg_split('/\.\s+/u', $rawText, 3) ?: [];
        $authors = trim($segments[0] ?? '');
        $title = trim($segments[1] ?? '');
        $source = trim($segments[2] ?? '');

        $knownScore = 0;
        foreach ([$authors, $year, $title, $doi, $url] as $v) {
            if (! empty($v)) {
                $knownScore++;
            }
        }
        $quality = min(1, $knownScore / 5) * 100;

        return [
            'raw_text' => $rawText,
            'order_number' => $order,
            'authors' => $authors !== '' ? $authors : null,
            'year' => $year,
            'title' => $title !== '' ? $title : null,
            'source' => $source !== '' ? $source : null,
            'volume' => null,
            'issue' => null,
            'pages' => null,
            'publisher' => null,
            'publisher_city' => null,
            'doi' => $doi,
            'url' => $url,
            'isbn' => $isbn,
            'ref_type' => $doi || $url ? 'article' : 'book',
            'parse_quality' => round($quality, 2),
        ];
    }

    private function extractSubtitle(string $firstPage, ?string $title): ?string
    {
        if ($firstPage === '') {
            return null;
        }

        $lines = array_values(array_filter(array_map('trim', preg_split('/\R/', $firstPage) ?: [])));
        if (count($lines) < 2) {
            return null;
        }

        $candidate = $lines[1] ?? null;
        if (! is_string($candidate) || $candidate === '') {
            return null;
        }

        if ($title !== null && Str::lower($candidate) === Str::lower($title)) {
            return null;
        }

        return Str::limit($candidate, 255, '');
    }

    /**
     * @param  array<string,mixed>  $metadata
     */
    private function extractPublisher(array $metadata, string $fullText): ?string
    {
        foreach (['Publisher', 'publisher', 'Producer'] as $key) {
            $value = $this->stringOrNull($metadata[$key] ?? null);
            if ($value !== null) {
                return Str::limit($value, 255, '');
            }
        }

        if (preg_match('/(?:penerbit|publisher)\s*[:\-]\s*([^\n]+)/iu', $fullText, $matches)) {
            return Str::limit(trim($matches[1]), 255, '');
        }

        return null;
    }

    private function extractPublisherCity(string $fullText): ?string
    {
        if (preg_match('/(?:kota|city)\s*[:\-]\s*([^\n]+)/iu', $fullText, $matches)) {
            return Str::limit(trim($matches[1]), 255, '');
        }

        return null;
    }

    /**
     * @param  array<string,mixed>  $metadata
     */
    private function extractYear(array $metadata, string $fullText): ?int
    {
        foreach (['CreationDate', 'ModDate'] as $key) {
            $value = $this->stringOrNull($metadata[$key] ?? null);
            if ($value && preg_match('/(19|20)\d{2}/', $value, $matches)) {
                return (int) $matches[0];
            }
        }

        if (preg_match('/\b(19|20)\d{2}\b/', $fullText, $matches)) {
            return (int) $matches[0];
        }

        return null;
    }

    private function extractEdition(string $fullText): ?string
    {
        if (preg_match('/\b(\d+(?:st|nd|rd|th)?\s+edition|edisi\s+\d+)\b/iu', $fullText, $matches)) {
            return Str::limit(trim($matches[1]), 255, '');
        }

        return null;
    }

    /**
     * @param  array<string,mixed>  $metadata
     * @return array<int,string>
     */
    private function extractAuthors(array $metadata, string $firstPage): array
    {
        $authors = [];

        foreach (['Author', 'author', 'Creator'] as $key) {
            $value = $this->stringOrNull($metadata[$key] ?? null);
            if ($value !== null) {
                $authors = array_merge($authors, preg_split('/,|;| dan | and /iu', $value) ?: []);
            }
        }

        if ($authors === [] && preg_match('/(?:oleh|author|penulis)\s*[:\-]\s*([^\n]+)/iu', $firstPage, $matches)) {
            $authors = preg_split('/,|;| dan | and /iu', $matches[1]) ?: [];
        }

        $authors = array_values(array_unique(array_filter(array_map(function (string $name): ?string {
            $name = trim($name);
            if ($name === '' || mb_strlen($name) < 3) {
                return null;
            }

            return Str::limit($name, 255, '');
        }, $authors))));

        return $authors;
    }

    /**
     * @param  array<string,mixed>  $metadata
     * @param  array<int,string>  $pageTexts
     * @return array<int,string>
     */
    private function extractEditors(array $metadata, array $pageTexts, string $fullText): array
    {
        $editors = [];

        foreach (['Editor', 'editor', 'Editors', 'editors'] as $key) {
            $value = $this->stringOrNull($metadata[$key] ?? null);
            if ($value !== null) {
                $editors = array_merge($editors, preg_split('/,|;| dan | and /iu', $value) ?: []);
            }
        }

        if ($editors === []) {
            $firstPages = implode("\n", array_slice($pageTexts, 0, 3));
            $haystack = $firstPages !== '' ? $firstPages : $fullText;

            if (preg_match('/(?:edited by|editor(?:s)?|penyunting)\s*[:\-]?\s*([^\n]+)/iu', $haystack, $matches)) {
                $editors = preg_split('/,|;| dan | and /iu', (string) $matches[1]) ?: [];
            }
        }

        return array_values(array_unique(array_filter(array_map(function (mixed $name): ?string {
            if (! is_string($name)) {
                return null;
            }

            $name = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
            if ($name === '' || mb_strlen($name) < 3) {
                return null;
            }

            return Str::limit($name, 255, '');
        }, $editors))));
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    private static function commandExists(string $command): bool
    {
        $which = shell_exec("command -v {$command} 2>/dev/null");
        return is_string($which) && trim($which) !== '';
    }
}
