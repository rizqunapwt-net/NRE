<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('percetakan_materials')->cascadeOnDelete();
            $table->string('type'); // in, out, adjustment, return
            $table->string('reference_type')->nullable(); // purchase_order, production_job, adjustment
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('quantity_in', 12, 2)->default(0);
            $table->decimal('quantity_out', 12, 2)->default(0);
            $table->decimal('quantity_adjustment', 12, 2)->default(0);
            $table->decimal('quantity_before', 12, 2)->default(0);
            $table->decimal('quantity_after', 12, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('reference_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_transactions');
    }
};
