<?php

namespace App\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;

class JsonLogger
{
    /**
     * Create a custom Monolog instance with JSON formatting.
     */
    public function __invoke(array $config): Logger
    {
        $logger = new Logger('production');

        // JSON formatted file handler with rotation
        $jsonHandler = new RotatingFileHandler(
            storage_path('logs/production.log'),
            $config['days'] ?? 14,
            $config['level'] ?? Logger::DEBUG
        );
        $jsonHandler->setFormatter(new JsonFormatter());

        // Standard error log for critical errors
        $errorHandler = new RotatingFileHandler(
            storage_path('logs/error.log'),
            $config['days'] ?? 14,
            Logger::ERROR
        );
        $errorHandler->setFormatter(new JsonFormatter());

        $logger->pushHandler($jsonHandler);
        $logger->pushHandler($errorHandler);

        return $logger;
    }
}
