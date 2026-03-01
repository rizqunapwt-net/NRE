<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }

        // pg_trgm untuk pencarian judul partial (ILIKE cepat)
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Trigram index untuk pencarian judul buku
        if (Schema::hasTable('books') && Schema::hasColumn('books', 'title')) {
            DB::statement('
                CREATE INDEX IF NOT EXISTS books_title_trgm_idx
                ON books USING GIN (title gin_trgm_ops)
            ');
        }

        // Trigram index untuk pencarian nama author
        if (Schema::hasTable('authors')) {
            if (Schema::hasColumn('authors', 'name')) {
                DB::statement('
                    CREATE INDEX IF NOT EXISTS authors_name_trgm_idx
                    ON authors USING GIN (name gin_trgm_ops)
                ');
            } elseif (Schema::hasColumn('authors', 'nama')) {
                DB::statement('
                    CREATE INDEX IF NOT EXISTS authors_nama_trgm_idx
                    ON authors USING GIN (nama gin_trgm_ops)
                ');
            }
        }

        // Full-text search dengan bobot (title lebih penting dari description)
        if (
            Schema::hasTable('books')
            && Schema::hasColumn('books', 'title')
            && Schema::hasColumn('books', 'description')
        ) {
            DB::statement("
                CREATE INDEX IF NOT EXISTS books_fulltext_idx
                ON books USING GIN (
                    (
                        setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
                        setweight(to_tsvector('simple', COALESCE(description, '')), 'B')
                    )
                )
            ");
        }

        // Partial index untuk buku yang dipublikasi (query paling sering)
        if (
            Schema::hasTable('books')
            && Schema::hasColumn('books', 'published_at')
            && Schema::hasColumn('books', 'is_published')
        ) {
            DB::statement('
                CREATE INDEX IF NOT EXISTS books_published_at_idx
                ON books (published_at DESC)
                WHERE is_published = true
            ');
        }

        // Partial index untuk filter digital + published
        if (
            Schema::hasTable('books')
            && Schema::hasColumn('books', 'price')
            && Schema::hasColumn('books', 'is_published')
            && Schema::hasColumn('books', 'is_digital')
        ) {
            DB::statement('
                CREATE INDEX IF NOT EXISTS books_digital_published_price_idx
                ON books (price)
                WHERE is_published = true AND is_digital = true
            ');
        }

        // Partial index untuk book_access valid (query paling sering di cek akses)
        if (
            Schema::hasTable('book_access')
            && Schema::hasColumn('book_access', 'user_id')
            && Schema::hasColumn('book_access', 'book_id')
            && Schema::hasColumn('book_access', 'is_active')
            && Schema::hasColumn('book_access', 'expires_at')
            && Schema::hasColumn('book_access', 'deleted_at')
        ) {
            DB::statement('
                CREATE INDEX IF NOT EXISTS book_access_valid_permanent_idx
                ON book_access (user_id, book_id)
                WHERE is_active = true AND expires_at IS NULL AND deleted_at IS NULL
            ');

            DB::statement('
                CREATE INDEX IF NOT EXISTS book_access_valid_expiry_idx
                ON book_access (user_id, book_id, expires_at)
                WHERE is_active = true AND expires_at IS NOT NULL AND deleted_at IS NULL
            ');
        }
    }

    public function down(): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS books_title_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS authors_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS authors_nama_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS books_fulltext_idx');
        DB::statement('DROP INDEX IF EXISTS books_published_at_idx');
        DB::statement('DROP INDEX IF EXISTS books_digital_published_price_idx');
        DB::statement('DROP INDEX IF EXISTS book_access_valid_permanent_idx');
        DB::statement('DROP INDEX IF EXISTS book_access_valid_expiry_idx');
    }
};
