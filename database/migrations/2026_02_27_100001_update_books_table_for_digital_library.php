<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // Harga original (sebelum diskon)
            $table->decimal('original_price', 12, 2)->nullable()->after('price');

            // Metadata tambahan
            $table->string('language', 10)->nullable()->after('size');
            $table->string('dimension', 50)->nullable()->after('language');

            // Foreign key ke categories
            $table->foreignId('category_id')
                ->nullable()
                ->after('author_id')
                ->constrained('categories')
                ->nullOnDelete();

            // Indexes
            $table->index('category_id');
            $table->index('published_at');
            $table->index(['is_published', 'is_digital']);
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['published_at']);
            $table->dropIndex(['is_published', 'is_digital']);
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);

            $table->dropColumn(['original_price', 'language', 'dimension', 'category_id']);
        });
    }
};
