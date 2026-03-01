<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('percetakan_orders')->cascadeOnDelete();
            $table->foreignId('production_job_id')->nullable()->constrained('percetakan_production_jobs')->nullOnDelete();
            $table->string('stage'); // incoming_material, pre_press, first_sheet, in_process, final, pre_delivery
            $table->string('checkpoint_name');
            $table->string('status')->default('pending'); // pending, passed, failed, skipped
            $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('inspected_at')->nullable();
            $table->integer('quantity_checked')->nullable();
            $table->integer('quantity_passed')->nullable();
            $table->integer('quantity_failed')->nullable();
            $table->text('checklist')->nullable(); // JSON: [{item, result, notes}]
            $table->text('defects_found')->nullable();
            $table->text('corrective_action')->nullable();
            $table->boolean('requires_rework')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('stage');
            $table->index('status');
            $table->index('inspected_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_checkpoints');
    }
};
