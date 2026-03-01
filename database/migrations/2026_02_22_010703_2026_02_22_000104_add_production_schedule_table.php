<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('schedule_number')->unique();
            $table->foreignId('order_id')->constrained('percetakan_orders')->cascadeOnDelete();
            $table->foreignId('production_job_id')->nullable()->constrained('percetakan_production_jobs')->nullOnDelete();
            $table->date('planned_start');
            $table->date('planned_end');
            $table->date('actual_start')->nullable();
            $table->date('actual_end')->nullable();
            $table->string('status')->default('planned'); // planned, in_progress, completed, delayed, cancelled
            $table->string('priority')->default('normal'); // low, normal, high, urgent
            $table->boolean('is_rush')->default(false);
            $table->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->text('delay_reason')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('planned_start');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_schedules');
    }
};
