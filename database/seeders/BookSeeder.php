<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BookSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $authors = Author::all();
        $categories = Category::all();

        if ($authors->isEmpty() || $categories->isEmpty()) {
            $this->command->error('Please run AuthorSeeder and CategorySeeder first!');
            return;
        }

        $books = [
            // Books WITH price (3 books)
            [
                'title' => 'Bermain & Permainan Anak Usia Dini',
                'author_index' => 3, // Dr. Fatimah Zahra
                'category_slug' => 'anak-remaja',
                'price' => 75000,
                'isbn' => '9786029876541',
                'description' => 'Buku ini membahas berbagai metode permainan edukatif untuk anak usia dini yang dapat merangsang perkembangan motorik, kognitif, dan sosial emosional anak.',
                'page_count' => 180,
                'published_year' => 2024,
            ],
            [
                'title' => 'Metode Penelitian Kualitatif',
                'author_index' => 0, // Dr. Ahmad Fauzi
                'category_slug' => 'referensi-akademik',
                'price' => 120000,
                'isbn' => '9786029876542',
                'description' => 'Panduan lengkap metode penelitian kualitatif untuk mahasiswa dan peneliti. Dilengkapi dengan contoh-contoh praktis dan studi kasus.',
                'page_count' => 320,
                'published_year' => 2023,
            ],
            [
                'title' => 'Ekonomi Syariah untuk Pemula',
                'author_index' => 2, // Muhammad Ridwan
                'category_slug' => 'keuangan-islam',
                'price' => 85000,
                'isbn' => '9786029876543',
                'description' => 'Pengantar komprehensif tentang prinsip-prinsip ekonomi syariah dan aplikasinya dalam kehidupan sehari-hari.',
                'page_count' => 220,
                'published_year' => 2024,
            ],
            // Books WITHOUT price (price = 0, "Hubungi Kami") - 7 books
            [
                'title' => 'Tafsir Al-Quran Tematik',
                'author_index' => 0, // Dr. Ahmad Fauzi
                'category_slug' => 'al-quran-tafsir',
                'price' => 0,
                'isbn' => '9786029876544',
                'description' => 'Kajian tafsir Al-Quran dengan pendekatan tematik yang membahas berbagai topik kehidupan.',
                'page_count' => 450,
                'published_year' => 2023,
            ],
            [
                'title' => 'Sastra Indonesia Modern',
                'author_index' => 1, // Prof. Siti Nurhaliza
                'category_slug' => 'sastra-fiksi',
                'price' => 0,
                'isbn' => '9786029876545',
                'description' => 'Kajian mendalam tentang perkembangan sastra Indonesia modern dari masa ke masa.',
                'page_count' => 280,
                'published_year' => 2022,
            ],
            [
                'title' => 'Manajemen Bisnis Digital',
                'author_index' => 2, // Muhammad Ridwan
                'category_slug' => 'manajemen',
                'price' => 0,
                'isbn' => '9786029876546',
                'description' => 'Strategi mengelola bisnis di era digital dengan memanfaatkan teknologi dan inovasi.',
                'page_count' => 200,
                'published_year' => 2024,
            ],
            [
                'title' => 'Psikologi Perkembangan Anak',
                'author_index' => 3, // Dr. Fatimah Zahra
                'category_slug' => 'psikologi',
                'price' => 0,
                'isbn' => '9786029876547',
                'description' => 'Memahami tahap-tahap perkembangan anak dari perspektif psikologi modern.',
                'page_count' => 350,
                'published_year' => 2023,
            ],
            [
                'title' => 'Pengantar Teknologi Informasi',
                'author_index' => 4, // Budi Santoso
                'category_slug' => 'komputer-it',
                'price' => 0,
                'isbn' => '9786029876548',
                'description' => 'Buku pengantar untuk memahami dasar-dasar teknologi informasi dan komputer.',
                'page_count' => 250,
                'published_year' => 2024,
            ],
            [
                'title' => 'Sejarah Peradaban Islam',
                'author_index' => 0, // Dr. Ahmad Fauzi
                'category_slug' => 'sejarah',
                'price' => 0,
                'isbn' => '9786029876549',
                'description' => 'Kisah perjalanan peradaban Islam dari masa Nabi Muhammad SAW hingga era modern.',
                'page_count' => 400,
                'published_year' => 2022,
            ],
            [
                'title' => 'Kesehatan Mental di Era Digital',
                'author_index' => 3, // Dr. Fatimah Zahra
                'category_slug' => 'kesehatan',
                'price' => 0,
                'isbn' => '9786029876550',
                'description' => 'Mengatasi tantangan kesehatan mental di tengah gempuran teknologi digital.',
                'page_count' => 180,
                'published_year' => 2024,
            ],
        ];

        foreach ($books as $data) {
            $author = $authors[$data['author_index']];
            $category = Category::where('slug', $data['category_slug'])->first();

            if (!$category) {
                $this->command->warn("Category '{$data['category_slug']}' not found. Skipping '{$data['title']}'");
                continue;
            }

            Book::firstOrCreate(
                ['isbn' => $data['isbn']],
                [
                    'author_id' => $author->id,
                    'category_id' => $category->id,
                    'title' => $data['title'],
                    'slug' => Str::slug($data['title']) . '-' . Str::random(5),
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'page_count' => $data['page_count'],
                    'published_year' => $data['published_year'],
                    'status' => 'published',
                    'is_published' => true,
                    'is_digital' => true,
                    'language' => 'id', // Use short code
                    'publisher' => 'Rizquna Publishing',
                    'publisher_city' => 'Jakarta',
                    'published_at' => now(),
                ]
            );
        }

        $this->command->info('Book seeding completed!');
    }
}
