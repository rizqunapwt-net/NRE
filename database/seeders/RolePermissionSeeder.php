<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Rizquna hanya pakai 2 role: Admin (full access) dan User (multi-fungsi).
     * 
     * User role punya semua permission, tapi akses dikontrol oleh:
     * - Feature flags (beli buku, submit naskah, dll)
     * - Ownership (hanya bisa manage data sendiri)
     * - Payment status (hanya yang sudah beli bisa baca)
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── PERMISSIONS ──
        $permissions = [
            // ═══════════════════════════════════════════════════════════════
            // ADMIN ONLY PERMISSIONS
            // ═══════════════════════════════════════════════════════════════
            // User & System Management
            'users.manage',              // CRUD users, assign roles
            'users.view',                // View user list
            'roles.manage',              // Manage roles & permissions
            'dashboard.admin',           // Admin dashboard access
            'reports.view',              // View system reports
            'audit.view',                // View audit logs
            'system.settings',           // System configuration
            
            // Publishing Management (Admin)
            'authors.manage',            // CRUD authors (admin side)
            'books.manage',              // CRUD books (admin side)
            'contracts.manage',          // Approve/reject contracts
            'marketplaces.manage',       // Manage marketplace integration
            'assignments.manage',        // Assign books to marketplace
            'sales.import',              // Import sales CSV
            'royalties.manage',          // Calculate & finalize royalties
            'publishing-requests.manage',// Review publishing requests
            'isbn.manage',               // Manage ISBN requests
            'legal-deposit.manage',      // Manage legal deposit
            
            // Finance Management (Admin)
            'payments.manage',           // Manage payments
            'accounting.manage',         // Manage accounting
            'invoices.manage',           // Manage invoices
            'expenses.manage',           // Manage expenses
            
            // Percetakan Management (Admin)
            'percetakan.customers.manage',
            'percetakan.orders.manage',
            'percetakan.inventory.manage',
            'percetakan.production.manage',
            
            // HRM (Admin)
            'hrm.attendance.manage',
            'hrm.leave.manage',
            'hrm.payroll.manage',
            
            // Website CMS (Admin)
            'website.manage',            // Manage website content
            
            // ═══════════════════════════════════════════════════════════════
            // USER PERMISSIONS (Multi-fungsi)
            // ═══════════════════════════════════════════════════════════════
            // Dashboard & Profile
            'dashboard.user',            // User dashboard access
            'profile.manage',            // Manage own profile
            
            // Digital Library - Reader (Pengunjung/Pembeli)
            'library.browse',            // Browse catalog
            'library.search',            // Search books
            'library.read',              // Read purchased books
            'library.purchase',          // Purchase books
            'library.cite',              // Cite books (academic)
            
            // Digital Library - Owner (Penulis untuk karya sendiri)
            'library.download.own',      // Download own books
            'library.print.own',         // Print own books
            'library.manage.own',        // Manage own books (edit metadata, etc)
            
            // Author - Penulis
            'author.dashboard',          // Author dashboard
            'author.profile',            // Manage author profile
            'author.manuscript.submit',  // Submit manuscript
            'author.manuscript.view',    // View own manuscripts
            'author.contract.sign',      // Sign contracts
            'author.royalty.view',       // View royalty reports
            'author.sales.view',         // View sales data
            'author.print-order',        // Order printing
            'author.books.manage',       // Manage own published books
            
            // Communication
            'chat.use',                  // Use chat feature
            'notifications.manage',      // Manage notification preferences
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ── ROLES ──
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $user = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);

        // Admin: ALL permissions
        $admin->syncPermissions($permissions);

        // User: USER permissions only (multi-fungsi)
        $user->syncPermissions([
            // Dashboard & Profile
            'dashboard.user',
            'profile.manage',
            
            // Digital Library - Reader
            'library.browse',
            'library.search',
            'library.read',           // Only for purchased books (checked by ownership)
            'library.purchase',
            'library.cite',
            
            // Digital Library - Owner (Penulis untuk karya sendiri)
            'library.download.own',   // Download own books
            'library.print.own',      // Print own books
            'library.manage.own',     // Manage own books
            
            // Author - Penulis
            'author.dashboard',
            'author.profile',
            'author.manuscript.submit',
            'author.manuscript.view',
            'author.contract.sign',
            'author.royalty.view',
            'author.sales.view',
            'author.print-order',
            'author.books.manage',    // Manage own published books
            
            // Communication
            'chat.use',
            'notifications.manage',
        ]);

        // Cleanup: hapus role lama atau sanctum-guard roles yang tidak dipakai
        Role::where('guard_name', 'sanctum')->delete();
        Role::where('guard_name', 'web')->whereNotIn('name', ['Admin', 'User'])->delete();
    }
}
