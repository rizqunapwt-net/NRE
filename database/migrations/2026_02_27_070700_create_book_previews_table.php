<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_previews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('preview_pdf_path')->nullable();
            $table->unsignedSmallInteger('preview_pages')->default(10);
            $table->boolean('allow_preview')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_previews');
    }
};
