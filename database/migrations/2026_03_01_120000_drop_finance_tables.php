<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop all finance/accounting tables that are no longer needed.
     * Admin panel now focuses on: publishing, printing, repository, digital library.
     */
    public function up(): void
    {
        // Accounting
        Schema::dropIfExists('accounting_journal_entries');
        Schema::dropIfExists('accounting_journals');
        Schema::dropIfExists('accounting_accounts');
        Schema::dropIfExists('accounting_periods');

        // Finance modules
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('banks');
        Schema::dropIfExists('products');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('deliveries');

        // HR (not part of publishing/printing scope)
        Schema::dropIfExists('overtime_requests');
    }

    public function down(): void
    {
        // These tables are intentionally not recreated.
        // If needed, restore from the original migration files in version control.
    }
};
