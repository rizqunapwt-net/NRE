<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            if (! Schema::hasColumn('authors', 'pen_name')) {
                $table->string('pen_name')->nullable()->after('name');
            }
            if (! Schema::hasColumn('authors', 'nik')) {
                $table->string('nik', 16)->nullable()->unique()->after('pen_name');
            }
            if (! Schema::hasColumn('authors', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (! Schema::hasColumn('authors', 'province')) {
                $table->string('province')->nullable()->after('city');
            }
            if (! Schema::hasColumn('authors', 'postal_code')) {
                $table->string('postal_code', 10)->nullable()->after('province');
            }
            if (! Schema::hasColumn('authors', 'is_profile_complete')) {
                $table->boolean('is_profile_complete')->default(false)->after('status');
            }
            if (! Schema::hasColumn('authors', 'profile_completed_at')) {
                $table->timestamp('profile_completed_at')->nullable()->after('is_profile_complete');
            }
        });
    }

    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropColumn([
                'pen_name', 'nik', 'city', 'province', 'postal_code',
                'is_profile_complete', 'profile_completed_at',
            ]);
        });
    }
};
