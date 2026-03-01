<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'address')) {
                $table->text('address')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('users', 'is_verified_author')) {
                $table->boolean('is_verified_author')->default(false)->after('avatar_url');
                $table->index('is_verified_author');
            }
            if (! Schema::hasColumn('users', 'author_verified_at')) {
                $table->timestamp('author_verified_at')->nullable()->after('is_verified_author');
            }
            if (! Schema::hasColumn('users', 'author_profile_id')) {
                // Link langsung ke profil Author (denormalisasi untuk performa)
                $table->unsignedBigInteger('author_profile_id')->nullable()->after('author_verified_at');
                $table->foreign('author_profile_id')
                    ->references('id')
                    ->on('authors')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['author_profile_id']);
            $table->dropIndex(['is_verified_author']);
            $table->dropColumn([
                'phone', 'address', 'is_verified_author',
                'author_verified_at', 'author_profile_id',
            ]);
        });
    }
};
