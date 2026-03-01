<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel book_citations hanya menyimpan RAW DATA.
 * Format sitasi (APA/MLA/Chicago/IEEE) di-generate runtime oleh CitationService.
 * Ini mencegah data stale jika publisher name berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_citations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->unique()->constrained()->cascadeOnDelete();

            // Identifikasi
            $table->string('doi', 100)->unique()->nullable();

            // Metadata publikasi (override dari default publisher)
            $table->string('publisher_name', 200)->nullable();
            // null = pakai default 'Penerbit Rizquna Elfath'
            $table->string('edition', 100)->nullable();
            $table->unsignedSmallInteger('publication_year')->nullable();
            $table->string('city', 100)->nullable();
            // null = pakai default 'Jakarta'
            $table->string('country', 100)->default('Indonesia');

            // Konten akademik
            $table->jsonb('keywords')->nullable();
            $table->text('abstract')->nullable();
            $table->string('subject_area', 200)->nullable();

            $table->timestamps();

            $table->index('doi');
            $table->index('publication_year');
        });

        // GIN index untuk keywords search
        if (config('database.default') === 'pgsql') {
            DB::statement('
                CREATE INDEX IF NOT EXISTS book_citations_keywords_gin_idx
                ON book_citations USING GIN (keywords)
            ');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('book_citations');
    }
};
