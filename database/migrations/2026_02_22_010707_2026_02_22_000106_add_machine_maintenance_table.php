<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machine_maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('percetakan_machines')->cascadeOnDelete();
            $table->string('type'); // preventive, corrective, emergency
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, in_progress, completed, cancelled
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('vendor_name')->nullable();
            $table->string('vendor_contact')->nullable();
            $table->text('work_performed')->nullable();
            $table->text('parts_replaced')->nullable();
            $table->integer('downtime_hours')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->index('scheduled_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_maintenances');
    }
};
