<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Models\SiteContent;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        // ── Hero Section ──
        SiteContent::setValue('hero', 'badge', 'PENERBIT & PERCETAKAN');
        SiteContent::setValue('hero', 'title', 'Wujudkan Karya Terbaikmu Bersama Kami.');
        SiteContent::setValue('hero', 'subtitle', 'Proses penerbitan yang sederhana dan profesional untuk penulis masa kini. Terbitkan karya Anda dengan dukungan tim ahli Rizquna.');
        SiteContent::setValue('hero', 'cta_primary', 'Terbitkan Sekarang');
        SiteContent::setValue('hero', 'cta_secondary', 'Konsultasi Gratis');
        SiteContent::setValue('hero', 'wa_number', '6281294856272');

        // ── Layanan Section ──
        SiteContent::setValue('layanan', 'title', 'Layanan Penerbitan Profesional');
        SiteContent::setValue('layanan', 'subtitle', 'Kami membantu mewujudkan mimpi Anda dari draf kasar hingga distribusi dengan standar kualitas tinggi.');
        SiteContent::setValue('layanan', 'items', json_encode([
            [
                'icon' => 'bulb',
                'title' => 'Konsultasi Menulis',
                'description' => 'Sesi brainstorming dengan mentor kami untuk mematangkan konsep naskah agar memiliki daya jual tinggi.',
            ],
            [
                'icon' => 'edit',
                'title' => 'Editing & Layout Profesional',
                'description' => 'Penyuntingan menyeluruh mencakup tata bahasa, alur cerita, dan penulisan kreatif untuk standar terbaik.',
            ],
            [
                'icon' => 'global',
                'title' => 'ISBN & Distribusi',
                'description' => 'Pengurusan ISBN resmi dan distribusi buku fisik & digital ke berbagai marketplace.',
            ],
            [
                'icon' => 'safety',
                'title' => 'Pengurusan HAKI',
                'description' => 'Perlindungan hak kekayaan intelektual untuk karya Anda melalui pengurusan HAKI resmi.',
            ],
        ]), 'json');

        // ── About Section ──
        SiteContent::setValue('about', 'title', 'Tentang Penerbit Rizquna');
        SiteContent::setValue('about', 'description', 'Penerbit Rizquna (CV. New Rizquna Elfath) merupakan anggota IKAPI resmi (No. 199/JTE/2020) yang berkomitmen membantu para penulis mewujudkan karya terbaik mereka. Berlokasi di Purwokerto, Jawa Tengah, kami melayani penerbitan buku dari seluruh Indonesia.');
        SiteContent::setValue('about', 'ikapi_number', '199/JTE/2020');

        // ── Banner CTA ──
        SiteContent::setValue('banner', 'title', 'Wujudkan Naskah Menjadi Karya Nyata.');
        SiteContent::setValue('banner', 'subtitle', 'Dapatkan pendampingan dari tim ahli Rizquna untuk proses penerbitan yang transparan, cepat, dan berkualitas.');
        SiteContent::setValue('banner', 'cta_text', 'Kirim Naskah');
        SiteContent::setValue('banner', 'cta_url', '/kirim-naskah');

        // ── Footer ──
        SiteContent::setValue('footer', 'address', 'Jl. KS. Tubun Gang Cemar Rt 05/04, Karangsalam Kidul, Kedungbanteng, Banyumas – Purwokerto – Jawa Tengah');
        SiteContent::setValue('footer', 'email', 'cv.rizqunaa@gmail.com');
        SiteContent::setValue('footer', 'phone', '081294856272');
        SiteContent::setValue('footer', 'instagram', 'https://instagram.com/penerbitrizquna');
        SiteContent::setValue('footer', 'facebook', '');
        SiteContent::setValue('footer', 'tiktok', '');
        SiteContent::setValue('footer', 'whatsapp', 'https://wa.me/6281294856272');
        SiteContent::setValue('footer', 'description', 'Platform penerbitan digital terbaik untuk meningkatkan literasi dan pengetahuan Anda melalui koleksi buku berkualitas.');

        // ── SEO ──
        SiteContent::setValue('seo', 'title', 'Penerbit Rizquna - Penerbit Dengan Pelayanan Prima');
        SiteContent::setValue('seo', 'description', 'Penerbit Rizquna adalah penerbit buku profesional di Purwokerto. Layanan penerbitan, percetakan, ISBN, HAKI, dan konsultasi menulis.');
        SiteContent::setValue('seo', 'keywords', 'penerbit buku, penerbit rizquna, cetak buku, ISBN, HAKI, penerbitan buku');

        // ── FAQ ──
        $faqs = [
            ['question' => 'Bagaimana cara mengirim naskah?', 'answer' => 'Anda dapat mengirim naskah melalui dashboard penulis setelah mendaftar dan login. Klik "Kirim Naskah" lalu isi formulir dan upload file naskah Anda.', 'category' => 'umum'],
            ['question' => 'Berapa lama proses penerbitan?', 'answer' => 'Proses penerbitan standar memakan waktu 2-4 minggu tergantung kompleksitas naskah. Kami juga menyediakan layanan fast track untuk proses yang lebih cepat.', 'category' => 'umum'],
            ['question' => 'Apakah ada biaya untuk menerbitkan buku?', 'answer' => 'Kami menawarkan beberapa paket penerbitan yang bisa disesuaikan dengan kebutuhan Anda. Hubungi kami untuk informasi lengkap mengenai paket dan harga.', 'category' => 'umum'],
            ['question' => 'Apa saja format naskah yang diterima?', 'answer' => 'Kami menerima naskah dalam format DOC, DOCX, dan PDF. Pastikan naskah sudah dalam kondisi final sebelum dikirim.', 'category' => 'teknis'],
            ['question' => 'Apakah buku saya akan mendapat ISBN?', 'answer' => 'Ya, setiap buku yang diterbitkan melalui Penerbit Rizquna akan mendapatkan ISBN resmi dari Perpustakaan Nasional Republik Indonesia.', 'category' => 'umum'],
            ['question' => 'Bagaimana cara memantau progres naskah?', 'answer' => 'Setelah naskah dikirim, Anda dapat memantau progres penerbitan secara real-time melalui dashboard penulis. Setiap tahap akan diperbarui secara otomatis.', 'category' => 'teknis'],
            ['question' => 'Apakah ada layanan desain cover?', 'answer' => 'Ya, kami menyediakan layanan desain cover gratis untuk setiap buku yang diterbitkan. Anda juga bisa menggunakan desain cover sendiri jika sudah memiliki.', 'category' => 'umum'],
        ];

        foreach ($faqs as $i => $faq) {
            Faq::create(array_merge($faq, ['sort_order' => $i, 'is_active' => true]));
        }

        // ── Testimonials ──
        $testimonials = [
            ['name' => 'Dr. Ahmad Fauzi, M.Pd.', 'role' => 'Penulis', 'institution' => 'IAIN Purwokerto', 'content' => 'Proses penerbitan di Rizquna sangat profesional dan cepat. Tim editornya sangat membantu dalam memperbaiki naskah saya.', 'rating' => 5],
            ['name' => 'Siti Nurjanah, S.Pd.', 'role' => 'Penulis', 'institution' => 'UNSOED', 'content' => 'Saya sangat puas dengan layanan Penerbit Rizquna. Buku saya terbit tepat waktu dan kualitas cetaknya bagus.', 'rating' => 5],
            ['name' => 'Prof. Budi Santoso', 'role' => 'Penulis', 'institution' => 'UMP', 'content' => 'Sebagai penulis yang sudah menerbitkan beberapa buku, saya merasa Rizquna memberikan pelayanan terbaik dibanding penerbit lain.', 'rating' => 5],
        ];

        foreach ($testimonials as $i => $t) {
            Testimonial::create(array_merge($t, ['sort_order' => $i, 'is_active' => true, 'is_featured' => true]));
        }
    }
}
