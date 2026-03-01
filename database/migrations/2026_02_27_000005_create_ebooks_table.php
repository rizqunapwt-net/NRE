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
        Schema::create('ebooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manuscript_proposal_id')->nullable()->constrained('manuscript_proposals')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->text('description');

            // Publishing info
            $table->string('isbn', 20)->nullable()->unique();
            $table->string('doi', 100)->nullable();
            $table->date('published_date')->nullable();
            $table->string('publisher', 255)->default('E-book Sistem');
            $table->string('edition', 50)->nullable();

            // Pricing
            $table->decimal('price', 12, 2);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->string('currency', 10)->default('IDR');

            // Files
            $table->string('cover_image_url', 500);
            $table->string('ebook_file_url', 500)->nullable();
            $table->string('preview_file_url', 500)->nullable();

            // Metadata
            $table->integer('page_count')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->string('language', 50)->default('id');

            // Statistics
            $table->decimal('rating_average', 3, 2)->default(0);
            $table->integer('review_count')->default(0);
            $table->integer('total_sales')->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);

            // Visibility
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('featured_until')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
            $table->index('isbn');
            $table->index('is_published');
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ebooks');
    }
};
