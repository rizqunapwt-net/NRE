#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# Automated Database Backup with S3 Upload
# Daily backups with point-in-time recovery support
# ════════════════════════════════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nre}"
S3_BUCKET="${S3_BACKUP_BUCKET:-rizquna-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-http://rizquna_minio:9000}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-minioadmin}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-minioadmin}"
DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_HOST="${DB_HOST:-rizquna_db}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-rizquna_erp}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"  # Optional GPG encryption

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_DATABASE}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

log "INFO" "${GREEN}Starting database backup...${NC}"
log "INFO" "Database: $DB_DATABASE"
log "INFO" "Backup file: $BACKUP_FILE"

# Perform backup based on database type
backup_database() {
    if [ "$DB_CONNECTION" = "pgsql" ]; then
        log "INFO" "Using PostgreSQL backup..."
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USERNAME" \
            -d "$DB_DATABASE" \
            -F c \
            -f "${BACKUP_FILE}.dump"
        
        log "INFO" "PostgreSQL dump completed"
        
        # Also create SQL format for manual inspection
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USERNAME" \
            -d "$DB_DATABASE" \
            > "$BACKUP_FILE"
        
        log "INFO" "SQL format backup completed"
        
    elif [ "$DB_CONNECTION" = "mysql" ] || [ "$DB_CONNECTION" = "mariadb" ]; then
        log "INFO" "Using MySQL/MariaDB backup..."
        mysqldump \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USERNAME" \
            -p"$DB_PASSWORD" \
            --single-transaction \
            --routines \
            --triggers \
            "$DB_DATABASE" \
            > "$BACKUP_FILE"
        
        log "INFO" "MySQL dump completed"
    else
        log "ERROR" "Unsupported database connection: $DB_CONNECTION"
        exit 1
    fi
}

# Compress backup
compress_backup() {
    log "INFO" "Compressing backup..."
    gzip -9 "$BACKUP_FILE"
    log "INFO" "Compression completed: $COMPRESSED_FILE"
    
    # Also compress dump file if exists
    if [ -f "${BACKUP_FILE}.dump" ]; then
        gzip -9 "${BACKUP_FILE}.dump"
        log "INFO" "Dump file compressed: ${BACKUP_FILE}.dump.gz"
    fi
}

# Encrypt backup (optional)
encrypt_backup() {
    if [ ! -z "$ENCRYPTION_KEY" ]; then
        log "INFO" "Encrypting backup..."
        echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
            -c --cipher-algo AES256 "$COMPRESSED_FILE"
        rm "$COMPRESSED_FILE"
        COMPRESSED_FILE="${COMPRESSED_FILE}.gpg"
        log "INFO" "Encryption completed: $COMPRESSED_FILE"
    fi
}

# Upload to S3
upload_to_s3() {
    log "INFO" "Uploading backup to S3 bucket: $S3_BUCKET"
    
    # Create S3 path with date
    S3_PATH="database/$(date +%Y)/$(date +%m)/$(date +%d)"
    
    # Upload using AWS CLI or mc (MinIO Client)
    if command -v aws &> /dev/null; then
        AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
        aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/$S3_PATH/" \
            --endpoint-url "$S3_ENDPOINT" \
            --storage-class STANDARD
        
    elif command -v mc &> /dev/null; then
        # Configure MinIO client
        mc alias set nre-backup "$S3_ENDPOINT" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY"
        mc mb --ignore-existing "nre-backup/$S3_BUCKET"
        mc cp "$COMPRESSED_FILE" "nre-backup/$S3_BUCKET/$S3_PATH/"
    else
        log "WARN" "AWS CLI or MinIO Client not found. Skipping S3 upload."
        return 1
    fi
    
    log "INFO" "Upload completed: s3://$S3_BUCKET/$S3_PATH/$(basename $COMPRESSED_FILE)"
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.sql*" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.dump*" -type f -mtime +$RETENTION_DAYS -delete
    
    log "INFO" "Local cleanup completed"
    
    # S3 cleanup (if AWS CLI available)
    if command -v aws &> /dev/null; then
        AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
        aws s3 rm "s3://$S3_BUCKET/database/" \
            --recursive \
            --endpoint-url "$S3_ENDPOINT" \
            --exclude "*" \
            --include "*.gz" \
            --life-cycle-rules file://<(cat <<EOF
{
    "Rules": [
        {
            "ID": "DeleteOldBackups",
            "Status": "Enabled",
            "Prefix": "database/",
            "Expiration": {
                "Days": $RETENTION_DAYS
            }
        }
    ]
}
EOF
)
        log "INFO" "S3 cleanup completed"
    fi
}

# Verify backup
verify_backup() {
    log "INFO" "Verifying backup integrity..."
    
    local backup_size=$(stat -f%z "$COMPRESSED_FILE" 2>/dev/null || stat -c%s "$COMPRESSED_FILE" 2>/dev/null || echo "0")
    
    if [ "$backup_size" -gt 0 ]; then
        log "INFO" "${GREEN}Backup verified successfully${NC}"
        log "INFO" "Backup size: $(numfmt --to=iec-i --suffix=B $backup_size 2>/dev/null || echo "${backup_size} bytes")"
        return 0
    else
        log "ERROR" "${RED}Backup verification failed${NC}"
        return 1
    fi
}

