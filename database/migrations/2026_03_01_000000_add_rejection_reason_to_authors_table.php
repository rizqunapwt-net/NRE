<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add rejection_reason column to authors table for admin verification rejection notes.
     */
    public function up(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            if (! Schema::hasColumn('authors', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });
    }
};
