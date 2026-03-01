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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ebook_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Rating
            $table->tinyInteger('rating')->unsigned();

            // Content
            $table->string('title', 255)->nullable();
            $table->text('content');

            // Moderation
            $table->string('status', 50)->default('pending'); // pending, approved, rejected
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('moderation_notes')->nullable();

            // Helpfulness
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);

            // Verified purchase
            $table->boolean('is_verified_purchase')->default(false);

            $table->timestamps();
            $table->softDeletes();

            $table->index('ebook_id');
            $table->index('user_id');
            $table->index('rating');
            $table->index('status');
            $table->index('is_verified_purchase');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
