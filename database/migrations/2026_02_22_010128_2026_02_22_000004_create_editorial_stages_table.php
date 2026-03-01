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
        Schema::create('editorial_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('manuscript_proposal_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('stage_name'); // initial_editing, author_feedback, final_proofreading, typesetting, cover_design
            $table->string('status')->default('pending'); // pending, in_progress, completed, skipped
            $table->integer('sort_order')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('duration_days')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('stage_name');
            $table->index('status');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('editorial_stages');
    }
};
