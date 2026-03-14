<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportBooksFromWordPress extends Command
{
    protected $signature = 'library:import-wordpress
                            {--host=localhost : MySQL host}
                            {--port=33068 : MySQL port}
                            {--database=u9443309_wp827 : WordPress database name}
                            {--username=u9443309_wp827 : MySQL username}
                            {--password=wordpress_password : MySQL password}
                            {--dry-run : Show what would be imported without saving}
                            {--limit=0 : Limit number of products to import (0 = all)}';

    protected $description = 'Import WooCommerce products from WordPress database into NRE Books';

    public function handle(): int
    {
        $this->info('🚀 Import Buku dari WordPress (WooCommerce) ke NRE');
        $this->newLine();

        // 1. Setup koneksi ke WordPress DB (MySQL/MariaDB)
        $wpConfig = [
            'driver'   => 'mysql',
            'host'     => $this->option('host'),
            'port'     => $this->option('port'),
            'database' => $this->option('database'),
            'username' => $this->option('username'),
            'password' => $this->option('password'),
            'charset'  => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ];

        config(['database.connections.wordpress' => $wpConfig]);

        try {
            $testCount = DB::connection('wordpress')->table('wp_posts')
                ->where('post_type', 'product')
                ->where('post_status', 'publish')
                ->count();
            $this->info("✅ Koneksi WordPress DB berhasil! Ditemukan {$testCount} produk.");
        } catch (\Exception $e) {
            $this->error("❌ Gagal konek ke WordPress DB: " . $e->getMessage());
            return 1;
        }

        $this->newLine();

        // 2. Ambil semua produk WooCommerce beserta meta-nya
        $query = DB::connection('wordpress')
            ->table('wp_posts as p')
            ->select([
                'p.ID',
                'p.post_title',
                'p.post_content',
                'p.post_excerpt',
                'p.post_date',
                'p.post_name',       // slug
            ])
            ->where('p.post_type', 'product')
            ->where('p.post_status', 'publish')
            ->orderBy('p.ID');

        $limit = (int) $this->option('limit');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $products = $query->get();

        $this->info("📦 Memproses {$products->count()} produk...");
        $this->newLine();

        $imported = 0;
        $skipped  = 0;
        $updated  = 0;

        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        foreach ($products as $product) {
            $bar->advance();

            $title = trim(html_entity_decode(strip_tags($product->post_title)));
            if (empty($title)) {
                $skipped++;
                continue;
            }

            // Ambil meta data dari wp_postmeta
            $metas = DB::connection('wordpress')
                ->table('wp_postmeta')
                ->where('post_id', $product->ID)
                ->whereIn('meta_key', [
                    '_regular_price', '_sale_price', '_sku', '_stock',
                    '_thumbnail_id', '_weight', '_length', '_width', '_height',
                ])
                ->pluck('meta_value', 'meta_key');

            $price     = (float) ($metas['_regular_price'] ?? 0);
            $salePrice = (float) ($metas['_sale_price'] ?? 0);
            $sku       = $metas['_sku'] ?? null;
            $stock     = (int) ($metas['_stock'] ?? 0);

            // Ambil nama gambar cover (thumbnail)
            $thumbnailId = $metas['_thumbnail_id'] ?? null;
            $coverUrl = null;
            if ($thumbnailId) {
                $coverUrl = DB::connection('wordpress')
                    ->table('wp_posts')
                    ->where('ID', $thumbnailId)
                    ->value('guid');
            }

            // Ambil category (taxonomy: product_cat)
            $categories = DB::connection('wordpress')
                ->table('wp_term_relationships as tr')
                ->join('wp_term_taxonomy as tt', 'tr.term_taxonomy_id', '=', 'tt.term_taxonomy_id')
                ->join('wp_terms as t', 'tt.term_id', '=', 't.term_id')
                ->where('tr.object_id', $product->ID)
                ->where('tt.taxonomy', 'product_cat')
                ->pluck('t.name')
                ->toArray();

            // Bersihkan deskripsi
            $description = strip_tags(html_entity_decode($product->post_content));
            $description = preg_replace('/\s+/', ' ', trim($description));
            if (strlen($description) > 2000) {
                $description = Str::limit($description, 2000);
            }

            // Cek apakah buku sudah ada di NRE (by title match)
            $existingBook = Book::where('title', $title)->first();

            if ($this->option('dry-run')) {
                if (!$existingBook) {
                    $this->newLine();
                    $this->line("  [NEW] {$title} | Rp " . number_format($price, 0, ',', '.'));
                    $imported++;
                } else {
                    $skipped++;
                }
                continue;
            }

            if ($existingBook) {
                // Update harga dan stok jika buku sudah ada
                $changes = [];
                if ($price > 0 && (float) $existingBook->price === 0.00) {
                    $changes['price'] = $price;
                }
                if ($salePrice > 0 && !$existingBook->original_price) {
                    $changes['original_price'] = $price;
                    $changes['price'] = $salePrice;
                }

                if (!empty($changes)) {
                    $existingBook->update($changes);
                    $updated++;
                } else {
                    $skipped++;
                }
                continue;
            }

            // Cari atau buat author default
            $author = Author::firstOrCreate(
                ['name' => 'Penulis Rizquna'],
                ['email' => 'penulis@rizquna.id']
            );

            // Buat buku baru di NRE
            $book = Book::create([
                'title'          => $title,
                'author_id'      => $author->id,
                'type'           => 'publishing',
                'status'         => 'published',
                'is_digital'     => true,
                'is_published'   => true,
                'published_at'   => $product->post_date,
                'published_year' => (int) date('Y', strtotime($product->post_date)),
                'publisher'      => 'Penerbit Rizquna Elfath',
                'publisher_city' => 'Cirebon',
                'price'          => $price > 0 ? $price : 0,
                'original_price' => ($salePrice > 0 && $price > $salePrice) ? $price : null,
                'stock'          => $stock,
                'isbn'           => ($sku && $sku !== '-') ? $sku : null,
                'description'    => $description ?: null,
                'import_source'  => 'woocommerce:' . $product->ID,
                'tracking_code'  => 'NRE-' . strtoupper(Str::random(8)),
            ]);

            // Store cover URL from WordPress (can be downloaded later)
            if ($coverUrl) {
                $book->update(['google_drive_cover_url' => $coverUrl]);
            }

            $imported++;
        }

        $bar->finish();
        $this->newLine(2);

        // 3. Ringkasan
        $this->info('═══════════════════════════════════');
        $this->info('  📊 HASIL IMPORT WORDPRESS → NRE');
        $this->info('═══════════════════════════════════');
        $this->table(
            ['Keterangan', 'Jumlah'],
            [
                ['Total Produk WP', $products->count()],
                ['Baru Diimport', $imported],
                ['Di-update', $updated],
                ['Sudah Ada (Skip)', $skipped],
            ]
        );

        if ($this->option('dry-run')) {
            $this->warn('⚠️  Ini adalah DRY RUN. Tidak ada data yang disimpan.');
        }

        // Matikan koneksi WordPress
        DB::disconnect('wordpress');

        return 0;
    }
}