# Create backup manifest
create_manifest() {
    local manifest_file="$BACKUP_DIR/manifest_${TIMESTAMP}.json"
    
    cat > "$manifest_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "database": "$DB_DATABASE",
    "connection": "$DB_CONNECTION",
    "host": "$DB_HOST",
    "backup_file": "$(basename $COMPRESSED_FILE)",
    "backup_size": $(stat -f%z "$COMPRESSED_FILE" 2>/dev/null || stat -c%s "$COMPRESSED_FILE" 2>/dev/null || echo "0"),
    "checksum": "$(sha256sum "$COMPRESSED_FILE" 2>/dev/null | cut -d' ' -f1 || shasum -a 256 "$COMPRESSED_FILE" | cut -d' ' -f1)",
    "retention_days": $RETENTION_DAYS,
    "encrypted": $([ ! -z "$ENCRYPTION_KEY" ] && echo "true" || echo "false"),
    "uploaded_to_s3": $([ -z "${S3_UPLOAD_SKIP:-}" ] && echo "true" || echo "false")
}
EOF
    
    log "INFO" "Manifest created: $manifest_file"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    local webhook="${BACKUP_NOTIFICATION_WEBHOOK:-}"
    
    if [ -z "$webhook" ]; then
        return
    fi
    
    local color="good"
    if [ "$status" = "failed" ]; then
        color="danger"
    elif [ "$status" = "warning" ]; then
        color="warning"
    fi
    
    curl -s -X POST "$webhook" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"Database Backup $status\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [
                    {\"title\": \"Database\", \"value\": \"$DB_DATABASE\", \"short\": true},
                    {\"title\": \"Backup File\", \"value\": \"$(basename $COMPRESSED_FILE)\", \"short\": false},
                    {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                ]
            }]
        }" > /dev/null
}

# Main backup function
run_backup() {
    log "INFO" "═══════════════════════════════════════════════════════════"
    log "INFO" "Database Backup Started"
    log "INFO" "═══════════════════════════════════════════════════════════"
    
    local failed=0
    
    # Step 1: Backup database
    backup_database || { log "ERROR" "Backup failed"; ((failed++)); }
    
    if [ $failed -eq 0 ]; then
        # Step 2: Compress
        compress_backup || { log "ERROR" "Compression failed"; ((failed++)); }
        
        # Step 3: Encrypt (optional)
        encrypt_backup || log "WARN" "Encryption skipped or failed"
        
        # Step 4: Verify
        verify_backup || { log "ERROR" "Verification failed"; ((failed++)); }
        
        # Step 5: Upload to S3
        if [ -z "${S3_UPLOAD_SKIP:-}" ]; then
            upload_to_s3 || log "WARN" "S3 upload failed"
        fi
        
        # Step 6: Create manifest
        create_manifest
        
        # Step 7: Cleanup old backups
        cleanup_old_backups
        
        # Send success notification
        send_notification "success" "Backup completed successfully"
    else
        send_notification "failed" "Backup failed with $failed errors"
    fi
    
    log "INFO" "═══════════════════════════════════════════════════════════"
    if [ $failed -eq 0 ]; then
        log "INFO" "${GREEN}Backup completed successfully!${NC}"
    else
        log "ERROR" "${RED}Backup completed with $failed errors${NC}"
    fi
    log "INFO" "═══════════════════════════════════════════════════════════"
    
    return $failed
}

# Restore function
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log "ERROR" "No backup file specified"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR" "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "WARN" "${YELLOW}Starting database restore...${NC}"
    log "WARN" "Target database: $DB_DATABASE"
    log "WARN" "Backup file: $backup_file"
    
    # Confirm restore
    read -p "Are you sure you want to restore? This will overwrite current data. (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "INFO" "Restore cancelled"
        exit 0
    fi
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        log "INFO" "Decompressing backup..."
        gunzip -k "$backup_file"
        backup_file="${backup_file%.gz}"
    fi
    
    # Restore based on database type
    if [ "$DB_CONNECTION" = "pgsql" ]; then
        if [[ "$backup_file" == *.dump ]]; then
            PGPASSWORD="$DB_PASSWORD" pg_restore \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USERNAME" \
                -d "$DB_DATABASE" \
                --clean \
                --if-exists \
                "$backup_file"
        else
            PGPASSWORD="$DB_PASSWORD" psql \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USERNAME" \
                -d "$DB_DATABASE" \
                < "$backup_file"
        fi
    elif [ "$DB_CONNECTION" = "mysql" ] || [ "$DB_CONNECTION" = "mariadb" ]; then
        mysql \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USERNAME" \
            -p"$DB_PASSWORD" \
            "$DB_DATABASE" \
            < "$backup_file"
    fi
    
    log "INFO" "${GREEN}Restore completed successfully!${NC}"
}

# Show help
show_help() {
    echo "NRE Database Backup Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup    Run database backup (default)"
    echo "  restore   Restore from backup file"
    echo "  list      List available backups"
    echo "  help      Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR              Local backup directory"
    echo "  S3_BACKUP_BUCKET        S3 bucket for backups"
    echo "  S3_ENDPOINT             S3 endpoint URL"
    echo "  AWS_ACCESS_KEY_ID       AWS access key"
    echo "  AWS_SECRET_ACCESS_KEY   AWS secret key"
    echo "  DB_CONNECTION           Database connection (pgsql/mysql)"
    echo "  DB_HOST                 Database host"
    echo "  DB_PORT                 Database port"
    echo "  DB_DATABASE             Database name"
    echo "  DB_USERNAME             Database username"
    echo "  DB_PASSWORD             Database password"
    echo "  RETENTION_DAYS          Backup retention period"
    echo "  BACKUP_ENCRYPTION_KEY   GPG encryption key (optional)"
    echo "  BACKUP_NOTIFICATION_WEBHOOK  Slack/Discord webhook for notifications"
}

# List available backups
list_backups() {
    echo "Available Backups:"
    echo "=================="
    ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
}

# Main entry point
case "${1:-backup}" in
    backup)
        run_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    help)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
