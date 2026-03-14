<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckDataIntegrity extends Command
{
    protected $signature = 'diagnostic:check-integrity';
    protected $description = 'Check and fix data integrity issues in the database';

    private int $fixed = 0;
    private int $issues = 0;

    public function handle(): int
    {
        $this->info('🔍 Starting Data Integrity Check...');
        $this->newLine();

        // 1. Books without author
        $this->checkBooksWithoutAuthor();

        // 2. Books without slug
        $this->checkBooksWithoutSlug();

        // 3. Books without category
        $this->checkBooksWithoutCategory();

        // 4. Cover path with missing files
        $this->checkMissingCoverFiles();

        // 5. Duplicate slugs
        $this->checkDuplicateSlugs();

        // 6. Null prices
        $this->checkNullPrices();

        // 7. Invalid status
        $this->checkInvalidStatus();

        // 8. Authors without email
        $this->checkAuthorsWithoutEmail();

        $this->newLine();
        $this->table(
            ['Summary', 'Count'],
            [
                ['Issues Found', $this->issues],
                ['Issues Fixed', $this->fixed],
            ]
        );

        if ($this->issues === 0) {
            $this->info('✅ No integrity issues found!');
        } elseif ($this->fixed === $this->issues) {
            $this->info('✅ All issues have been fixed!');
        } else {
            $this->warn('⚠️ Some issues require manual intervention.');
        }

        return 0;
    }

    private function checkBooksWithoutAuthor(): void
    {
        $this->info('1. Checking books without author...');
        
        $count = Book::whereNull('author_id')->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            // Get or create fallback author
            $fallback = Author::firstOrCreate(
                ['email' => 'fallback@rizquna.id'],
                [
                    'name' => 'Penulis Rizquna',
                    'status' => 'active',
                ]
            );

            Book::whereNull('author_id')->update(['author_id' => $fallback->id]);
            $this->fixed += $count;
            
            $this->warn("   ⚠️ Found {$count} books without author → Assigned to '{$fallback->name}'");
        } else {
            $this->info('   ✅ All books have authors');
        }
    }

    private function checkBooksWithoutSlug(): void
    {
        $this->info('2. Checking books without slug...');
        
        $books = Book::whereNull('slug')->orWhere('slug', '')->get();
        $count = $books->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            foreach ($books as $book) {
                $book->update([
                    'slug' => Str::slug($book->title) . '-' . Str::random(5),
                ]);
            }
            
            $this->fixed += $count;
            $this->warn("   ⚠️ Found {$count} books without slug → Generated");
        } else {
            $this->info('   ✅ All books have slugs');
        }
    }

    private function checkBooksWithoutCategory(): void
    {
        $this->info('3. Checking books without category...');
        
        $count = Book::whereNull('category_id')->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            // Get or create fallback category
            $fallback = Category::firstOrCreate(
                ['slug' => 'umum'],
                [
                    'name' => 'Umum',
                    'is_active' => true,
                    'sort_order' => 99,
                ]
            );

            Book::whereNull('category_id')->update(['category_id' => $fallback->id]);
            $this->fixed += $count;
            
            $this->warn("   ⚠️ Found {$count} books without category → Assigned to '{$fallback->name}'");
        } else {
            $this->info('   ✅ All books have categories');
        }
    }

    private function checkMissingCoverFiles(): void
    {
        $this->info('4. Checking cover paths with missing files...');
        
        $books = Book::whereNotNull('cover_path')->get();
        $missing = 0;
        
        foreach ($books as $book) {
            if ($book->cover_path && !file_exists(storage_path('app/private/' . $book->cover_path))) {
                $missing++;
            }
        }
        
        if ($missing > 0) {
            $this->issues += $missing;
            
            Book::whereNotNull('cover_path')
                ->get()
                ->filter(fn($b) => !file_exists(storage_path('app/private/' . $b->cover_path)))
                ->each(fn($b) => $b->update(['cover_path' => null]));
            
            $this->fixed += $missing;
            $this->warn("   ⚠️ Found {$missing} books with missing cover files → Set to null");
        } else {
            $this->info('   ✅ All cover files exist');
        }
    }

    private function checkDuplicateSlugs(): void
    {
        $this->info('5. Checking duplicate slugs...');
        
        $duplicates = Book::select('slug')
            ->whereNotNull('slug')
            ->groupBy('slug')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('slug');
        
        $count = $duplicates->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            foreach ($duplicates as $slug) {
                $books = Book::where('slug', $slug)->get();
                foreach ($books->skip(1) as $book) {
                    $book->update([
                        'slug' => $slug . '-' . Str::random(5),
                    ]);
                }
            }
            
            $this->fixed += $count;
            $this->warn("   ⚠️ Found {$count} duplicate slugs → Added suffix");
        } else {
            $this->info('   ✅ No duplicate slugs');
        }
    }

    private function checkNullPrices(): void
    {
        $this->info('6. Checking null prices...');
        
        $count = Book::whereNull('price')->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            Book::whereNull('price')->update(['price' => 0]);
            $this->fixed += $count;
            
            $this->warn("   ⚠️ Found {$count} books with null price → Set to 0");
        } else {
            $this->info('   ✅ All books have prices');
        }
    }

    private function checkInvalidStatus(): void
    {
        $this->info('7. Checking invalid status values...');
        
        $validStatuses = ['draft', 'published', 'production', 'importing', 'upload_failed', 'isbn_request'];
        
        $books = Book::whereNotIn('status', $validStatuses)->get();
        $count = $books->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            $books->each(fn($b) => $b->update(['status' => 'draft']));
            $this->fixed += $count;
            
            $this->warn("   ⚠️ Found {$count} books with invalid status → Set to 'draft'");
        } else {
            $this->info('   ✅ All books have valid status');
        }
    }

    private function checkAuthorsWithoutEmail(): void
    {
        $this->info('8. Checking authors without email...');
        
        $authors = Author::whereNull('email')->orWhere('email', '')->get();
        $count = $authors->count();
        
        if ($count > 0) {
            $this->issues += $count;
            
            foreach ($authors as $author) {
                $author->update([
                    'email' => Str::slug($author->name) . '@placeholder.rizquna.id',
                ]);
            }
            
            $this->fixed += $count;
            $this->warn("   ⚠️ Found {$count} authors without email → Generated placeholder");
        } else {
            $this->info('   ✅ All authors have emails');
        }
    }
}
