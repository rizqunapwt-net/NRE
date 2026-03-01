<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Isi slug untuk buku lama yang belum punya slug.
 * Setelah backfill, kolom slug dibuat NOT NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        $books = DB::table('books')->whereNull('slug')->get(['id', 'title']);

        foreach ($books as $book) {
            $baseSlug = Str::slug($book->title ?: 'buku');
            $slug     = $baseSlug;
            $counter  = 1;

            // Ensure uniqueness secara deterministik (judul-2, judul-3, ...)
            while (DB::table('books')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            DB::table('books')->where('id', $book->id)->update(['slug' => $slug]);
        }

        // Setelah semua buku punya slug, enforce NOT NULL
        Schema::table('books', function (Blueprint $table) {
            $table->string('slug', 255)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        // Kembalikan slug ke nullable (tidak hapus data)
        Schema::table('books', function (Blueprint $table) {
            $table->string('slug', 255)->nullable()->change();
        });
    }
};
