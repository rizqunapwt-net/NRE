<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('section'); // hero, layanan, faq, footer, seo, banner
            $table->string('key'); // title, subtitle, description, etc.
            $table->longText('value')->nullable();
            $table->string('type')->default('text'); // text, html, json, image
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['section', 'key']);
            $table->index('section');
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->string('category')->default('umum');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role')->nullable(); // e.g. "Penulis", "Dosen"
            $table->string('institution')->nullable(); // e.g. "UNSOED"
            $table->text('content');
            $table->string('avatar_url')->nullable();
            $table->tinyInteger('rating')->default(5); // 1-5
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('site_contents');
    }
};
