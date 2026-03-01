<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('book_files', function (Blueprint $table) {
            $table->string('storage_disk')->default('books')->after('file_type');
            $table->string('mime_type')->nullable()->after('file_size');
        });
    }

    public function down(): void
    {
        Schema::table('book_files', function (Blueprint $table) {
            $table->dropColumn(['storage_disk', 'mime_type']);
        });
    }
};
