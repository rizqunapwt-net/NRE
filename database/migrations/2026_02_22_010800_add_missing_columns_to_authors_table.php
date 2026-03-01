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
        Schema::table('authors', function (Blueprint $table) {
            if (! Schema::hasColumn('authors', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null')->after('id');
            }
            if (! Schema::hasColumn('authors', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('bio');
            }
            if (! Schema::hasColumn('authors', 'bank_account_name')) {
                $table->string('bank_account_name')->nullable()->after('bank_account');
            }
            if (! Schema::hasColumn('authors', 'royalty_percentage')) {
                $table->decimal('royalty_percentage', 8, 2)->default(0)->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'photo_path', 'bank_account_name', 'royalty_percentage']);
        });
    }
};
