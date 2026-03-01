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
        Schema::create('legal_deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->string('tracking_number')->nullable()->unique(); // From Perpustakaan Nasional
            $table->string('status')->default('pending'); // pending, submitted, received, rejected
            $table->date('submission_date')->nullable();
            $table->date('received_at')->nullable();
            $table->string('receipt_path')->nullable(); // Scan of receipt/certificate
            $table->string('certificate_number')->nullable(); // Nomor sertifikat depot hukum
            $table->string('institution')->default('Perpustakaan Nasional');
            $table->integer('copies_submitted')->default(2);
            $table->text('notes')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('tracking_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_deposits');
    }
};
