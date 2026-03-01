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
            if (! Schema::hasColumn('authors', 'social_links')) {
                $table->json('social_links')->nullable()->after('bio');
            }
            if (! Schema::hasColumn('authors', 'notification_preferences')) {
                $table->json('notification_preferences')->nullable()->after('social_links');
            }
            if (! Schema::hasColumn('authors', 'language')) {
                $table->string('language', 10)->default('id')->after('notification_preferences');
            }
        });
    }

    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropColumn(['social_links', 'notification_preferences', 'language']);
        });
    }
};
