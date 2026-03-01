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
        Schema::create('workflow_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manuscript_proposal_id')->constrained('manuscript_proposals')->cascadeOnDelete();
            $table->string('stage', 100); // submission, admin_review, editing, etc.
            $table->string('status', 50); // pending, in_progress, completed, rejected
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();

            $table->index('manuscript_proposal_id');
            $table->index('stage');
            $table->index('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_history');
    }
};
