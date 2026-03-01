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
        Schema::create('manuscript_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('manuscript_proposal_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('version_number'); // v1.0, v1.1, v2.0
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->string('file_type')->nullable(); // docx, pdf, etc
            $table->integer('file_size')->nullable(); // in KB
            $table->text('change_log')->nullable();
            $table->boolean('is_current')->default(false);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('version_number');
            $table->index('is_current');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manuscript_versions');
    }
};
