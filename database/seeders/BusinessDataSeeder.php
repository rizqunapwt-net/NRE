<?php

namespace Database\Seeders;

use App\Enums\BookStatus;
use App\Enums\ContractStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\LegalDeposit;
use App\Models\Percetakan\Customer;
use App\Models\Percetakan\Order;
use App\Models\Percetakan\OrderSpecification;
use App\Models\Percetakan\Product;
use App\Models\Percetakan\ProductCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BusinessDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@nre.com')->first() ?? User::first();

        // 1. Create Authors
        $authors = [
            ['name' => 'Ahmad Rizky', 'email' => 'ahmad@rizquna.id'],
            ['name' => 'Siti Aminah', 'email' => 'siti@rizquna.id'],
            ['name' => 'Budi Santoso', 'email' => 'budi@rizquna.id'],
        ];

        foreach ($authors as $authData) {
            $author = Author::updateOrCreate(
                ['email' => $authData['email']],
                array_merge($authData, [
                    'phone' => '08123456789',
                    'status' => 'active',
                    'royalty_percentage' => 10.00,
                ])
            );

            // 2. Create Publishing Books
            $pubBook = Book::create([
                'type' => 'publishing',
                'title' => 'Membangun Masa Depan '.$author->name,
                'author_id' => $author->id,
                'isbn' => '978-602-'.rand(1000, 9999).'-0',
                'description' => 'Buku inspiratif tentang masa depan.',
                'price' => 75000,
                'stock' => 50,
                'status' => BookStatus::IS_ISBN_PROCESS,
            ]);

            // 3. Create Contract for the book
            Contract::create([
                'book_id' => $pubBook->id,
                'start_date' => now(),
                'end_date' => now()->addYears(2),
                'royalty_percentage' => 10.00,
                'status' => ContractStatus::Approved,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'created_by' => $admin->id,
            ]);

            // 4. Create Legal Deposit for the book
            LegalDeposit::create([
                'book_id' => $pubBook->id,
                'tracking_number' => 'LD-'.strtoupper(Str::random(10)),
                'status' => 'received',
                'submission_date' => now()->subDays(10),
                'received_at' => now()->subDays(2),
                'institution' => 'Perpusnas RI',
                'copies_submitted' => 2,
                'submitted_by' => $admin->id,
            ]);

            // 5. Create Printing Books
            Book::create([
                'type' => 'printing',
                'title' => 'Order Cetak Custom - '.$author->name,
                'author_id' => $author->id,
                'description' => 'Pesanan cetak khusus.',
                'status' => 'production',
            ]);
        }

        // 6. Create Percetakan Specific Data
        $cat = ProductCategory::updateOrCreate(
            ['code' => 'BKS'],
            ['name' => 'Buku', 'description' => 'Kategori produk buku']
        );

        $prod = Product::updateOrCreate(
            ['code' => 'BKS-54'],
            [
                'name' => 'Buku Softcover A5',
                'category_id' => $cat->id,
                'unit' => 'pcs',
                'base_price' => 15000,
                'is_active' => true,
            ]
        );

        $customer = Customer::updateOrCreate(
            ['email' => 'client@corporate.id'],
            [
                'code' => 'CUST-001',
                'name' => 'PT Prima Sejahtera',
                'type' => 'corporate',
                'company_name' => 'PT Prima Sejahtera',
                'phone' => '021-5551234',
                'status' => 'active',
            ]
        );

        $order = Order::create([
            'order_number' => 'ORD-'.date('Ymd').'-0001',
            'customer_id' => $customer->id,
            'sales_id' => $admin->id,
            'status' => 'confirmed',
            'product_id' => $prod->id,
            'specifications' => ['size' => 'A5', 'paper' => 'Bookpaper 57gr'],
            'quantity' => 1000,
            'unit_price' => 12500,
            'subtotal' => 12500000,
            'total_amount' => 13875000,
            'deposit_amount' => 6937500,
            'balance_due' => 13875000,
            'order_date' => now(),
            'deadline' => now()->addDays(14),
        ]);

        OrderSpecification::create([
            'order_id' => $order->id,
            'size' => 'A5',
            'paper_type' => 'Bookpaper',
            'paper_weight' => '57gr',
            'colors_inside' => '1/1',
            'colors_outside' => '4/0',
            'binding_type' => 'Softcover',
            'pages_count' => 200,
            'print_run' => 1000,
        ]);
    }
}
