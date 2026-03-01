<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // Phase 1 — Digital Library fields
            $table->string('pdf_full_path')->nullable()->after('cover_path');
            $table->string('pdf_preview_path')->nullable()->after('pdf_full_path');
            $table->string('slug')->nullable()->unique()->after('title');
            $table->boolean('is_digital')->default(false)->after('stock');
            $table->boolean('is_published')->default(false)->after('is_digital');
            $table->timestamp('published_at')->nullable()->after('published_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn([
                'pdf_full_path',
                'pdf_preview_path',
                'slug',
                'is_digital',
                'is_published',
                'published_at',
            ]);
        });
    }
};
