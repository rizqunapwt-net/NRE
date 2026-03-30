<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PostgresMigrationSeeder extends Seeder
{
    public function run(): void
    {
        $filePath = database_path('seeders/migrated_data.json');
        if (!file_exists($filePath)) {
            $this->command->error("Data file not found at $filePath");
            return;
        }

        $data = json_decode(file_get_contents($filePath), true);

        // Clear existing (fresh start)
        DB::statement('TRUNCATE TABLE sales CASCADE');
        DB::statement('TRUNCATE TABLE contracts CASCADE');
        DB::statement('TRUNCATE TABLE books CASCADE');
        DB::statement('TRUNCATE TABLE authors CASCADE');
        DB::statement('TRUNCATE TABLE categories CASCADE');
        DB::statement('TRUNCATE TABLE marketplaces CASCADE');

        $this->command->info('Importing Categories...');
        $catMap = [];
        foreach ($data['categories'] as $cat) {
            $new = Category::create([
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'description' => $cat['description'] ?? null,
            ]);
            $catMap[$cat['id']] = $new->id;
        }

        $this->command->info('Importing Authors...');
        $authorMap = [];
        foreach ($data['authors'] as $author) {
            $new = Author::create([
                'name' => $author['name'],
                'email' => $author['email'],
                'phone' => $author['phone'] ?? null,
                'address' => $author['address'] ?? null,
                'bio' => $author['bio'] ?? null,
                'status' => $author['status'] ?? 'active',
            ]);
            $authorMap[$author['id']] = $new->id;
        }

        $this->command->info('Importing Marketplaces...');
        $marketMap = [];
        foreach ($data['marketplaces'] as $mp) {
            $new = Marketplace::create([
                'name' => $mp['name'],
                'slug' => $mp['slug'],
                'code' => $mp['code'] ?? Str::upper(Str::substr($mp['slug'], 0, 3)),
                'website_url' => $mp['website_url'] ?? null,
                'is_active' => $mp['is_active'] ?? true,
            ]);
            $marketMap[$mp['id']] = $new->id;
        }

        $this->command->info('Importing Books...');
        $bookMap = [];
        foreach ($data['books'] as $book) {
            $new = Book::create([
                'type' => $book['type'] ?? 'publishing',
                'author_id' => $authorMap[$book['author_id']] ?? null,
                'category_id' => $catMap[$book['category_id']] ?? null,
                'title' => $book['title'],
                'slug' => $book['slug'],
                'isbn' => $book['isbn'] ?? null,
                'description' => $book['description'] ?? null,
                'abstract' => $book['abstract'] ?? null,
                'price' => $book['price'] ?? 0,
                'stock' => $book['stock'] ?? 0,
                'status' => $book['status'] ?? 'published',
                'is_published' => $book['is_published'] ?? true,
                'published_at' => $book['published_at'] ?? null,
                'published_year' => $book['published_year'] ?? 2026,
                'publisher' => $book['publisher'] ?? 'Rizquna Pustaka',
                'publisher_city' => $book['publisher_city'] ?? 'Cirebon',
                'page_count' => $book['page_count'] ?? 0,
                'size' => $book['size'] ?? 'A5',
                'cover_path' => $book['cover_path'] ?? null,
                'pdf_full_path' => $book['pdf_full_path'] ?? null,
                'is_digital' => $book['is_digital'] ?? false,
            ]);
            $bookMap[$book['id']] = $new->id;
        }

        $admin = User::where('username', 'admin')->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Super Admin NRE',
                'username' => 'admin',
                'email' => 'admin@rizquna.com',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $admin->assignRole('Admin');
        }

        $this->command->info('Importing Contracts...');
        foreach ($data['contracts'] as $contract) {
            Contract::create([
                'book_id' => $bookMap[$contract['book_id']] ?? null,
                'contract_file_path' => $contract['contract_file_path'] ?? null,
                'start_date' => $contract['start_date'],
                'end_date' => $contract['end_date'],
                'royalty_percentage' => $contract['royalty_percentage'] ?? 10,
                'status' => $contract['status'] ?? 'approved',
                'approved_by' => $admin->id,
                'approved_at' => $contract['approved_at'] ?? now(),
                'created_by' => $admin->id,
            ]);
        }

        $this->command->info('Importing Sales...');
        foreach ($data['sales'] as $sale) {
            Sale::create([
                'marketplace_id' => $marketMap[$sale['marketplace_id']] ?? null,
                'book_id' => $bookMap[$sale['book_id']] ?? null,
                'transaction_id' => $sale['transaction_id'] ?? Str::random(10),
                'period_month' => $sale['period_month'],
                'quantity' => $sale['quantity'] ?? 1,
                'net_price' => $sale['net_price'] ?? 0,
                'status' => $sale['status'] ?? 'completed',
                'imported_by' => $admin->id,
            ]);
        }

        $this->command->info('Postgres migration complete with ' . count($data['books']) . ' real books!');
    }
}
