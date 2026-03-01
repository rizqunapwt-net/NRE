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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('subject')->nullable();
            $table->string('type', 50)->default('support'); // support, editorial, manuscript_specific
            $table->foreignId('manuscript_proposal_id')->nullable()->constrained('manuscript_proposals')->nullOnDelete();
            $table->json('participant_ids'); // Array of user IDs
            $table->timestamp('last_message_at')->nullable();
            $table->text('last_message_preview')->nullable();
            $table->string('status', 50)->default('open'); // open, closed, archived
            $table->string('priority', 50)->default('normal'); // low, normal, high, urgent
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('manuscript_proposal_id');
            $table->index('assigned_to');
            $table->index('status');
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_admin')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->primary(['conversation_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
