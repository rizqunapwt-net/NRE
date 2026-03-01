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
        Schema::create('editorial_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('manuscript_proposal_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('editor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('proofreader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('designer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('stage'); // editing, proofreading, typesetting, cover_design
            $table->string('status')->default('assigned'); // assigned, in_progress, completed, on_hold
            $table->date('deadline')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('feedback')->nullable();
            $table->text('revision_notes')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('stage');
            $table->index('status');
            $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('editorial_assignments');
    }
};
