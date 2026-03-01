<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->text('raw_text');
            $table->unsignedInteger('order_number')->default(0);

            // Parsed fields (best effort)
            $table->string('authors')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('title')->nullable();
            $table->string('source')->nullable();
            $table->string('volume')->nullable();
            $table->string('issue')->nullable();
            $table->string('pages')->nullable();
            $table->string('publisher')->nullable();
            $table->string('publisher_city')->nullable();
            $table->string('doi')->nullable();
            $table->string('url')->nullable();
            $table->string('isbn')->nullable();
            $table->string('ref_type')->nullable();
            $table->decimal('parse_quality', 4, 2)->nullable();
            $table->timestamps();

            $table->index(['book_id', 'order_number']);
            $table->index('year');
            $table->index('doi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_references');
    }
};

