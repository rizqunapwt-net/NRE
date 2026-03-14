<?php

namespace App\Console\Commands;

use App\Services\GoogleSheetsService;
use Illuminate\Console\Command;

class SyncGoogleSheets extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'sheets:sync 
                            {--preview : Preview data without saving}
                            {--clear-cache : Clear cache before syncing}';

    /**
     * The console command description.
     */
    protected $description = 'Sync books data from Google Sheets to database';

    protected GoogleSheetsService $sheetsService;

    public function handle(GoogleSheetsService $sheetsService): int
    {
        $this->sheetsService = $sheetsService;

        $this->info('═══════════════════════════════════════════');
        $this->info('📊 Google Sheets Sync - Rizquna Library');
        $this->info('═══════════════════════════════════════════');
        $this->newLine();

        // Clear cache if requested
        if ($this->option('clear-cache')) {
            $this->task('Clearing cache', function () {
                cache()->forget('google_sheets_' . md5(config('google.sheets.library_id')));
            });
            $this->newLine();
        }

        // Get metadata
        $this->info('1. Fetching spreadsheet metadata...');
        $metadata = $sheetsService->getMetadata();
        
        if (empty($metadata)) {
            $this->error('   ✗ Failed to fetch metadata');
            $this->error('   Check Google Sheets ID and permissions');
            return Command::FAILURE;
        }

        $this->info("   ✓ Spreadsheet: {$metadata['title']}");
        $this->info("   ✓ Sheets: " . count($metadata['sheets']));
        
        foreach ($metadata['sheets'] as $sheet) {
            $this->line("      • {$sheet['title']} ({$sheet['rows']} rows × {$sheet['columns']} cols)");
        }
        
        $this->newLine();

        // Preview data
        $this->info('2. Fetching books data...');
        $books = $sheetsService->parseBooksData();
        
        if (empty($books)) {
            $this->error('   ✗ No books found in spreadsheet');
            return Command::FAILURE;
        }

        $this->info("   ✓ Found {$books['total']} books");
        $this->newLine();

        // Preview mode
        if ($this->option('preview')) {
            $this->info('3. Preview (first 5 books):');
            $this->newLine();
            
            foreach (array_slice($books, 0, 5) as $index => $book) {
                $this->line("   <fg=cyan>" . ($index + 1) . ". " . $book['title'] . "</>");
                $this->line("      Author: " . ($book['author'] ?: 'N/A'));
                $this->line("      ISBN: " . ($book['isbn'] ?: 'N/A'));
                $this->line("      Year: " . ($book['year'] ?: 'N/A'));
                $this->line("      Category: " . ($book['category'] ?: 'N/A'));
                $this->newLine();
            }
            
            $this->warn('Preview mode - no data saved to database');
            return Command::SUCCESS;
        }

        // Sync to database
        $this->info('3. Syncing to database...');
        $result = $sheetsService->syncToDatabase();
        
        if (!$result['success']) {
            $this->error("   ✗ {$result['message']}");
            return Command::FAILURE;
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════');
        $this->info('✅ Sync Complete!');
        $this->info('═══════════════════════════════════════════');
        $this->info("   📚 Total in Sheets: {$result['total']}");
        $this->info("   ➕ Created: {$result['created']}");
        $this->info("   🔄 Updated: {$result['updated']}");
        $this->info("   ⚠️  Errors: {$result['errors']}");
        $this->info('═══════════════════════════════════════════');

        return Command::SUCCESS;
    }
}
