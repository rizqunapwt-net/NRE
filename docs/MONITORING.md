# 🔍 Production Monitoring Guide - NRE ERP

## Overview
Complete monitoring solution untuk production environment dengan:
- ✅ Error tracking (Sentry)
- ✅ Structured logging (JSON format)
- ✅ Uptime monitoring
- ✅ Performance metrics
- ✅ Automated backups
- ✅ Alerting system

---

## 📁 File Structure

```
scripts/monitoring/
├── uptime-monitor.sh        # Uptime & health monitoring
├── backup-database.sh       # Database backup with S3 upload
├── crontab.example          # Cron job configuration
└── README.md                # This file

app/
├── Console/Commands/
│   └── MonitorPerformance.php  # Performance metrics command
├── Logging/
│   └── JsonLogger.php          # JSON log formatter

config/
├── logging.php                 # Log channel configuration
└── sentry.php                  # Sentry configuration
```

---

## 🚀 Installation

### 1. Install Dependencies

```bash
# Install Sentry PHP SDK (already installed via composer)
composer require sentry/sentry-laravel

# Install AWS CLI for S3 uploads
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# OR install MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

### 2. Configure Environment Variables

Add to `.env`:

```bash
# Logging
LOG_CHANNEL=production
LOG_LEVEL=info
LOG_DAILY_DAYS=30

# Sentry
SENTRY_LARAVEL_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_ENABLE_LOGS=true

# Backup
BACKUP_DIR=/var/backups/nre
S3_BACKUP_BUCKET=rizquna-backups
S3_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
RETENTION_DAYS=30

# Monitoring
MONITOR_BASE_URL=http://localhost:9000
MONITOR_ALERT_EMAIL=admin@rizquna.id
MONITOR_ALERT_WEBHOOK=https://hooks.slack.com/services/xxx
RESPONSE_TIME_THRESHOLD=2000
```

### 3. Setup Cron Jobs

```bash
# Copy crontab example
sudo cp scripts/monitoring/crontab.example /etc/cron.d/nre-monitoring
sudo chmod 644 /etc/cron.d/nre-monitoring

# OR add manually
crontab -e

# Add entries from crontab.example
```

### 4. Create Log Directory

```bash
sudo mkdir -p /var/log/nre
sudo chown www-data:www-data /var/log/nre
sudo chmod 755 /var/log/nre
```

---

## 📊 Monitoring Features

### 1. Uptime Monitoring

**Script:** `scripts/monitoring/uptime-monitor.sh`

**Checks:**
- ✅ Homepage availability
- ✅ API endpoints health
- ✅ Database connection
- ✅ Horizon queue status
- ✅ Disk space usage
- ✅ Memory usage
- ✅ Failed jobs count

**Usage:**
```bash
# Run all checks
./scripts/monitoring/uptime-monitor.sh run

# Generate report only
./scripts/monitoring/uptime-monitor.sh report
```

**Output Example:**
```
[2026-03-15 10:00:00] [INFO] ═══════════════════════════════════════════════════════════
[2026-03-15 10:00:00] [INFO] Starting monitoring checks...
[2026-03-15 10:00:00] [INFO] ✅ Disk Space - 45% used
[2026-03-15 10:00:00] [INFO] ✅ Memory - 62% used
[2026-03-15 10:00:01] [INFO] ✅ Homepage - Status: 200, Response Time: 145ms
[2026-03-15 10:00:01] [INFO] ✅ API Stats - Status: 200, Response Time: 89ms
[2026-03-15 10:00:02] [INFO] ✅ Database - Connected
[2026-03-15 10:00:03] [INFO] ✅ Horizon - Running
```

---

### 2. Database Backup

**Script:** `scripts/monitoring/backup-database.sh`

**Features:**
- ✅ Daily automated backups
- ✅ Compression (gzip)
- ✅ Optional GPG encryption
- ✅ S3/MinIO upload
- ✅ Automatic cleanup (retention policy)
- ✅ Backup manifest (JSON)
- ✅ Restore functionality

**Usage:**
```bash
# Create backup
./scripts/monitoring/backup-database.sh backup

# Restore from backup
./scripts/monitoring/backup-database.sh restore /var/backups/nre/db_20260315_020000.sql.gz

# List available backups
./scripts/monitoring/backup-database.sh list
```

**Backup File Structure:**
```
/var/backups/nre/
├── rizquna_erp_20260315_020000.sql
├── rizquna_erp_20260315_020000.sql.gz
├── rizquna_erp_20260315_020000.dump.gz
├── manifest_20260315_020000.json
```

**S3 Upload Path:**
```
s3://rizquna-backups/database/2026/03/15/rizquna_erp_20260315_020000.sql.gz
```

---

### 3. Performance Monitoring

**Command:** `php artisan monitor:performance`

**Metrics Collected:**
- Database size & connections
- Cache hit rate
- Memory usage
- Slow queries (>100ms)
- Horizon queue stats
- PHP/Laravel version

**Usage:**
```bash
# Human-readable output
php artisan monitor:performance

