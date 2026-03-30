<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            // PostgreSQL specific
            DB::statement('ALTER TABLE books ALTER COLUMN tracking_code SET DATA TYPE character varying(20)');
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, so no action needed
            // SQLite TEXT columns support any length
        } else {
            // MySQL/MariaDB
            DB::statement('ALTER TABLE books MODIFY tracking_code VARCHAR(20)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE books ALTER COLUMN tracking_code SET DATA TYPE character varying(10)');
        } elseif ($driver === 'sqlite') {
            // No action needed for SQLite
        } else {
            DB::statement('ALTER TABLE books MODIFY tracking_code VARCHAR(10)');
        }
    }
};
