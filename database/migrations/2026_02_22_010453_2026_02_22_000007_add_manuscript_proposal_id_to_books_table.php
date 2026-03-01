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
            $table->foreignId('manuscript_proposal_id')->nullable()->after('author_id')->constrained()->nullOnDelete();
            $table->string('editorial_status')->nullable()->after('status'); // drafting, editing, proofreading, typesetting, ready_to_publish
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropForeign(['manuscript_proposal_id']);
            $table->dropColumn(['manuscript_proposal_id', 'editorial_status']);
        });
    }
};
