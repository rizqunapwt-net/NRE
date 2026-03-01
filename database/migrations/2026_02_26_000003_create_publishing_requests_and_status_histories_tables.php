<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publishing_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('synopsis')->nullable();
            $table->string('genre')->nullable();
            $table->string('manuscript_path')->nullable();
            $table->string('status')->default('submitted'); // submitted, review, editing, layout, isbn, printing, published, rejected
            $table->text('editor_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index(['author_id', 'status']);
        });

        Schema::create('status_histories', function (Blueprint $table) {
            $table->id();
            $table->morphs('trackable'); // trackable_type + trackable_id
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index(['trackable_type', 'trackable_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_histories');
        Schema::dropIfExists('publishing_requests');
    }
};
