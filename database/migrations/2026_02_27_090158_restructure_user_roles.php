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
        // 1. Tambah kolom baru ke users (hanya jika belum ada)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->text('address')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'is_verified_author')) {
                $table->boolean('is_verified_author')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('users', 'author_profile_id')) {
                $table->foreignId('author_profile_id')->nullable()
                      ->constrained('authors')->nullOnDelete()
                      ->after('is_verified_author');
            }
            if (!Schema::hasColumn('users', 'author_verified_at')) {
                $table->timestamp('author_verified_at')->nullable()->after('author_profile_id');
            }
        });

        // 2. Sinkronkan status verifikasi user berdasarkan profil penulis yang sudah terhubung.
        if (Schema::hasTable('authors')) {
            $authorRows = DB::table('authors')
                ->whereNotNull('user_id')
                ->select('id', 'user_id')
                ->get();

            foreach ($authorRows as $authorRow) {
                DB::table('users')
                    ->where('id', $authorRow->user_id)
                    ->update([
                        'is_verified_author' => true,
                        'author_verified_at' => now(),
                        'author_profile_id' => $authorRow->id,
                    ]);
            }
        }

        // 3. Pastikan role inti ada
        DB::table('roles')->insertOrIgnore([
            'name' => 'Admin',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('roles')->insertOrIgnore([
            'name' => 'User',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $adminRoleId = DB::table('roles')
            ->where('name', 'Admin')
            ->where('guard_name', 'web')
            ->value('id');
        $userRoleId = DB::table('roles')
            ->where('name', 'User')
            ->where('guard_name', 'web')
            ->value('id');

        if ($adminRoleId && $userRoleId && Schema::hasTable('model_has_roles')) {
            $nonAdminWebRoleIds = DB::table('roles')
                ->where('guard_name', 'web')
                ->where('name', '!=', 'Admin')
                ->pluck('id');

            if ($nonAdminWebRoleIds->isNotEmpty()) {
                DB::table('model_has_roles')
                    ->where('model_type', 'App\\Models\\User')
                    ->whereIn('role_id', $nonAdminWebRoleIds)
                    ->update(['role_id' => $userRoleId]);
            }
        }

        // Sinkronkan kolom users.role ke enum sederhana Admin/User (hanya jika kolom ada)
        if (Schema::hasColumn('users', 'role')) {
            DB::table('users')
                ->whereRaw("UPPER(COALESCE(role, '')) = 'ADMIN'")
                ->update(['role' => 'Admin']);

            DB::table('users')
                ->whereRaw("UPPER(COALESCE(role, '')) <> 'ADMIN'")
                ->update(['role' => 'User']);
        }

        // 4. Sisakan hanya role final pada guard web
        DB::table('roles')
            ->where('guard_name', 'web')
            ->whereNotIn('name', ['Admin', 'User'])
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['author_profile_id']);
            $table->dropColumn([
                'phone', 'address', 'is_verified_author',
                'author_profile_id', 'author_verified_at',
            ]);
        });
    }
};
