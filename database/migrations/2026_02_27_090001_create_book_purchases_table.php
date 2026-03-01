<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();

            // Informasi pembayaran
            $table->decimal('amount_paid', 15, 2);
            $table->string('currency', 3)->default('IDR');
            $table->string('payment_method', 50)->nullable();
            // midtrans | xendit | manual | free

            $table->string('payment_status', 30)->default('pending');
            // pending | paid | failed | refunded | expired

            $table->string('transaction_id', 255)->unique()->nullable();
            $table->string('payment_gateway_id', 255)->nullable();
            $table->jsonb('payment_metadata')->nullable();

            // Tipe akses yang dibeli
            $table->string('access_type', 30)->default('permanent');
            // permanent | rental_30d | rental_90d | rental_365d

            // Audit trail
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'payment_status', 'created_at']);
            $table->index(['book_id', 'payment_status']);
            $table->index('payment_status');
            $table->index('transaction_id');
            $table->index(['expires_at', 'payment_status']);
        });

        // PostgreSQL check constraints
        if (config('database.default') === 'pgsql') {
            DB::statement("
                ALTER TABLE book_purchases
                ADD CONSTRAINT chk_purchase_positive_amount CHECK (amount_paid >= 0),
                ADD CONSTRAINT chk_purchase_valid_status CHECK (
                    payment_status IN ('pending','paid','failed','refunded','expired')
                ),
                ADD CONSTRAINT chk_purchase_valid_access_type CHECK (
                    access_type IN ('permanent','rental_30d','rental_90d','rental_365d')
                )
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('book_purchases');
    }
};
