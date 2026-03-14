#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Starting backup process for $DATE..."

# 1. Database Backup (PostgreSQL)
echo "🗄️ Backing up database..."
docker exec nre_db_prod pg_dump -U postgres rizquna_erp | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 2. File Backup (Books storage)
echo "📚 Backing up books storage..."
# Assuming books are stored in a named volume or specific path
tar -czf $BACKUP_DIR/books_$DATE.tar.gz -C /var/lib/docker/volumes/nre_books_storage/_data .

# 3. Clean up old backups (older than RETENTION_DAYS)
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup complete! Backups stored in $BACKUP_DIR"