# JSON output (for monitoring systems)
php artisan monitor:performance --json
```

**JSON Output Example:**
```json
{
  "timestamp": "2026-03-15T10:00:00+07:00",
  "server": {
    "hostname": "nre-app",
    "php_version": "8.4.19",
    "laravel_version": "12.53.0"
  },
  "database": {
    "size": "156 MB",
    "size_bytes": 163577856,
    "active_connections": 5,
    "max_connections": 100
  },
  "memory": {
    "current_usage": "32.5 MB",
    "peak_usage": "48.2 MB",
    "memory_limit": "2048M"
  },
  "queries": [
    {
      "query": "SELECT * FROM books WHERE...",
      "calls": 1250,
      "avg_time_ms": 245.67,
      "total_time_ms": 307087.5
    }
  ],
  "horizon": {
    "status": "active",
    "jobs_per_minute": 45,
    "processes_running": 3,
    "failed_jobs": 2,
    "wait_time": "1.2s"
  }
}
```

---

### 4. Error Tracking (Sentry)

**Configuration:** `config/sentry.php`

**Features:**
- ✅ Automatic error capture
- ✅ Performance tracing
- ✅ SQL query tracking
- ✅ Cache event tracking
- ✅ Queue job monitoring
- ✅ Breadcrumbs for debugging

**Manual Error Reporting:**
```php
use Sentry;

// Capture exception
try {
    // Some code
} catch (\Exception $e) {
    Sentry\captureException($e);
}

// Add context
Sentry\configureScope(function (Sentry\State\Scope $scope): void {
    $scope->setTag('user_id', auth()->id());
    $scope->setExtra('action', 'book_purchase');
});

// Capture message
Sentry\captureMessage('Something important happened', 'info');
```

**Logging Channel:**
```php
// Use Sentry log channel
Log::channel('sentry')->error('Critical error occurred', ['context' => $data]);
```

---

### 5. Structured Logging

**Configuration:** `config/logging.php`

**Log Channels:**
- `production` - JSON formatted logs with rotation
- `sentry` - Sentry-specific logs
- `daily` - Standard Laravel daily logs

**Usage:**
```php
use Illuminate\Support\Facades\Log;

// Production JSON logging
Log::channel('production')->info('User logged in', [
    'user_id' => $user->id,
    'email' => $user->email,
    'ip_address' => request()->ip(),
]);

// Different log levels
Log::debug('Debug information');
Log::info('General information');
Log::warning('Warning message');
Log::error('Error occurred');
Log::critical('Critical failure');
```

**Log Format (JSON):**
```json
{
  "message": "User logged in",
  "context": {
    "user_id": 123,
    "email": "user@example.com",
    "ip_address": "192.168.1.1"
  },
  "level": "info",
  "level_name": "INFO",
  "channel": "production",
  "datetime": "2026-03-15T10:00:00+07:00",
  "extra": {
    "server": "nre-app",
    "memory_usage": "32.5 MB"
  }
}
```

---

## 🚨 Alerting

### Alert Channels

1. **Email Alerts**
   - Configured via `MONITOR_ALERT_EMAIL`
   - Uses system `mail` command

2. **Slack/Discord Webhooks**
   - Configured via `MONITOR_ALERT_WEBHOOK`
   - JSON formatted messages

3. **Log-based Alerts**
   - Parse logs with ELK/DataDog
   - Set up alert rules

### Alert Triggers

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Endpoint Down | HTTP != 200 | Critical |
| Slow Response | > 2000ms | Warning |
| High Disk Usage | > 80% | Warning |
| High Memory Usage | > 90% | Warning |
| Database Down | Connection failed | Critical |
| Horizon Stopped | Not running | Critical |
| Failed Jobs | > 10 jobs | Warning |

---

## 📈 Dashboard Integration

### DataDog

```yaml
# datadog-conf.yaml
logs:
  - type: file
    path: /var/www/html/storage/logs/production.log
    service: nre-erp
    source: php
    log_processing_rules:
      - type: multi_line
        name: log_start
        pattern: ^\{
```

### ELK Stack

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/www/html/storage/logs/production.log
  json.keys_under_root: true
  json.add_error_key: true
  json.message_key: message

output.elasticsearch:
  hosts: ["localhost:9200"]
  indices:
    - index: "nre-logs-%{+yyyy.MM.dd}"
```

### Grafana + Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nre-metrics'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

---

## 🔧 Troubleshooting

### Logs Not Being Written

```bash
# Check permissions
ls -la storage/logs/

# Fix permissions
chmod -R 775 storage/logs/
chown -R www-data:www-data storage/logs/
```

### Backup Failing

```bash
# Check disk space
df -h

# Test database connection
php artisan db:show

# Test S3 connection
aws s3 ls s3://rizquna-backups --endpoint-url http://minio:9000
```

### Sentry Not Sending Events

```bash
# Test Sentry connection
php artisan sentry:test

# Check DSN
echo $SENTRY_LARAVEL_DSN
```

---

## 📚 Related Documentation

- [Sentry PHP Documentation](https://docs.sentry.io/platforms/php/)
- [Laravel Logging](https://laravel.com/docs/logging)
- [Laravel Horizon](https://laravel.com/docs/horizon)
- [PostgreSQL Backup](https://www.postgresql.org/docs/backup.html)

---

**Last Updated:** 2026-03-15
**Author:** Agent 6 (QA & Integration)
