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
            // Google Drive integration columns
            $table->string('google_drive_cover_id')->nullable()->after('cover_file_path')
                  ->comment('Google Drive file ID for book cover');
            $table->string('google_drive_cover_url')->nullable()->after('google_drive_cover_id')
                  ->comment('Google Drive web view URL for book cover');
            $table->string('google_drive_pdf_id')->nullable()->after('google_drive_cover_url')
                  ->comment('Google Drive file ID for book PDF');
            $table->string('google_drive_pdf_url')->nullable()->after('google_drive_pdf_id')
                  ->comment('Google Drive web view URL for book PDF');

            // Index for faster lookups
            $table->index('google_drive_cover_id');
            $table->index('google_drive_pdf_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['google_drive_cover_id']);
            $table->dropIndex(['google_drive_pdf_id']);
            
            $table->dropColumn([
                'google_drive_cover_id',
                'google_drive_cover_url',
                'google_drive_pdf_id',
                'google_drive_pdf_url',
            ]);
        });
    }
};
