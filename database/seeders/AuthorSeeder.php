<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuthorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $authors = [
            [
                'name' => 'Dr. Ahmad Fauzi',
                'email' => 'ahmad.fauzi@example.com',
                'pen_name' => null,
                'bio' => 'Penulis buku-buku pendidikan dan keislaman. Lulusan S3 Pendidikan Islam dari UIN Syarif Hidayatullah.',
                'phone' => '081234567890',
                'address' => 'Jl. Pendidikan No. 123, Jakarta Selatan',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'bank_name' => 'BCA',
                'bank_account' => '1234567890',
                'bank_account_name' => 'Ahmad Fauzi',
                'npwp' => '12.345.678.9-012.000',
                'status' => 'active',
                'royalty_percentage' => 10,
            ],
            [
                'name' => 'Prof. Siti Nurhaliza',
                'email' => 'siti.nurhaliza@example.com',
                'pen_name' => 'Siti N.',
                'bio' => 'Guru Besar Sastra Indonesia. Penulis lebih dari 20 buku fiksi dan non-fiksi.',
                'phone' => '081234567891',
                'address' => 'Jl. Sastra No. 45, Bandung',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'postal_code' => '40123',
                'bank_name' => 'Mandiri',
                'bank_account' => '2345678901',
                'bank_account_name' => 'Siti Nurhaliza',
                'npwp' => '23.456.789.0-123.000',
                'status' => 'active',
                'royalty_percentage' => 12,
            ],
            [
                'name' => 'Muhammad Ridwan',
                'email' => 'muhammad.ridwan@example.com',
                'pen_name' => 'Ridwan',
                'bio' => 'Penulis buku bisnis dan ekonomi syariah. Praktisi keuangan Islam.',
                'phone' => '081234567892',
                'address' => 'Jl. Ekonomi No. 78, Surabaya',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'postal_code' => '60123',
                'bank_name' => 'BRI',
                'bank_account' => '3456789012',
                'bank_account_name' => 'Muhammad Ridwan',
                'npwp' => '34.567.890.1-234.000',
                'status' => 'active',
                'royalty_percentage' => 8,
            ],
            [
                'name' => 'Dr. Fatimah Zahra',
                'email' => 'fatimah.zahra@example.com',
                'pen_name' => 'Fatimah Z.',
                'bio' => 'Penulis buku parenting dan pendidikan anak. Psikolog anak dan keluarga.',
                'phone' => '081234567893',
                'address' => 'Jl. Keluarga No. 90, Yogyakarta',
                'city' => 'Yogyakarta',
                'province' => 'DI Yogyakarta',
                'postal_code' => '55123',
                'bank_name' => 'BNI',
                'bank_account' => '4567890123',
                'bank_account_name' => 'Fatimah Zahra',
                'npwp' => '45.678.901.2-345.000',
                'status' => 'active',
                'royalty_percentage' => 10,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@example.com',
                'pen_name' => 'Budi S.',
                'bio' => 'Penulis buku sains dan teknologi. Lulusan ITB, penggemar sains populer.',
                'phone' => '081234567894',
                'address' => 'Jl. Teknologi No. 12, Semarang',
                'city' => 'Semarang',
                'province' => 'Jawa Tengah',
                'postal_code' => '50123',
                'bank_name' => 'BCA',
                'bank_account' => '5678901234',
                'bank_account_name' => 'Budi Santoso',
                'npwp' => '56.789.012.3-456.000',
                'status' => 'active',
                'royalty_percentage' => 9,
            ],
        ];

        foreach ($authors as $data) {
            $author = Author::firstOrCreate(
                ['email' => $data['email']],
                $data
            );

            // Link author user to author profile
            if (str_contains($data['email'], 'penulis@')) {
                $user = User::where('email', 'penulis@rizquna.com')->first();
                if ($user) {
                    $author->update(['user_id' => $user->id]);
                }
            }
        }
    }
}
