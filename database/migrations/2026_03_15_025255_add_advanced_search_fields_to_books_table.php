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
        Schema::table('books', function (Blueprint $table) {
            $table->decimal('rating', 3, 2)->default(4.0)->after('status');
            $table->integer('review_count')->default(0)->after('rating');
            $table->boolean('is_bestseller')->default(false)->after('is_featured');
            $table->integer('sales_count')->default(0)->after('is_bestseller');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['rating', 'review_count', 'is_bestseller', 'sales_count']);
        });
    }
};
