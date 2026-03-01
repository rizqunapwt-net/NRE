<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * PostgreSQL-specific optimizations for Phase 1-4
     */
    public function up(): void
    {
        // Only run on PostgreSQL
        if (config('database.default') !== 'pgsql') {
            return;
        }

        // 1. Add full-text search vector to books table.
        // Use raw SQL because Blueprint has no native tsVector() helper.
        DB::statement('ALTER TABLE books ADD COLUMN IF NOT EXISTS search_vector tsvector');

        // 2. Add GIN index for full-text search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_books_search_vector ON books USING GIN(search_vector)');

        // 3. Add composite indexes for common queries
        if (
            Schema::hasColumn('books', 'category_id')
            && Schema::hasColumn('books', 'published_at')
            && Schema::hasColumn('books', 'is_published')
        ) {
            DB::statement("
                CREATE INDEX IF NOT EXISTS idx_books_published_category
                ON books(category_id, published_at DESC)
                WHERE is_published = true
            ");
        } elseif (
            Schema::hasColumn('books', 'published_at')
            && Schema::hasColumn('books', 'is_published')
        ) {
            DB::statement("
                CREATE INDEX IF NOT EXISTS idx_books_published_at
                ON books(published_at DESC)
                WHERE is_published = true
            ");
        }

        if (
            Schema::hasTable('book_access')
            && Schema::hasColumn('book_access', 'user_id')
            && Schema::hasColumn('book_access', 'book_id')
            && Schema::hasColumn('book_access', 'is_active')
        ) {
            DB::statement("
                CREATE INDEX IF NOT EXISTS idx_book_access_active
                ON book_access(user_id, book_id)
                WHERE is_active = true
            ");
        }

        if (
            Schema::hasTable('book_purchases')
            && Schema::hasColumn('book_purchases', 'user_id')
            && Schema::hasColumn('book_purchases', 'book_id')
            && Schema::hasColumn('book_purchases', 'created_at')
            && Schema::hasColumn('book_purchases', 'payment_status')
        ) {
            DB::statement("
                CREATE INDEX IF NOT EXISTS idx_book_purchases_pending
                ON book_purchases(user_id, book_id, created_at DESC)
                WHERE payment_status = 'pending'
            ");
        }

        // 4. Add JSONB metadata column to book_files
        Schema::table('book_files', function (Blueprint $table) {
            if (!Schema::hasColumn('book_files', 'metadata')) {
                $table->jsonb('metadata')->nullable()->after('file_size');
            }
        });

        // 5. Add GIN index for JSONB metadata
        DB::statement('CREATE INDEX IF NOT EXISTS idx_book_files_metadata ON book_files USING GIN(metadata)');

        // 6. Add indexes for performance on frequently queried columns
        if (Schema::hasTable('book_purchases') && Schema::hasColumn('book_purchases', 'payment_status')) {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_book_purchases_payment_status ON book_purchases(payment_status)');
        }
        if (Schema::hasTable('book_access') && Schema::hasColumn('book_access', 'expires_at')) {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_book_access_expires ON book_access(expires_at)');
        }

        // 7. Populate initial search vectors
        if (Schema::hasColumn('books', 'title') && Schema::hasColumn('books', 'description')) {
            DB::statement("
                UPDATE books
                SET search_vector = to_tsvector('indonesian', COALESCE(title, '') || ' ' || COALESCE(description, ''))
                WHERE search_vector IS NULL
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only run on PostgreSQL
        if (config('database.default') !== 'pgsql') {
            return;
        }

        // Drop indexes
        DB::statement('DROP INDEX IF EXISTS idx_books_search_vector');
        DB::statement('DROP INDEX IF EXISTS idx_books_published_category');
        DB::statement('DROP INDEX IF EXISTS idx_books_published_at');
        DB::statement('DROP INDEX IF EXISTS idx_book_access_active');
        DB::statement('DROP INDEX IF EXISTS idx_book_purchases_pending');
        DB::statement('DROP INDEX IF EXISTS idx_book_files_metadata');
        DB::statement('DROP INDEX IF EXISTS idx_book_purchases_payment_status');
        DB::statement('DROP INDEX IF EXISTS idx_book_access_expires');

        // Drop columns
        if (Schema::hasColumn('books', 'search_vector')) {
            Schema::table('books', function (Blueprint $table) {
                $table->dropColumn('search_vector');
            });
        }

        if (Schema::hasColumn('book_files', 'metadata')) {
            Schema::table('book_files', function (Blueprint $table) {
                $table->dropColumn('metadata');
            });
        }
    }
};
