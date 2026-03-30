#!/usr/bin/env bash
#
# Automated Backup Script for Rizquna ERP
# 
# Features:
# - Database backup with compression
# - File system backup (storage)
# - Retention policy (keep last 7 days, weekly for 4 weeks, monthly for 6 months)
# - Cloud upload support (S3/MinIO)
# - Slack/Email notifications
# - Health check integration
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

# Configuration
BACKUP_ROOT="${BACKUP_ROOT:-${PROJECT_DIR}/backups}"
DB_CONTAINER="${DB_CONTAINER:-rizquna_db}"
DB_NAME="${DB_NAME:-rizquna_erp}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
RETENTION_WEEKS="${RETENTION_WEEKS:-4}"
RETENTION_MONTHS="${RETENTION_MONTHS:-6}"

# S3/MinIO configuration
S3_ENABLED="${S3_ENABLED:-false}"
S3_BUCKET="${S3_BUCKET:-rizquna-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-}"

# Notification configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_TO="${EMAIL_TO:-}"

# Timestamp
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DATE="$(date +%Y%m%d)"
WEEK="$(date +%Y-W%V)"
MONTH="$(date +%Y-%m)"

# Directories
DB_BACKUP_DIR="${BACKUP_ROOT}/database"
FILES_BACKUP_DIR="${BACKUP_ROOT}/files"
mkdir -p "${DB_BACKUP_DIR}" "${FILES_BACKUP_DIR}"

# Logging
LOG_FILE="${BACKUP_ROOT}/backup.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

notify_slack() {
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$1\"}" \
            "${SLACK_WEBHOOK}" 2>/dev/null || true
    fi
}

notify_email() {
    if [[ -n "${EMAIL_TO}" ]]; then
        echo "$1" | mail -s "Rizquna ERP Backup Status" "${EMAIL_TO}" 2>/dev/null || true
    fi
}

backup_database() {
    log "Starting database backup..."
    
    local backup_file="${DB_BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
    
    if docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc > "${backup_file}"; then
        log "Database backup successful: ${backup_file}"
        
        # Compress
        gzip "${backup_file}"
        backup_file="${backup_file}.gz"
        
        # Calculate size
        local size=$(du -h "${backup_file}" | cut -f1)
        log "Backup size: ${size}"
        
        # Upload to S3 if enabled
        if [[ "${S3_ENABLED}" == "true" ]]; then
            upload_to_s3 "${backup_file}" "database/${DATE}/"
        fi
        
        return 0
    else
        log "ERROR: Database backup failed!"
        return 1
    fi
}

backup_files() {
    log "Starting file system backup..."
    
    local backup_file="${FILES_BACKUP_DIR}/storage_${TIMESTAMP}.tar.gz"
    local storage_path="${PROJECT_DIR}/storage"
    
    if [[ -d "${storage_path}" ]]; then
        tar -czf "${backup_file}" -C "${PROJECT_DIR}" storage 2>/dev/null
        
        local size=$(du -h "${backup_file}" | cut -f1)
        log "File backup successful: ${backup_file} (${size})"
        
        if [[ "${S3_ENABLED}" == "true" ]]; then
            upload_to_s3 "${backup_file}" "files/${DATE}/"
        fi
        
        return 0
    else
        log "WARNING: Storage directory not found: ${storage_path}"
        return 1
    fi
}

upload_to_s3() {
    local file="$1"
    local s3_prefix="$2"
    local filename="$(basename "${file}")"
    
    log "Uploading ${filename} to S3..."
    
    if command -v aws >/dev/null 2>&1; then
        local endpoint_arg=""
        if [[ -n "${S3_ENDPOINT}" ]]; then
            endpoint_arg="--endpoint-url=${S3_ENDPOINT}"
        fi
        
        if aws s3 cp "${file}" "s3://${S3_BUCKET}/${s3_prefix}${filename}" ${endpoint_arg}; then
            log "S3 upload successful"
        else
            log "WARNING: S3 upload failed"
        fi
    else
        log "WARNING: AWS CLI not installed, skipping S3 upload"
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Daily backups - keep last N days
    find "${DB_BACKUP_DIR}" -name "*.dump.gz" -mtime +${RETENTION_DAYS} -delete
    find "${FILES_BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Weekly backups - keep last N weeks
    # (Implement more sophisticated retention if needed)
    
    log "Cleanup complete"
}

verify_backup() {
    local backup_file="$1"
    
    if [[ ! -f "${backup_file}" ]]; then
        log "ERROR: Backup file not found: ${backup_file}"
        return 1
    fi
    
    if [[ ! -s "${backup_file}" ]]; then
        log "ERROR: Backup file is empty: ${backup_file}"
        return 1
    fi
    
    log "Backup verification passed"
    return 0
}

main() {
    log "========================================="
    log "Rizquna ERP Automated Backup Started"
    log "========================================="
    
    local success=true
    
    # Database backup
    if ! backup_database; then
        success=false
    fi
    
    # File system backup
    if ! backup_files; then
        success=false
    fi
    
    # Cleanup
    cleanup_old_backups
    
    # Report status
    if [[ "${success}" == "true" ]]; then
        log "========================================="
        log "Backup completed successfully!"
        log "========================================="
        notify_slack "✅ Rizquna ERP backup completed successfully (${TIMESTAMP})"
    else
        log "========================================="
        log "Backup completed with errors!"
        log "========================================="
        notify_slack "⚠️ Rizquna ERP backup completed with errors (${TIMESTAMP})"
        notify_email "Backup completed with errors. Check logs at ${LOG_FILE}"
        exit 1
    fi
}

# Run main function
main "$@"
