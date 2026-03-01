<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom scholar tanpa mengubah kolom books existing.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            if (! Schema::hasColumn('books', 'subtitle')) {
                $table->string('subtitle')->nullable()->after('title');
            }

            if (! Schema::hasColumn('books', 'publisher')) {
                $table->string('publisher')->nullable()->after('subtitle');
            }

            if (! Schema::hasColumn('books', 'publisher_city')) {
                $table->string('publisher_city')->nullable()->after('publisher');
            }

            if (! Schema::hasColumn('books', 'year')) {
                $table->unsignedSmallInteger('year')->nullable()->after('publisher_city');
            }

            if (! Schema::hasColumn('books', 'edition')) {
                $table->string('edition')->nullable()->after('year');
            }

            if (! Schema::hasColumn('books', 'abstract')) {
                $table->text('abstract')->nullable()->after('description');
            }

            if (! Schema::hasColumn('books', 'full_text')) {
                $table->longText('full_text')->nullable()->after('abstract');
            }

            if (! Schema::hasColumn('books', 'file_path')) {
                $table->string('file_path')->nullable()->after('pdf_preview_path');
            }

            if (! Schema::hasColumn('books', 'total_pdf_pages')) {
                $table->unsignedInteger('total_pdf_pages')->nullable()->after('file_path');
            }

            if (! Schema::hasColumn('books', 'bibliography_start_page')) {
                $table->unsignedInteger('bibliography_start_page')->nullable()->after('total_pdf_pages');
            }

            if (! Schema::hasColumn('books', 'pdf_metadata')) {
                $table->jsonb('pdf_metadata')->nullable()->after('bibliography_start_page');
            }

            if (! Schema::hasColumn('books', 'is_parsed')) {
                $table->boolean('is_parsed')->default(false)->after('pdf_metadata');
            }

            if (! Schema::hasColumn('books', 'parsed_at')) {
                $table->timestamp('parsed_at')->nullable()->after('is_parsed');
            }
        });

        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE books ADD COLUMN IF NOT EXISTS search_vector tsvector');
        }
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $columns = [
                'subtitle',
                'publisher',
                'publisher_city',
                'year',
                'edition',
                'abstract',
                'full_text',
                'file_path',
                'total_pdf_pages',
                'bibliography_start_page',
                'pdf_metadata',
                'is_parsed',
                'parsed_at',
            ];

            $existing = array_values(array_filter($columns, fn (string $column): bool => Schema::hasColumn('books', $column)));
            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });

    }
};
