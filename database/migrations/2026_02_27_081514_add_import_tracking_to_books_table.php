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
        Schema::table('books', function (Blueprint $table) {
            $table->string('import_batch_id')->nullable()->after('status');
            $table->string('import_source')->nullable()->after('import_batch_id');
            $table->string('file_checksum')->nullable()->after('import_source')->index();
            $table->text('import_error')->nullable()->after('file_checksum');
            
            $table->index(['import_batch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['import_batch_id', 'status']);
            $table->dropIndex(['file_checksum']);
            
            $table->dropColumn([
                'import_batch_id',
                'import_source',
                'file_checksum',
                'import_error',
            ]);
        });
    }
};
