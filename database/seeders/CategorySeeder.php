<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'       => 'Agama & Spiritualitas',
                'slug'       => 'agama-spiritualitas',
                'sort_order' => 1,
                'children'   => [
                    ['name' => 'Islam', 'slug' => 'islam'],
                    ['name' => 'Al-Quran & Tafsir', 'slug' => 'al-quran-tafsir'],
                    ['name' => 'Hadits & Sunnah', 'slug' => 'hadits-sunnah'],
                    ['name' => 'Fikih', 'slug' => 'fikih'],
                ],
            ],
            [
                'name'       => 'Pendidikan',
                'slug'       => 'pendidikan',
                'sort_order' => 2,
                'children'   => [
                    ['name' => 'Buku Teks', 'slug' => 'buku-teks'],
                    ['name' => 'Referensi Akademik', 'slug' => 'referensi-akademik'],
                    ['name' => 'Anak & Remaja', 'slug' => 'anak-remaja'],
                ],
            ],
            [
                'name'       => 'Bisnis & Ekonomi',
                'slug'       => 'bisnis-ekonomi',
                'sort_order' => 3,
                'children'   => [
                    ['name' => 'Manajemen', 'slug' => 'manajemen'],
                    ['name' => 'Keuangan Islam', 'slug' => 'keuangan-islam'],
                    ['name' => 'Wirausaha', 'slug' => 'wirausaha'],
                ],
            ],
            [
                'name'       => 'Sosial & Humaniora',
                'slug'       => 'sosial-humaniora',
                'sort_order' => 4,
                'children'   => [
                    ['name' => 'Sejarah', 'slug' => 'sejarah'],
                    ['name' => 'Politik', 'slug' => 'politik'],
                    ['name' => 'Psikologi', 'slug' => 'psikologi'],
                ],
            ],
            [
                'name'       => 'Sastra & Fiksi',
                'slug'       => 'sastra-fiksi',
                'sort_order' => 5,
                'children'   => [
                    ['name' => 'Novel', 'slug' => 'novel'],
                    ['name' => 'Cerpen', 'slug' => 'cerpen'],
                    ['name' => 'Puisi', 'slug' => 'puisi'],
                ],
            ],
            [
                'name'       => 'Sains & Teknologi',
                'slug'       => 'sains-teknologi',
                'sort_order' => 6,
                'children'   => [
                    ['name' => 'Komputer & IT', 'slug' => 'komputer-it'],
                    ['name' => 'Kesehatan', 'slug' => 'kesehatan'],
                    ['name' => 'Lingkungan', 'slug' => 'lingkungan'],
                ],
            ],
        ];

        foreach ($categories as $data) {
            $children = $data['children'] ?? [];
            unset($data['children']);

            $parent = Category::firstOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['is_active' => true])
            );

            foreach ($children as $childData) {
                Category::firstOrCreate(
                    ['slug' => $childData['slug']],
                    array_merge($childData, ['parent_id' => $parent->id, 'is_active' => true])
                );
            }
        }
    }
}
