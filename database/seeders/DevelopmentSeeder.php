<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DevelopmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Categories Seeder
        $categories = [
            ['name' => 'Pendidikan', 'slug' => 'pendidikan', 'description' => 'Buku seputar dunia pendidikan dan pembelajaran.'],
            ['name' => 'Islam', 'slug' => 'islam', 'description' => 'Buku bertema keislaman, fiqih, dan sejarah Islam.'],
            ['name' => 'Akademik', 'slug' => 'akademik', 'description' => 'Buku teks, jurnal, dan referensi perkuliahan.'],
            ['name' => 'Manajemen', 'slug' => 'manajemen', 'description' => 'Buku tentang bisnis, kepemimpinan, dan manajemen.'],
            ['name' => 'Sejarah', 'slug' => 'sejarah', 'description' => 'Buku catatan peristiwa masa lalu dan tokoh inspiratif.'],
            ['name' => 'Teknologi', 'slug' => 'teknologi', 'description' => 'Buku seputar IT, pemrograman, dan inovasi teknologi.'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
        $categoryIds = Category::pluck('id')->toArray();

        // 2. Users Seeder
        $roles = DB::table('roles')->pluck('id', 'name')->toArray();
        $adminRoleId = $roles['Admin'] ?? null;
        $userRoleId = $roles['User'] ?? null;

        // Admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@rizquna.com'],
            [
                'name' => 'Super Admin NRE',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if ($adminRoleId) {
            DB::table('model_has_roles')->updateOrInsert(
                ['role_id' => $adminRoleId, 'model_type' => User::class, 'model_id' => $admin->id]
            );
        }

        // 3 Penulis (Users)
        $authorUsers = [];
        for ($i = 1; $i <= 3; $i++) {
            $user = User::updateOrCreate(
                ['email' => "penulis$i@gmail.com"],
                [
                    'name' => "Penulis Contoh $i",
                    'username' => "penulis$i",
                    'password' => Hash::make('password'),
                    'is_active' => true,
                    'is_verified_author' => true,
                    'author_verified_at' => now(),
                    'email_verified_at' => now(),
                ]
            );
            if ($userRoleId) {
                DB::table('model_has_roles')->updateOrInsert(
                    ['role_id' => $userRoleId, 'model_type' => User::class, 'model_id' => $user->id]
                );
            }
            $authorUsers[] = $user;
        }

        // 1 Percetakan (User)
        $percetakan = User::updateOrCreate(
            ['email' => 'percetakan@rizquna.com'],
            [
                'name' => 'Mitra Percetakan',
                'username' => 'percetakan',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if ($userRoleId) {
            DB::table('model_has_roles')->updateOrInsert(
                ['role_id' => $userRoleId, 'model_type' => User::class, 'model_id' => $percetakan->id]
            );
        }

        // 3. Authors Seeder (Profile)
        $authorNames = [
            'Dr. Ahmad Dahlan, M.Pd', 'Prof. Siti Aminah', 'Hamzah Fansuri', 'Buya Hamka', 
            'Ki Hajar Dewantara', 'R.A. Kartini', 'Tan Malaka', 'Mohammad Hatta', 
            'Sutan Sjahrir', 'Dewi Sartika', 'Agus Salim', 'Wahid Hasyim', 
            'Natsir', 'Syahruddin', 'Zubair Ahmad'
        ];

        $authors = [];
        foreach ($authorNames as $index => $name) {
            $authors[] = Author::updateOrCreate(
                ['email' => Str::slug($name) . '@example.com'],
                [
                    'name' => $name,
                    'phone' => '0812' . rand(10000000, 99999999),
                    'address' => 'Jl. Contoh Alamat No. ' . ($index + 1),
                    'bio' => "Profil biografi dari $name. Beliau adalah seorang pakar di bidangnya dan telah menulis banyak karya inspiratif.",
                    'status' => 'active',
                ]
            );
        }
        $authorIds = collect($authors)->pluck('id')->toArray();

        // 4. Marketplaces Seeder
        $marketplaces = [
            ['name' => 'Tokopedia', 'slug' => 'tokopedia', 'code' => 'TKP', 'is_active' => true],
            ['name' => 'Shopee', 'slug' => 'shopee', 'code' => 'SPH', 'is_active' => true],
            ['name' => 'Blibli', 'slug' => 'blibli', 'code' => 'BLB', 'is_active' => true],
            ['name' => 'Gramedia', 'slug' => 'gramedia', 'code' => 'GRM', 'is_active' => true],
        ];

        foreach ($marketplaces as $mp) {
            Marketplace::updateOrCreate(['slug' => $mp['slug']], $mp);
        }

        // 5. Books Seeder
        $bookTitles = [
            'Metodologi Penelitian Kualitatif', 'Fiqih Kontemporer Jilid 1', 'Manajemen SDM Modern',
            'Sejarah Peradaban Islam', 'Dasar-Dasar Pemrograman Python', 'Psikologi Pendidikan Anak',
            'Ekonomi Syariah di Indonesia', 'Kecerdasan Buatan untuk Pemula', 'Strategi Pemasaran Digital',
            'Sosiologi Masyarakat Modern', 'Arsitektur Komputer Dasar', 'Hukum Perdata Indonesia',
            'Fisika Terapan untuk Teknik', 'Kimia Dasar untuk Mahasiswa', 'Biologi Molekuler Modern',
            'Matematika Diskrit dan Logika', 'Teori Komunikasi Massa', 'Etika Bisnis Global',
            'Pengantar Ilmu Politik', 'Geografi Regional Indonesia', 'Bahasa Indonesia Akademik',
            'Inggris untuk Keperluan Khusus', 'Statistik Terapan untuk Bisnis', 'Akuntansi Keuangan Dasar',
            'Sistem Informasi Manajemen', 'Keamanan Siber di Era Digital', 'Analisis Data dengan R',
            'Pengembangan Kurikulum Merdeka', 'Teknik Penulisan Karya Ilmiah', 'Public Speaking Efektif',
            'Kepemimpinan Transformasional', 'Inovasi Teknologi Pendidikan', 'Manajemen Operasional Jilid 2',
            'Hukum Tata Negara Kontemporer', 'Pengantar Filsafat Ilmu', 'Antropologi Budaya Indonesia',
            'Jurnalistik Dasar untuk Mahasiswa', 'Desain Grafis dengan Canva', 'Manajemen Proyek IT',
            'Cloud Computing untuk Bisnis', 'Data Science untuk Pemambil Keputusan', 'IoT dan Masa Depan',
            'Kewirausahaan Berbasis Inovasi', 'Manajemen Rantai Pasok', 'Perpajakan Indonesia 2026',
            'Audit Keuangan Pemerintah', 'Hubungan Internasional Asia Tenggara', 'Diplomasi Digital',
            'Resolusi Konflik Sosial', 'Pembangunan Ekonomi Berkelanjutan'
        ];

        $statuses = ['draft', 'review', 'published', 'archived'];
        $books = [];

        foreach ($bookTitles as $index => $title) {
            $status = ($index < 35) ? 'published' : $statuses[array_rand($statuses)];
            $isPublished = $status === 'published';
            
            $books[] = Book::create([
                'author_id' => $authorIds[array_rand($authorIds)],
                'category_id' => $categoryIds[array_rand($categoryIds)],
                'title' => $title,
                'slug' => Str::slug($title) . '-' . rand(100, 999),
                'isbn' => '978-' . rand(100, 999) . '-' . rand(100, 999) . '-' . rand(10, 99) . '-' . rand(0, 9),
                'description' => "Buku ini membahas tentang $title secara mendalam dan sistematis, sangat cocok untuk mahasiswa dan praktisi.",
                'abstract' => "Abstrak dari buku $title. Memuat ringkasan konten, metodologi, dan tujuan utama dari penulisan buku ini.",
                'price' => rand(45, 150) * 1000,
                'stock' => rand(10, 500),
                'cover_path' => "https://picsum.photos/seed/book-$index/400/600",
                'status' => $status,
                'type' => 'publishing',
                'is_published' => $isPublished,
                'published_at' => $isPublished ? Carbon::now()->subMonths(rand(0, 5))->subDays(rand(1, 28)) : null,
                'published_year' => $isPublished ? 2026 : null,
                'publisher' => 'Rizquna Pustaka',
                'publisher_city' => 'Cirebon',
                'page_count' => rand(150, 450),
                'size' => '15x23 cm',
                'is_digital' => rand(0, 1) === 1,
            ]);
        }

        // 6. Contracts Seeder
        $contractStatuses = ['pending', 'approved', 'rejected', 'expired'];
        foreach (array_slice($books, 0, 30) as $index => $book) {
            $status = $index < 20 ? 'approved' : $contractStatuses[array_rand($contractStatuses)];
            $startDate = Carbon::now()->subMonths(rand(1, 12));
            $endDate = (clone $startDate)->addYears(rand(2, 5));
            
            if ($status === 'expired') {
                $startDate = Carbon::now()->subYears(5);
                $endDate = Carbon::now()->subMonths(1);
            }

            Contract::create([
                'book_id' => $book->id,
                'contract_file_path' => "contracts/contract_" . $book->id . ".pdf",
                'start_date' => $startDate,
                'end_date' => $endDate,
                'royalty_percentage' => rand(10, 20),
                'status' => $status,
                'approved_by' => $status === 'approved' ? $admin->id : null,
                'approved_at' => $status === 'approved' ? Carbon::now()->subMonths(rand(0, 6)) : null,
                'created_by' => $admin->id,
            ]);
        }
    }
}
