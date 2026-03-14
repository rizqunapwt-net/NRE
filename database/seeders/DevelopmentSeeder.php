<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\RoyaltyCalculation;
use App\Models\RoyaltyItem;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    /**
     * Seed the application's database untuk development.
     * 
     * Seeder ini membuat:
     * - Admin user
     * - Sample authors dengan user accounts
     * - Sample books untuk setiap author
     * - Sample contracts
     * - Sample sales data
     * - Sample royalty calculations
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding development data...');

        // 1. Pastikan roles ada
        $this->command->info('📋 Ensuring roles exist...');
        $this->call(RolePermissionSeeder::class);

        // 2. Buat admin user
        $this->command->info('👤 Creating admin user...');
        $admin = User::firstOrCreate(
            ['email' => 'admin@rizquna.id'],
            [
                'name' => 'Rizquna Admin',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles(['Admin']);
        $this->command->info("   ✓ Admin: {$admin->email} / password");

        // 3. Pastikan categories ada
        $this->command->info('📚 Ensuring categories exist...');
        $this->call(CategorySeeder::class);

        // 4. Buat sample marketplaces
        $this->command->info('🏪 Creating marketplaces...');
        $marketplaces = $this->createMarketplaces();

        // 5. Buat sample authors dengan user accounts
        $this->command->info('✍️  Creating sample authors...');
        $authors = $this->createAuthors();

        // 6. Buat sample books untuk setiap author
        $this->command->info('📖 Creating sample books...');
        $books = $this->createBooks($authors);

        // 7. Buat sample contracts
        $this->command->info('📝 Creating sample contracts...');
        $this->createContracts($books, $marketplaces);

        // 8. Buat sample sales data
        $this->command->info('💰 Creating sample sales...');
        $this->createSales($books, $marketplaces);

        // 9. Buat sample royalty calculations
        $this->command->info('💵 Creating sample royalties...');
        $this->createRoyalties($authors);

        $this->command->info('✅ Development seeding completed!');
        $this->command->newLine();
        $this->command->info('📌 Sample Accounts:');
        $this->command->info('   Admin: admin@rizquna.id / password');
        $this->command->info('   Author 1: author1@example.com / password');
        $this->command->info('   Author 2: author2@example.com / password');
        $this->command->info('   Author 3: author3@example.com / password');
    }

    private function createMarketplaces(): array
    {
        $marketplaces = [
            ['name' => 'Shopee', 'code' => 'SHOPEE', 'is_active' => true],
            ['name' => 'Tokopedia', 'code' => 'TOKPED', 'is_active' => true],
            ['name' => 'Gramedia Digital', 'code' => 'GRAMDIG', 'is_active' => true],
            ['name' => 'Google Play Books', 'code' => 'GPLAY', 'is_active' => true],
        ];

        $created = [];
        foreach ($marketplaces as $data) {
            $marketplace = Marketplace::firstOrCreate(
                ['code' => $data['code']],
                $data
            );
            $created[] = $marketplace;
            $this->command->info("   ✓ {$marketplace->name}");
        }

        return $created;
    }

    private function createAuthors(): array
    {
        $authorsData = [
            [
                'name' => 'Dr. Ahmad Fauzi',
                'email' => 'author1@example.com',
                'pen_name' => 'A. Fauzi',
                'bio' => 'Dosen dan peneliti di bidang studi Islam. Telah menulis lebih dari 10 buku tentang tafsir Al-Quran dan hadits.',
                'phone' => '081234567801',
                'nik' => '3201011234567801',
                'address' => 'Jl. Pendidikan No. 123',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'postal_code' => '40123',
                'bank_name' => 'Bank Mandiri',
                'bank_account' => '1234567890',
                'bank_account_name' => 'Ahmad Fauzi',
                'npwp' => '12.345.678.9-012.000',
                'royalty_percentage' => 10.00,
                'status' => 'active',
            ],
            [
                'name' => 'Siti Nurhaliza, M.Pd',
                'email' => 'author2@example.com',
                'pen_name' => 'Siti N.',
                'bio' => 'Praktisi pendidikan dengan fokus pada pengembangan kurikulum dan metode pembelajaran inovatif.',
                'phone' => '081234567802',
                'nik' => '3201011234567802',
                'address' => 'Jl. Guru No. 45',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'bank_name' => 'Bank BCA',
                'bank_account' => '0987654321',
                'bank_account_name' => 'Siti Nurhaliza',
                'npwp' => '12.345.678.9-013.000',
                'royalty_percentage' => 12.00,
                'status' => 'active',
            ],
            [
                'name' => 'Budi Santoso, S.E., M.M.',
                'email' => 'author3@example.com',
                'pen_name' => 'B. Santoso',
                'bio' => 'Pengusaha dan konsultan bisnis yang berfokus pada ekonomi Islam dan kewirausahaan.',
                'phone' => '081234567803',
                'nik' => '3201011234567803',
                'address' => 'Jl. Ekonomi No. 78',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'postal_code' => '60123',
                'bank_name' => 'Bank BRI',
                'bank_account' => '5555666677',
                'bank_account_name' => 'Budi Santoso',
                'npwp' => '12.345.678.9-014.000',
                'royalty_percentage' => 15.00,
                'status' => 'active',
            ],
        ];

        $authors = [];
        foreach ($authorsData as $index => $data) {
            $email = $data['email'];
            unset($data['email']);

            // Buat user account untuk author
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $data['name'],
                    'username' => 'author' . ($index + 1),
                    'password' => Hash::make('password'),
                    'is_active' => true,
                    'is_verified_author' => true,
                    'author_verified_at' => now(),
                ]
            );
            $user->syncRoles(['User']);

            // Buat author profile
            $author = Author::firstOrCreate(
                ['user_id' => $user->id],
                array_merge($data, [
                    'is_profile_complete' => true,
                    'profile_completed_at' => now(),
                ])
            );

            $authors[] = $author;
            $this->command->info("   ✓ {$author->name} ({$email})");
        }

        return $authors;
    }

    private function createBooks(array $authors): array
    {
        $categories = Category::whereNull('parent_id')->get();
        
        $booksData = [
            // Books for Author 1 (Dr. Ahmad Fauzi)
            [
                'title' => 'Tafsir Al-Quran Modern',
                'subtitle' => 'Memahami Al-Quran dengan Pendekatan Kontemporer',
                'description' => 'Buku ini menawarkan pendekatan baru dalam memahami tafsir Al-Quran dengan konteks zaman modern.',
                'isbn' => '978-602-1234-01-0',
                'publisher' => 'Rizquna Publishing',
                'year' => 2024,
                'price' => 125000,
                'stock' => 50,
                'status' => 'published',
                'is_published' => true,
                'published_at' => now()->subMonths(6),
            ],
            [
                'title' => 'Hadits dan Kehidupan Sehari-hari',
                'subtitle' => 'Aplikasi Sunnah dalam Kehidupan Modern',
                'description' => 'Panduan praktis mengamalkan hadits Nabi dalam kehidupan sehari-hari.',
                'isbn' => '978-602-1234-02-7',
                'publisher' => 'Rizquna Publishing',
                'year' => 2023,
                'price' => 95000,
                'stock' => 30,
                'status' => 'published',
                'is_published' => true,
                'published_at' => now()->subMonths(12),
            ],
            // Books for Author 2 (Siti Nurhaliza)
            [
                'title' => 'Metode Pembelajaran Abad 21',
                'subtitle' => 'Strategi Mengajar yang Efektif dan Inovatif',
                'description' => 'Buku panduan untuk guru dalam menerapkan metode pembelajaran modern.',
                'isbn' => '978-602-1234-03-4',
                'publisher' => 'Rizquna Publishing',
                'year' => 2024,
                'price' => 110000,
                'stock' => 40,
                'status' => 'published',
                'is_published' => true,
                'published_at' => now()->subMonths(3),
            ],
            [
                'title' => 'Kurikulum Merdeka untuk SD',
                'subtitle' => 'Implementasi dan Praktik Terbaik',
                'description' => 'Panduan lengkap implementasi Kurikulum Merdeka di sekolah dasar.',
                'isbn' => '978-602-1234-04-1',
                'publisher' => 'Rizquna Publishing',
                'year' => 2024,
                'price' => 135000,
                'stock' => 60,
                'status' => 'production',
                'is_published' => false,
            ],
            // Books for Author 3 (Budi Santoso)
            [
                'title' => 'Ekonomi Islam untuk Pemula',
                'subtitle' => 'Prinsip dan Aplikasi Praktis',
                'description' => 'Pengenalan konsep ekonomi Islam yang mudah dipahami.',
                'isbn' => '978-602-1234-05-8',
                'publisher' => 'Rizquna Publishing',
                'year' => 2024,
                'price' => 98000,
                'stock' => 45,
                'status' => 'published',
                'is_published' => true,
                'published_at' => now()->subMonths(4),
            ],
            [
                'title' => 'Wirausaha Syariah',
                'subtitle' => 'Membangun Bisnis Berkah',
                'description' => 'Panduan memulai dan mengembangkan usaha sesuai prinsip syariah.',
                'isbn' => '978-602-1234-06-5',
                'publisher' => 'Rizquna Publishing',
                'year' => 2023,
                'price' => 120000,
                'stock' => 35,
                'status' => 'published',
                'is_published' => true,
                'published_at' => now()->subMonths(8),
            ],
        ];

        $books = [];
        $bookIndex = 0;
        
        foreach ($authors as $authorIndex => $author) {
            // Setiap author dapat 2 buku
            for ($i = 0; $i < 2; $i++) {
                if (!isset($booksData[$bookIndex])) {
                    break;
                }

                $data = $booksData[$bookIndex];
                $category = $categories->random();

                $book = Book::create(array_merge($data, [
                    'author_id' => $author->id,
                    'category_id' => $category->id,
                    'type' => 'publishing',
                    'publisher_city' => $author->city,
                ]));

                $books[] = $book;
                $this->command->info("   ✓ {$book->title} by {$author->name}");
                $bookIndex++;
            }
        }

        return $books;
    }

    private function createContracts(array $books, array $marketplaces): void
    {
        $contractsCreated = 0;
        
        foreach ($books as $book) {
            // Hanya buat kontrak untuk buku yang sudah published
            if ($book->status !== 'published') {
                continue;
            }

            // Buat 1-2 kontrak per buku
            $numContracts = rand(1, 2);
            
            for ($i = 0; $i < $numContracts; $i++) {
                $marketplace = $marketplaces[array_rand($marketplaces)];
                
                Contract::create([
                    'book_id' => $book->id,
                    'marketplace_id' => $marketplace->id,
                    'contract_number' => 'CTR-' . now()->format('Ymd') . '-' . str_pad($contractsCreated + 1, 4, '0', STR_PAD_LEFT),
                    'royalty_percentage' => $book->author->royalty_percentage,
                    'start_date' => now()->subMonths(rand(1, 12)),
                    'end_date' => now()->addYears(rand(1, 3)),
                    'status' => 'approved',
                    'approved_at' => now()->subMonths(rand(1, 6)),
                    'notes' => 'Sample contract for development',
                ]);
                
                $contractsCreated++;
            }
        }

        $this->command->info("   ✓ Created {$contractsCreated} contracts");
    }

    private function createSales(array $books, array $marketplaces): void
    {
        $salesCreated = 0;
        
        // Buat sales data untuk 6 bulan terakhir
        for ($monthsAgo = 5; $monthsAgo >= 0; $monthsAgo--) {
            $periodMonth = now()->subMonths($monthsAgo)->format('Y-m');
            
            foreach ($books as $book) {
                // Hanya buat sales untuk buku yang sudah published
                if ($book->status !== 'published') {
                    continue;
                }

                // Random 1-3 sales per buku per bulan
                $numSales = rand(1, 3);
                
                for ($i = 0; $i < $numSales; $i++) {
                    $marketplace = $marketplaces[array_rand($marketplaces)];
                    $quantity = rand(5, 50);
                    $grossPrice = $book->price;
                    $commission = $grossPrice * ($marketplace->commission_percentage / 100);
                    $netPrice = $grossPrice - $commission;
                    $netAmount = $netPrice * $quantity;

                    Sale::create([
                        'book_id' => $book->id,
                        'marketplace_id' => $marketplace->id,
                        'period_month' => $periodMonth,
                        'quantity' => $quantity,
                        'gross_price' => $grossPrice,
                        'commission_percentage' => $marketplace->commission_percentage,
                        'net_price' => $netPrice,
                        'net_amount' => $netAmount,
                        'notes' => "Sales for {$periodMonth}",
                    ]);
                    
                    $salesCreated++;
                }
            }
        }

        $this->command->info("   ✓ Created {$salesCreated} sales records");
    }

    private function createRoyalties(array $authors): void
    {
        $royaltiesCreated = 0;
        
        // Buat royalty calculations untuk 3 bulan terakhir
        for ($monthsAgo = 2; $monthsAgo >= 0; $monthsAgo--) {
            $periodMonth = now()->subMonths($monthsAgo)->format('Y-m');
            
            foreach ($authors as $author) {
                // Ambil semua sales untuk author di periode ini
                $sales = Sale::whereHas('book', function ($q) use ($author) {
                    $q->where('author_id', $author->id);
                })->where('period_month', $periodMonth)->get();

                if ($sales->isEmpty()) {
                    continue;
                }

                // Hitung total royalty
                $totalRoyalty = 0;
                foreach ($sales as $sale) {
                    $royaltyAmount = $sale->net_amount * ($author->royalty_percentage / 100);
                    $totalRoyalty += $royaltyAmount;
                }

                // Buat royalty calculation
                $royalty = RoyaltyCalculation::create([
                    'author_id' => $author->id,
                    'period_month' => $periodMonth,
                    'total_amount' => $totalRoyalty,
                    'status' => $monthsAgo === 0 ? 'pending' : 'finalized',
                    'calculated_by' => 1, // Admin user ID
                    'calculated_at' => now()->subMonths($monthsAgo)->addDays(5),
                    'finalized_by' => $monthsAgo === 0 ? null : 1,
                    'finalized_at' => $monthsAgo === 0 ? null : now()->subMonths($monthsAgo)->addDays(10),
                ]);

                // Buat royalty items
                foreach ($sales as $sale) {
                    $royaltyAmount = $sale->net_amount * ($author->royalty_percentage / 100);
                    
                    RoyaltyItem::create([
                        'royalty_calculation_id' => $royalty->id,
                        'sale_id' => $sale->id,
                        'book_id' => $sale->book_id,
                        'quantity' => $sale->quantity,
                        'net_price' => $sale->net_price,
                        'royalty_percentage' => $author->royalty_percentage,
                        'amount' => $royaltyAmount,
                    ]);
                }

                $royaltiesCreated++;
            }
        }

        $this->command->info("   ✓ Created {$royaltiesCreated} royalty calculations");
    }
}
