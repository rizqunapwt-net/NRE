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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_message_id')->nullable()->constrained('messages')->nullOnDelete();

            // Content
            $table->text('content');
            $table->string('message_type', 50)->default('text'); // text, image, file, system

            // Attachments
            $table->jsonb('attachments')->default('[]');

            // Status
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->boolean('is_deleted')->default(false);

            // Read receipts
            $table->jsonb('read_by')->default('[]');

            $table->timestamps();

            $table->index('conversation_id');
            $table->index('sender_id');
            $table->index('created_at');
            $table->index('is_deleted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
