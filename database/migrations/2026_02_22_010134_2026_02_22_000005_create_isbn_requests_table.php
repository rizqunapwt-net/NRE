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
        Schema::create('isbn_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->string('isbn_number')->nullable()->unique(); // 13 digits
            $table->string('isbn_10')->nullable(); // Old 10-digit format
            $table->string('barcode_path')->nullable(); // Path to generated barcode image
            $table->string('status')->default('pending'); // pending, submitted, approved, received, rejected
            $table->string('publisher_name')->nullable();
            $table->string('book_title')->nullable();
            $table->string('author_name')->nullable();
            $table->integer('price')->nullable();
            $table->string('binding_type')->nullable(); // soft cover, hard cover
            $table->integer('page_count')->nullable();
            $table->string('size')->nullable(); // A5, B5, etc
            $table->date('requested_at')->nullable();
            $table->date('approved_at')->nullable();
            $table->date('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('isbn_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('isbn_requests');
    }
};
