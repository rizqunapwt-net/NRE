<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update the marketplaces table to add more fields
        Schema::table('marketplaces', function (Blueprint $table) {
            if (! Schema::hasColumn('marketplaces', 'slug')) {
                $table->string('slug', 100)->unique()->after('name');
            }
            if (! Schema::hasColumn('marketplaces', 'logo_url')) {
                $table->string('logo_url', 500)->nullable()->after('slug');
            }
            if (! Schema::hasColumn('marketplaces', 'website_url')) {
                $table->string('website_url', 500)->nullable()->after('logo_url');
            }
            if (! Schema::hasColumn('marketplaces', 'api_endpoint')) {
                $table->string('api_endpoint', 500)->nullable()->after('website_url');
            }
            if (! Schema::hasColumn('marketplaces', 'api_credentials')) {
                $table->jsonb('api_credentials')->nullable()->after('api_endpoint');
            }
            if (! Schema::hasColumn('marketplaces', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(0)->after('api_credentials');
            }
        });

        // Create marketplace_listings table
        Schema::create('marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ebook_id')->constrained()->cascadeOnDelete();
            $table->foreignId('marketplace_id')->constrained()->cascadeOnDelete();
            $table->string('external_id', 255)->nullable();
            $table->string('listing_url', 500)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('status', 50)->default('pending'); // pending, active, inactive, rejected
            $table->timestamp('synced_at')->nullable();
            $table->timestamp('last_sync_attempt')->nullable();
            $table->text('sync_error')->nullable();
            $table->timestamps();

            $table->unique(['ebook_id', 'marketplace_id']);
            $table->index('ebook_id');
            $table->index('marketplace_id');
            $table->index('status');
        });

        // Seed major marketplaces
        DB::table('marketplaces')->insert([
            ['code' => 'GRAMEDIA', 'name' => 'Gramedia Digital', 'slug' => 'gramedia', 'commission_rate' => 20.00, 'is_active' => true],
            ['code' => 'AMAZON', 'name' => 'Amazon Kindle', 'slug' => 'amazon', 'commission_rate' => 30.00, 'is_active' => true],
            ['code' => 'GOOGLE', 'name' => 'Google Play Books', 'slug' => 'google-play', 'commission_rate' => 30.00, 'is_active' => true],
            ['code' => 'APPLE', 'name' => 'Apple Books', 'slug' => 'apple-books', 'commission_rate' => 30.00, 'is_active' => true],
            ['code' => 'KOBO', 'name' => 'Kobo', 'slug' => 'kobo', 'commission_rate' => 30.00, 'is_active' => true],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_listings');
    }
};
