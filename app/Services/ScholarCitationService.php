<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ScholarCitationService
{
    private const DEFAULT_PUBLISHER = 'Penerbit Rizquna Elfath';
    private const DEFAULT_CITY = 'Jakarta';

    /**
     * @param  string  $format  apa|mla|chicago|ieee|bibtex|ris
     */
    public function generate(Book $book, string $format = 'apa'): string
    {
        return match (strtolower(trim($format))) {
            'apa' => $this->formatApa($book),
            'mla' => $this->formatMla($book),
            'chicago', 'turabian' => $this->formatChicago($book),
            'ieee' => $this->formatIeee($book),
            'bib', 'bibtex' => $this->formatBibtex($book),
            'ris' => $this->formatRis($book),
            default => throw new InvalidArgumentException("Format sitasi tidak didukung: {$format}"),
        };
    }

    /**
     * @return array<string,string>
     */
    public function generateAll(Book $book): array
    {
        return [
            'apa' => $this->formatApa($book),
            'mla' => $this->formatMla($book),
            'chicago' => $this->formatChicago($book),
            'turabian' => $this->formatChicago($book),
            'ieee' => $this->formatIeee($book),
            'bibtex' => $this->formatBibtex($book),
            'ris' => $this->formatRis($book),
        ];
    }

    /**
     * @return array{content:string,mime:string,extension:string}
     */
    public function generateDownload(Book $book, string $type = 'ris'): array
    {
        return match (strtolower(trim($type))) {
            'ris' => [
                'content' => $this->formatRis($book),
                'mime' => 'application/x-research-info-systems',
                'extension' => 'ris',
            ],
            'bib', 'bibtex' => [
                'content' => $this->formatBibtex($book),
                'mime' => 'application/x-bibtex',
                'extension' => 'bib',
            ],
            default => throw new InvalidArgumentException("Format download tidak didukung: {$type}"),
        };
    }

    private function formatApa(Book $book): string
    {
        $authors = $this->authorsApa($book);
        $year = $this->yearText($book);
        $title = $this->title($book);
        $edition = $this->editionApa($book->edition);
        $publisher = $this->publisher($book);
        $doiOrUrl = $this->doiOrUrl($book);

        $citation = "{$authors} ({$year}). {$title}{$edition}. {$publisher}.";
        if ($doiOrUrl) {
            $citation .= " {$doiOrUrl}";
        }

        return $this->clean($citation);
    }

    private function formatMla(Book $book): string
    {
        $authors = $this->authorsMla($book);
        $title = $this->title($book);
        $editors = $this->editorsMla($book);
        $edition = $this->editionMla($book->edition);
        $publisher = $this->publisher($book);
        $year = $this->yearText($book);
        $doiOrUrl = $this->doiOrUrl($book);

        $citation = "{$authors}. {$title}. {$editors}{$edition}{$publisher}, {$year}.";
        if ($doiOrUrl) {
            $citation .= " {$doiOrUrl}";
        }

        return $this->clean($citation);
    }

    private function formatChicago(Book $book): string
    {
        $authors = $this->authorsChicago($book);
        $title = $this->title($book);
        $editors = $this->editorsChicago($book);
        $edition = $this->editionChicago($book->edition);
        $publisher = $this->publisher($book);
        $city = $this->city($book);
        $year = $this->yearText($book);
        $doiOrUrl = $this->doiOrUrl($book);

        $citation = "{$authors}. {$title}{$edition}{$editors}. {$city}: {$publisher}, {$year}.";
        if ($doiOrUrl) {
            $citation .= " {$doiOrUrl}";
        }

        return $this->clean($citation);
    }

    private function formatIeee(Book $book): string
    {
        $authors = $this->authorsIeee($book);
        $title = $this->title($book);
        $edition = $this->editionIeee($book->edition);
        $publisher = $this->publisher($book);
        $city = $this->city($book);
        $year = $this->yearText($book);
        $doi = $this->doi($book);

        $citation = "{$authors}, \"{$title},\" {$edition}{$publisher}, {$city}, {$year}.";
        if ($doi) {
            $citation .= " doi:{$doi}.";
        }

        return $this->clean($citation);
    }

    private function formatBibtex(Book $book): string
    {
        $authors = $book->authorsArray();
        if ($authors === []) {
            $authors = ['Unknown Author'];
        }

        $year = $this->yearText($book);
        $key = $this->bibtexKey($book, $authors, $year);

        $fields = [
            'title' => $this->title($book),
            'author' => implode(' and ', array_map([$this, 'bibEscape'], $authors)),
            'year' => $year,
            'publisher' => $this->publisher($book),
            'address' => $this->city($book),
        ];

        if (! empty($book->edition)) {
            $fields['edition'] = $book->edition;
        }
        $editors = $this->editorListRaw($book);
        if ($editors !== []) {
            $fields['editor'] = implode(' and ', array_map([$this, 'bibEscape'], $editors));
        }
        if (! empty($book->isbn)) {
            $fields['isbn'] = $book->isbn;
        }
        if ($doi = $this->doi($book)) {
            $fields['doi'] = $doi;
        }
        if ($url = $this->url($book)) {
            $fields['url'] = $url;
        }

        $lines = ["@book{{$key},"];
        foreach ($fields as $field => $value) {
            $lines[] = "  {$field} = {" . $this->bibEscape((string) $value) . "},";
        }
        $lines[] = '}';

        return implode("\n", $lines);
    }

    private function formatRis(Book $book): string
    {
        $lines = ['TY  - BOOK'];

        $authors = $book->authorsArray();
        if ($authors === []) {
            $authors = ['Unknown Author'];
        }
        foreach ($authors as $author) {
            $lines[] = 'AU  - ' . $author;
        }

        $lines[] = 'TI  - ' . $this->title($book);
        $lines[] = 'PY  - ' . $this->yearText($book);
        $lines[] = 'PB  - ' . $this->publisher($book);
        $lines[] = 'CY  - ' . $this->city($book);

        if (! empty($book->edition)) {
            $lines[] = 'ET  - ' . $book->edition;
        }
        foreach ($this->editorListRaw($book) as $editor) {
            $lines[] = 'A2  - ' . $editor;
        }
        if (! empty($book->isbn)) {
            $lines[] = 'SN  - ' . $book->isbn;
        }
        if ($doi = $this->doi($book)) {
            $lines[] = 'DO  - ' . $doi;
        }
        if ($url = $this->url($book)) {
            $lines[] = 'UR  - ' . $url;
        }
        if (! empty($book->abstract)) {
            $lines[] = 'AB  - ' . Str::limit(preg_replace('/\s+/u', ' ', $book->abstract) ?? '', 700, '');
        }

        $lines[] = 'ER  -';

        return implode("\n", $lines) . "\n";
    }

    private function authorsApa(Book $book): string
    {
        $parts = [];
        foreach ($book->authorsArray() as $name) {
            $parts[] = $this->nameApa($name);
        }

        if ($parts === []) {
            return 'Unknown Author';
        }

        // APA 7: >20 penulis => tampilkan 19 pertama, ellipsis, penulis terakhir.
        if (count($parts) > 20) {
            $parts = [...array_slice($parts, 0, 19), '...', end($parts)];
        }

        if (count($parts) === 1) {
            return $parts[0];
        }

        if (count($parts) === 2) {
            return "{$parts[0]} & {$parts[1]}";
        }

        $last = array_pop($parts);
        return implode(', ', $parts) . ', & ' . $last;
    }

    private function authorsMla(Book $book): string
    {
        $authors = $book->authorsArray();
        if ($authors === []) {
            return 'Unknown Author';
        }

        if (count($authors) > 2) {
            return $this->nameInverted($authors[0]) . ', et al';
        }

        if (count($authors) === 2) {
            return $this->nameInverted($authors[0]) . ', and ' . $this->nameNormal($authors[1]);
        }

        return $this->nameInverted($authors[0]);
    }

    private function authorsChicago(Book $book): string
    {
        $authors = $book->authorsArray();
        if ($authors === []) {
            return 'Unknown Author';
        }

        if (count($authors) === 1) {
            return $this->nameInverted($authors[0]);
        }

        $first = $this->nameInverted(array_shift($authors));
        $rest = array_map([$this, 'nameNormal'], $authors);

        if (count($rest) === 1) {
            return $first . ' and ' . $rest[0];
        }

        $last = array_pop($rest);
        return $first . ', ' . implode(', ', $rest) . ', and ' . $last;
    }

    private function authorsIeee(Book $book): string
    {
        $parts = array_map([$this, 'nameIeee'], $book->authorsArray());
        if ($parts === []) {
            return 'Unknown Author';
        }

        if (count($parts) === 1) {
            return $parts[0];
        }

        if (count($parts) === 2) {
            return $parts[0] . ' and ' . $parts[1];
        }

        $last = array_pop($parts);
        return implode(', ', $parts) . ', and ' . $last;
    }

    private function editorsMla(Book $book): string
    {
        $editors = $this->editorListRaw($book);
        if ($editors === []) {
            return '';
        }

        $formatted = $this->joinNamesNatural(array_map([$this, 'nameNormal'], $editors));
        return "Edited by {$formatted}, ";
    }

    private function editorsChicago(Book $book): string
    {
        $editors = $this->editorListRaw($book);
        if ($editors === []) {
            return '';
        }

        $formatted = $this->joinNamesNatural(array_map([$this, 'nameNormal'], $editors));
        return ", edited by {$formatted}";
    }

    private function nameApa(string $name): string
    {
        [$given, $family] = $this->splitName($name);
        if ($family === '') {
            return trim($name);
        }

        $initials = $this->initials($given);
        if ($initials === '') {
            return $family;
        }

        return "{$family}, {$initials}";
    }

    private function nameInverted(string $name): string
    {
        [$given, $family] = $this->splitName($name);
        if ($family === '') {
            return trim($name);
        }
        if ($given === '') {
            return $family;
        }

        return "{$family}, {$given}";
    }

    private function nameNormal(string $name): string
    {
        [$given, $family] = $this->splitName($name);
        if ($family === '') {
            return trim($name);
        }
        if ($given === '') {
            return $family;
        }

        return trim("{$given} {$family}");
    }

    private function nameIeee(string $name): string
    {
        [$given, $family] = $this->splitName($name);
        if ($family === '') {
            return trim($name);
        }

        $initials = $this->initials($given);
        if ($initials === '') {
            return $family;
        }

        return trim("{$initials} {$family}");
    }

    /**
     * @return array{0:string,1:string} [given, family]
     */
    private function splitName(string $name): array
    {
        $name = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
        if ($name === '') {
            return ['', ''];
        }

        if (str_contains($name, ',')) {
            [$family, $given] = array_pad(array_map('trim', explode(',', $name, 2)), 2, '');
            return [$given, $family];
        }

        $parts = array_values(array_filter(explode(' ', $name), fn (string $v): bool => $v !== ''));
        if (count($parts) === 1) {
            return ['', $parts[0]];
        }

        $family = array_pop($parts);
        $given = implode(' ', $parts);

        return [$given, $family];
    }

    private function initials(string $given): string
    {
        $tokens = array_values(array_filter(
            explode(' ', trim($given)),
            fn (string $v): bool => $v !== ''
        ));

        if ($tokens === []) {
            return '';
        }

        $initials = array_map(function (string $token): string {
            $c = mb_substr($token, 0, 1);
            return mb_strtoupper($c) . '.';
        }, $tokens);

        return implode(' ', $initials);
    }

    /**
     * @return array<int,string>
     */
    private function editorListRaw(Book $book): array
    {
        $editors = data_get($book->pdf_metadata, 'editors', []);

        if (is_string($editors)) {
            $editors = preg_split('/,|;| dan | and /iu', $editors) ?: [];
        }

        if (! is_array($editors)) {
            $single = data_get($book->pdf_metadata, 'editor');
            $editors = is_string($single) ? [$single] : [];
        }

        return array_values(array_unique(array_filter(array_map(function (mixed $name): ?string {
            if (! is_string($name)) {
                return null;
            }

            $name = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
            return $name !== '' ? $name : null;
        }, $editors))));
    }

    /**
     * @param  array<int,string>  $names
     */
    private function joinNamesNatural(array $names): string
    {
        if ($names === []) {
            return '';
        }

        if (count($names) === 1) {
            return $names[0];
        }

        if (count($names) === 2) {
            return "{$names[0]} and {$names[1]}";
        }

        $last = array_pop($names);
        return implode(', ', $names) . ', and ' . $last;
    }

    private function title(Book $book): string
    {
        $title = trim($book->fullTitle());
        if ($title === '') {
            return 'Untitled';
        }

        return rtrim($title, '.');
    }

    private function yearText(Book $book): string
    {
        $year = $book->year
            ?? $book->published_year
            ?? ($book->relationLoaded('citation') ? $book->citation?->publication_year : null);

        return $year ? (string) $year : 'n.d.';
    }

    private function publisher(Book $book): string
    {
        if (! empty($book->publisher)) {
            return trim((string) $book->publisher);
        }

        if ($book->relationLoaded('citation') && $book->citation) {
            return $book->citation->getEffectivePublisherName();
        }

        return self::DEFAULT_PUBLISHER;
    }

    private function city(Book $book): string
    {
        if (! empty($book->publisher_city)) {
            return trim((string) $book->publisher_city);
        }

        if ($book->relationLoaded('citation') && $book->citation) {
            return $book->citation->getEffectiveCity();
        }

        return self::DEFAULT_CITY;
    }

    private function doi(Book $book): ?string
    {
        $doi = $book->relationLoaded('citation') ? ($book->citation?->doi ?? null) : null;
        if (! is_string($doi)) {
            return null;
        }

        $doi = trim($doi);
        return $doi !== '' ? $doi : null;
    }

    private function url(Book $book): ?string
    {
        $url = data_get($book->pdf_metadata, 'url');
        if (! is_string($url)) {
            return null;
        }
        $url = trim($url);
        return $url !== '' ? $url : null;
    }

    private function doiOrUrl(Book $book): ?string
    {
        if ($doi = $this->doi($book)) {
            return 'https://doi.org/' . $doi;
        }

        return $this->url($book);
    }

    private function editionApa(?string $edition): string
    {
        $edition = $this->normalizeEdition($edition);
        return $edition ? " ({$edition})" : '';
    }

    private function editionMla(?string $edition): string
    {
        $edition = $this->normalizeEdition($edition);
        return $edition ? "{$edition}, " : '';
    }

    private function editionChicago(?string $edition): string
    {
        $edition = $this->normalizeEdition($edition);
        return $edition ? ", {$edition}" : '';
    }

    private function editionIeee(?string $edition): string
    {
        $edition = $this->normalizeEdition($edition);
        return $edition ? "{$edition}, " : '';
    }

    private function normalizeEdition(?string $edition): ?string
    {
        if (! is_string($edition)) {
            return null;
        }

        $edition = trim($edition);
        if ($edition === '') {
            return null;
        }

        if (preg_match('/\bed(ition)?\.?$/iu', $edition)) {
            return $edition;
        }

        if (preg_match('/^\d+$/', $edition)) {
            return $edition . 'th ed.';
        }

        return $edition . ' ed.';
    }

    private function bibtexKey(Book $book, array $authors, string $year): string
    {
        $firstAuthor = $authors[0] ?? 'unknown';
        [, $family] = $this->splitName($firstAuthor);
        $family = $family !== '' ? $family : 'unknown';

        $titleToken = Str::slug(Str::words($this->title($book), 2, ''), '');
        if ($titleToken === '') {
            $titleToken = 'book';
        }

        $yearToken = preg_match('/^\d{4}$/', $year) ? $year : 'nd';

        return Str::slug($family, '') . $yearToken . $titleToken;
    }

    private function bibEscape(string $value): string
    {
        return str_replace(
            ['{', '}', '\\'],
            ['\{', '\}', '\\\\'],
            $value
        );
    }

    private function clean(string $text): string
    {
        $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
        $text = str_replace(' .', '.', $text);
        $text = str_replace(' ,', ',', $text);
        $text = str_replace('..', '.', $text);

        return trim($text);
    }
}
