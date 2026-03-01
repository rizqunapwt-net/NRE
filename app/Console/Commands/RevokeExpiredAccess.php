<?php

namespace App\Console\Commands;

use App\Models\BookAccess;
use App\Services\BookAccessService;
use Illuminate\Console\Command;

class RevokeExpiredAccess extends Command
{
    protected $signature = 'books:revoke-expired-access
        {--dry-run : Simulasi tanpa update data}
        {--days=7 : Juga revoke akses yang expired dalam N hari ke depan}';

    protected $description = 'Revoke akses buku yang sudah expired (scheduled job)';

    public function handle(BookAccessService $accessService): int
    {
        $isDryRun = $this->option('dry-run');
        $forwardDays = (int) $this->option('days');

        if ($isDryRun) {
            $this->warn("🔸 DRY RUN MODE — tidak ada data yang akan diubah");
        }

        // Hitung akses yang sudah expired
        $expiredQuery = BookAccess::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now());

        $expiredCount = $expiredQuery->count();

        // Hitung akses yang akan segera expired (opsional)
        $expiringSoonCount = BookAccess::where('is_active', true)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [now(), now()->addDays($forwardDays)])
            ->count();

        $this->info("📊 Statistik Akses:");
        $this->table(
            ['Status', 'Jumlah'],
            [
                ['⏰ Sudah Expired', $expiredCount],
                ["⚠️ Expired dalam {$forwardDays} hari", $expiringSoonCount],
            ]
        );

        if ($expiredCount === 0) {
            $this->info("✅ Tidak ada akses yang perlu di-revoke");
            return 0;
        }

        // Revoke expired access
        if (!$isDryRun) {
            $revokeCount = 0;

            // Chunk agar tidak OOM pada dataset besar.
            // TIDAK di-wrap dalam satu DB::transaction, karena tiap revoke()
            // sudah atomic via invalidateCache() masing-masing.
            $expiredQuery->chunk(100, function ($accesses) use (&$revokeCount, $accessService) {
                foreach ($accesses as $access) {
                    $accessService->revoke($access->user_id, $access->book_id);
                    $revokeCount++;
                }
            });

            $this->info("✅ Berhasil revoke {$revokeCount} akses expired");

            // Log activity
            activity('access_revoked')
                ->causedBy(null) // System
                ->log("Revoke {$revokeCount} akses expired via scheduled command");
        } else {
            $this->info("📝 Akan revoke {$expiredCount} akses (dry run)");
        }

        // Cache sudah di-invalidate per user oleh accessService->revoke()
        // JANGAN gunakan cache:clear — itu menghapus SEMUA cache (sessions, catalog, dll)

        return 0;
    }
}
