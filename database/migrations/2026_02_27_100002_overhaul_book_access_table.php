<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Overhaul tabel book_access dari Phase 1 ke Phase 2.
 *
 * Phase 1 punya: access_type, granted_by (FK users), notes
 * Phase 2 butuh : access_level, granted_by (string enum), granted_by_admin_id (FK),
 *                 admin_notes, book_purchase_id (FK), granted_at, soft_deletes
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('book_access', function (Blueprint $table) {
            // Hapus unique constraint lama (user_id, book_id) — diganti partial index
            try { $table->dropUnique(['user_id', 'book_id']); } catch (\Throwable) {}

            // Hapus Phase 1 indexes yang akan di-recreate
            try { $table->dropIndex(['user_id', 'is_active']); } catch (\Throwable) {}
            try { $table->dropIndex(['book_id', 'is_active']); } catch (\Throwable) {}

            // Hapus kolom Phase 1 yang akan diganti
            try { $table->dropForeign(['granted_by']); } catch (\Throwable) {}
            $table->dropColumn(['access_type', 'granted_by', 'notes']);
        });

        Schema::table('book_access', function (Blueprint $table) {
            // Level akses
            $table->string('access_level', 30)->default('full')->after('book_id');
            // full | preview_extended | download

            // Sumber akses (string enum, bukan FK)
            $table->string('granted_by', 30)->default('payment')->after('is_active');
            // payment | admin_manual | promo | author_gift | review_copy

            // Admin yang memberi akses manual
            $table->foreignId('granted_by_admin_id')
                ->nullable()
                ->after('granted_by')
                ->constrained('users')
                ->nullOnDelete();

            // Catatan admin
            $table->text('admin_notes')->nullable()->after('granted_by_admin_id');

            // Referensi purchase (jika via payment)
            $table->foreignId('book_purchase_id')
                ->nullable()
                ->after('admin_notes')
                ->constrained('book_purchases')
                ->nullOnDelete();

            // Waktu akses diberikan
            $table->timestamp('granted_at')->useCurrent()->after('book_purchase_id');

            // Soft delete
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'is_active']);
            $table->index(['book_id', 'is_active']);
            $table->index('book_purchase_id');
        });

        // PostgreSQL partial unique index: satu akses aktif per user per buku
        if (config('database.default') === 'pgsql') {
            DB::statement('
                CREATE UNIQUE INDEX unique_active_book_access
                ON book_access (user_id, book_id)
                WHERE is_active = true AND deleted_at IS NULL
            ');
        }
    }

    public function down(): void
    {
        if (config('database.default') === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS unique_active_book_access');
        }

        Schema::table('book_access', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['book_purchase_id']);
            $table->dropForeign(['granted_by_admin_id']);
            $table->dropIndex(['user_id', 'is_active']);
            $table->dropIndex(['book_id', 'is_active']);
            $table->dropIndex(['book_purchase_id']);
            $table->dropColumn([
                'access_level', 'granted_by', 'granted_by_admin_id',
                'admin_notes', 'book_purchase_id', 'granted_at',
            ]);

            // Kembalikan kolom Phase 1
            $table->string('access_type')->default('purchase');
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->unique(['user_id', 'book_id']);
        });
    }
};
