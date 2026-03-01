<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('request_number')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('overtime_date');
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->decimal('total_hours', 5, 2);
            $table->text('reason');
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'overtime_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_requests');
    }
};
