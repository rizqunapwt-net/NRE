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
        // Drop old unique index
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS unique_active_book_access');
            
            // Create new unique index that includes granted_by
            // This allows multiple access types (payment + admin_manual) for same user+book
            DB::statement('
                CREATE UNIQUE INDEX unique_active_book_access
                ON book_access (user_id, book_id, granted_by)
                WHERE is_active = true AND deleted_at IS NULL
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS unique_active_book_access');
            
            // Restore original index
            DB::statement('
                CREATE UNIQUE INDEX unique_active_book_access
                ON book_access (user_id, book_id)
                WHERE is_active = true AND deleted_at IS NULL
            ');
        }
    }
};
