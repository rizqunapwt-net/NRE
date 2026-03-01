<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class BookCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Agama & Spiritualitas', 'icon' => '🕌', 'sort_order' => 1],
            ['name' => 'Pendidikan',             'icon' => '📚', 'sort_order' => 2],
            ['name' => 'Sains & Teknologi',      'icon' => '🔬', 'sort_order' => 3],
            ['name' => 'Sosial & Budaya',        'icon' => '🌍', 'sort_order' => 4],
            ['name' => 'Kesehatan',              'icon' => '🏥', 'sort_order' => 5],
            ['name' => 'Hukum & Politik',        'icon' => '⚖️', 'sort_order' => 6],
            ['name' => 'Ekonomi & Bisnis',       'icon' => '💼', 'sort_order' => 7],
            ['name' => 'Sastra & Fiksi',         'icon' => '✍️', 'sort_order' => 8],
            ['name' => 'Sejarah',                'icon' => '🏛️', 'sort_order' => 9],
            ['name' => 'Umum',                   'icon' => '📖', 'sort_order' => 10],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name']],
                array_merge($cat, ['is_active' => true])
            );
        }

        $this->command->info('✅ 10 kategori buku berhasil di-seed.');
    }
}
