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
        Schema::create('manuscript_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->text('synopsis');
            $table->text('target_audience')->nullable();
            $table->text('unique_selling_points')->nullable();
            $table->json('table_of_contents')->nullable(); // Chapter titles
            $table->integer('estimated_pages')->nullable();
            $table->string('genre')->nullable();
            $table->string('manuscript_file_path')->nullable();
            $table->string('status')->default('submitted'); // submitted, under_review, accepted, rejected, revised
            $table->text('editorial_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manuscript_proposals');
    }
};
