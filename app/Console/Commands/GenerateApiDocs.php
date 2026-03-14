<?php

namespace App\Console\Commands;

use App\Support\ApiDocs\ApiDocsGenerator;
use Illuminate\Console\Command;
use Throwable;

class GenerateApiDocs extends Command
{
    protected $signature = 'docs:generate {--force : Overwrite existing generated assets}';

    protected $description = 'Generate OpenAPI JSON, Swagger/ReDoc assets, and PDF API documentation';

    public function handle(ApiDocsGenerator $generator): int
    {
        try {
            $result = $generator->generate((bool) $this->option('force'));
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('API documentation generated successfully.');
        $this->line('OpenAPI JSON: '.$result['json_path']);
        $this->line('OpenAPI YAML: '.$result['yaml_path']);
        $this->line('PDF export: '.$result['pdf_path']);
        $this->line('Documented paths: '.$result['paths_count']);

        if ($result['scribe_output'] !== '') {
            $this->newLine();
            $this->line(trim($result['scribe_output']));
        }

        return self::SUCCESS;
    }
}
