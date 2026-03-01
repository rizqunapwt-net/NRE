<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('users')) {
            return;
        }

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

        if (Schema::hasTable('model_has_roles') && $adminRoleId && $userRoleId) {
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

        if (Schema::hasColumn('users', 'role')) {
            DB::table('users')
                ->whereRaw("UPPER(COALESCE(role, '')) = 'ADMIN'")
                ->update(['role' => 'Admin']);

            DB::table('users')
                ->whereRaw("UPPER(COALESCE(role, '')) <> 'ADMIN'")
                ->update(['role' => 'User']);
        }

        DB::table('roles')
            ->where('guard_name', 'web')
            ->whereNotIn('name', ['Admin', 'User'])
            ->delete();
    }

    public function down(): void
    {
        // Intentionally left blank. Legacy roles are deprecated permanently.
    }
};
