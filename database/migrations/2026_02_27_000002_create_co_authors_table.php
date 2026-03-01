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
        Schema::create('co_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manuscript_proposal_id')->constrained('manuscript_proposals')->cascadeOnDelete();
            $table->string('name');
            $table->text('bio')->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('manuscript_proposal_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('co_authors');
    }
};
