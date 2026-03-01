<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // LEAVE_APPROVED, OVERTIME_APPROVED, PAYROLL_GENERATED, etc.
            $table->string('title');
            $table->text('message');
            $table->string('action_url')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('content');
            $table->string('priority')->default('NORMAL'); // NORMAL, HIGH, URGENT
            $table->timestamp('published_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->string('department')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('image_url')->nullable();
            $table->string('file_url')->nullable();
            $table->integer('view_count')->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('hr_notifications');
    }
};
