<?php

namespace App\Console\Commands;

use App\Enums\ContractStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\ManuscriptProposal;
use App\Models\RoyaltyCalculation;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DataIntegrityCheck extends Command
{
    protected $signature = 'data:integrity-check {--fix : Apply safe automatic fixes where possible}';

    protected $description = 'Audit data integrity issues for books, authors, manuscripts, contracts, royalties, and pricing';

    public function handle(): int
    {
        $shouldFix = (bool) $this->option('fix');

        $this->info('Running data integrity audit...');

        $results = [
            $this->checkBooksWithoutCover($shouldFix),
            $this->checkInvalidIsbn($shouldFix),
            $this->checkBooksWithoutCategory($shouldFix),
            $this->checkAuthorsWithoutVerifiedEmail($shouldFix),
            $this->checkOrphanedManuscripts($shouldFix),
            $this->checkExpiredContracts($shouldFix),
            $this->checkRoyaltyInconsistencies($shouldFix),
            $this->checkInvalidPrices($shouldFix),
        ];

        $this->newLine();
        $this->table(
            ['Check', 'Issues', 'Fixed', 'Notes'],
            collect($results)->map(fn (array $result): array => [
                $result['label'],
                $result['issues'],
                $result['fixed'],
                $result['notes'],
            ])->all()
        );

        foreach ($results as $result) {
            $this->renderSamples($result);
        }

        $totalIssues = collect($results)->sum('issues');
        $totalFixed = collect($results)->sum('fixed');

        $this->newLine();
        $this->line("Total issues: " . (string) $totalIssues);
        $this->line("Total fixed: " . (string) $totalFixed);

        if ($totalIssues === 0) {
            $this->info('No integrity issues found.');
        } elseif ($shouldFix && $totalFixed > 0) {
            $this->info('Safe fixes have been applied where possible.');
        } else {
            $this->warn('Review the report above for items that still need manual cleanup.');
        }

        return self::SUCCESS;
    }

    private function checkBooksWithoutCover(bool $shouldFix): array
    {
        $books = Book::query()
            ->select('id', 'title')
            ->when(fn() => Schema::hasColumn('books', 'cover_path'), function ($query): void {
                $query->where(function ($coverQuery): void {
                    $coverQuery->whereNull('cover_path')->orWhere('cover_path', '');
                });
            })
            ->when(fn() => Schema::hasColumn('books', 'cover_file_path'), function ($query): void {
                $query->where(function ($coverQuery): void {
                    $coverQuery->whereNull('cover_file_path')->orWhere('cover_file_path', '');
                });
            })
            ->when(fn() => Schema::hasColumn('books', 'google_drive_cover_url'), function ($query): void {
                $query->where(function ($coverQuery): void {
                    $coverQuery->whereNull('google_drive_cover_url')->orWhere('google_drive_cover_url', '');
                });
            })
            ->get();

        return $this->result(
            'Books without cover_url',
            $books,
            0,
            $shouldFix ? 'Report only; no safe auto-fix.' : 'Report only.',
            fn (Book $book): string => "#{$book->id} {$book->title}"
        );
    }

    private function checkInvalidIsbn(bool $shouldFix): array
    {
        $books = Book::query()
            ->select('id', 'title', 'isbn')
            ->whereNotNull('isbn')
            ->where(fn($q) => $q->where('isbn', '!=', ''))
            ->get()
            ->filter(fn (Book $book): bool => ! $this->isValidIsbn((string) $book->isbn))
            ->values();

        return $this->result(
            'Books with invalid ISBN',
            $books,
            0,
            $shouldFix ? 'Report only; ISBN needs manual review.' : 'Report only.',
            fn (Book $book): string => "#{$book->id} {$book->title} ({$book->isbn})"
        );
    }

    private function checkBooksWithoutCategory(bool $shouldFix): array
    {
        $books = Schema::hasColumn('books', 'category_id')
            ? Book::query()->select('id', 'title')->whereNull('category_id')->get()
            : collect();

        return $this->result(
            'Books without category',
            $books,
            0,
            $shouldFix ? 'Report only; assigning categories is not safe automatically.' : 'Report only.',
            fn (Book $book): string => "#{$book->id} {$book->title}"
        );
    }

    private function checkAuthorsWithoutVerifiedEmail(bool $shouldFix): array
    {
        $usersByEmail = User::query()
            ->select('id', 'email', 'email_verified_at')
            ->whereNotNull('email')
            ->get()
            ->keyBy(fn (User $user): string => strtolower($user->email));

        $authors = Author::query()
            ->with('user')
            ->select('id', 'name', 'email', 'user_id')
            ->get()
            ->filter(function (Author $author) use ($usersByEmail): bool {
                $linkedUser = $author->user;

                if (! $linkedUser && $author->email) {
                    $linkedUser = $usersByEmail->get(strtolower($author->email));
                }

                return ! $linkedUser || ! $linkedUser->email_verified_at;
            })
            ->values();

        return $this->result(
            'Authors without email verified',
            $authors,
            0,
            $shouldFix ? 'Report only; email verification must be handled manually.' : 'Report only.',
            fn (Author $author): string => "#{$author->id} {$author->name} ({$author->email})"
        );
    }

    private function checkOrphanedManuscripts(bool $shouldFix): array
    {
        $manuscripts = ManuscriptProposal::query()
            ->with('author')
            ->select('id', 'author_id', 'title')
            ->get()
            ->filter(fn (ManuscriptProposal $manuscript): bool => $manuscript->author === null)
            ->values();

        return $this->result(
            'Orphaned manuscripts',
            $manuscripts,
            0,
            $shouldFix ? 'Report only; orphan cleanup needs manual confirmation.' : 'Report only.',
            fn (ManuscriptProposal $manuscript): string => "#{$manuscript->id} {$manuscript->title} (author_id: {$manuscript->author_id})"
        );
    }

    private function checkExpiredContracts(bool $shouldFix): array
    {
        $contracts = Contract::query()
            ->with('book')
            ->where(fn($q) => $q->where('status', ContractStatus::Approved))
            ->whereDate('end_date', '<', now()->toDateString())
            ->get();

        $fixed = 0;

        if ($shouldFix && $contracts->isNotEmpty()) {
            foreach ($contracts as $contract) {
                $contract->update(['status' => ContractStatus::Expired]);
                $fixed++;
            }
        }

        return $this->result(
            'Contracts expired but still active',
            $contracts,
            $fixed,
            $shouldFix ? 'Approved expired contracts marked as expired.' : 'Safe auto-fix available with --fix.',
            fn (Contract $contract): string => "#{$contract->id} {$contract->book?->title} (ended {$contract->end_date})"
        );
    }

    private function checkRoyaltyInconsistencies(bool $shouldFix): array
    {
        $royalties = RoyaltyCalculation::query()
            ->with(['items', 'payment', 'author'])
            ->get()
            ->filter(function (RoyaltyCalculation $royalty): bool {
                $itemsTotal = round($royalty->items->sum(fn ($item): float => (float) $item->amount), 2);
                $calculationTotal = round((float) $royalty->total_amount, 2);
                $paymentTotal = $royalty->payment ? round((float) $royalty->payment->amount, 2) : null;

                return abs($calculationTotal - $itemsTotal) > 0.01
                    || ($paymentTotal !== null && abs($paymentTotal - $calculationTotal) > 0.01);
            })
            ->values();

        $fixed = 0;

        if ($shouldFix && $royalties->isNotEmpty()) {
            DB::transaction(function () use ($royalties, &$fixed): void {
                foreach ($royalties as $royalty) {
                    $itemsTotal = round($royalty->items->sum(fn ($item): float => (float) $item->amount), 2);

                    $royalty->update(['total_amount' => $itemsTotal]);

                    if ($royalty->payment) {
                        $royalty->payment->update(['amount' => $itemsTotal]);
                    }

                    $fixed++;
                }
            });
        }

        return $this->result(
            'Royalty inconsistencies',
            $royalties,
            $fixed,
            $shouldFix ? 'Synced calculation totals and payment amounts to royalty items.' : 'Safe auto-fix available with --fix.',
            function (RoyaltyCalculation $royalty): string {
                $itemsTotal = round($royalty->items->sum(fn ($item): float => (float) $item->amount), 2);
                $paymentTotal = $royalty->payment ? round((float) $royalty->payment->amount, 2) : null;

                return "#{$royalty->id} {$royalty->author?->name} period {$royalty->period_month} " .
                    "(total: {$royalty->total_amount}, items: {$itemsTotal}, payment: " . ($paymentTotal ?? 'none') . ')';
            }
        );
    }

    private function checkInvalidPrices(bool $shouldFix): array
    {
        $books = Book::query()
            ->select('id', 'title', 'price')
            ->where(function ($query): void {
                $query->whereNull('price')->orWhere('price', '<', 0);
            })
            ->get();

        $fixed = 0;

        if ($shouldFix && $books->isNotEmpty()) {
            $fixed = Book::query()
                ->where(function ($query): void {
                    $query->whereNull('price')->orWhere('price', '<', 0);
                })
                ->update(['price' => 0]);
        }

        return $this->result(
            'Price = null atau negative',
            $books,
            $fixed,
            $shouldFix ? 'Invalid prices normalized to 0.' : 'Safe auto-fix available with --fix.',
            fn (Book $book): string => "#{$book->id} {$book->title} (price: {$book->price})"
        );
    }

    private function isValidIsbn(string $isbn): bool
    {
        $normalized = preg_replace('/[^0-9X]/i', '', strtoupper($isbn)) ?? '';

        if (strlen($normalized) === 10) {
            $sum = 0;

            for ($i = 0; $i < 9; $i++) {
                if (! is_numeric($normalized[$i])) {
                    return false;
                }

                $sum += ((int) $normalized[$i]) * (10 - $i);
            }

            $checksum = $normalized[9] === 'X' ? 10 : (is_numeric($normalized[9]) ? (int) $normalized[9] : -1);

            if ($checksum < 0) {
                return false;
            }

            $sum += $checksum;

            return $sum % 11 === 0;
        }

        if (strlen($normalized) === 13 && ctype_digit($normalized)) {
            $sum = 0;

            for ($i = 0; $i < 12; $i++) {
                $sum += ((int) $normalized[$i]) * ($i % 2 === 0 ? 1 : 3);
            }

            $checkDigit = (10 - ($sum % 10)) % 10;

            return $checkDigit === (int) $normalized[12];
        }

        return false;
    }

    private function renderSamples(array $result): void
    {
        if ($result['issues'] === 0 || $result['samples'] === []) {
            return;
        }

        $this->newLine();
        $this->line($result['label'] . ':');

        foreach ($result['samples'] as $sample) {
            $this->line(" - {$sample}");
        }
    }

    private function result(
        string $label,
        Collection $issues,
        int $fixed,
        string $notes,
        callable $formatter
    ): array {
        return [
            'label' => $label,
            'issues' => $issues->count(),
            'fixed' => $fixed,
            'notes' => $notes,
            'samples' => $issues->take(5)->map($formatter)->values()->all(),
        ];
    }
}
