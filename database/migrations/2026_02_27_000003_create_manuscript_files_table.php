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
        Schema::create('manuscript_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manuscript_proposal_id')->constrained('manuscript_proposals')->cascadeOnDelete();
            $table->string('file_type', 50); // manuscript, cover, attachment, revision_note
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->string('file_url', 500);
            $table->bigInteger('file_size'); // in bytes
            $table->string('mime_type', 100)->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('version')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('manuscript_proposal_id');
            $table->index('file_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manuscript_files');
    }
};
