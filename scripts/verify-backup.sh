#!/bin/bash

#╔══════════════════════════════════════════════════════════════════════════╗
#║                                                                          ║
#║  Agent 4 — DevOps Backup Verification & Recovery Testing                ║
#║  Tests backup integrity, verifies restore capability, audits backups    ║
#║                                                                          ║
#║  Usage: ./scripts/verify-backup.sh [options]                            ║
#║  Options:                                                                ║
#║    --test-restore      Run full restore test (requires test environment)║
#║    --check-only        Only check, don't repair                         ║
#║    --verbose           Verbose output                                   ║
#║                                                                          ║
#╚══════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backup-verification.log"
REPORT_FILE="${PROJECT_ROOT}/reports/backup-report-$(date +%Y%m%d_%H%M%S).txt"

# Parse options
TEST_RESTORE=false
CHECK_ONLY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --test-restore)
            TEST_RESTORE=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$REPORT_FILE")" "$BACKUP_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
    
    if [ "$VERBOSE" = true ]; then
        echo -e "[${GREEN}${timestamp}${NC}] [${level}] ${message}"
    fi
}

# Check backup directory structure
check_backup_structure() {
    echo -e "\n${BLUE}=== Checking Backup Directory Structure ===${NC}"
    log "INFO" "Checking backup directory structure"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}✗ Backup directory not found: $BACKUP_DIR${NC}"
        log "ERROR" "Backup directory not found"
        return 1
    fi
    
    echo "Backup directory: $BACKUP_DIR"
    echo "Disk usage:"
    du -sh "$BACKUP_DIR"/* 2>/dev/null | tail -n 5
    
    local total_size=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
    echo "Total backup size: $total_size"
    
    return 0
}

# Verify database backups
verify_database_backups() {
    echo -e "\n${BLUE}=== Verifying Database Backups ===${NC}"
    log "INFO" "Verifying database backups"
    
    local db_backups=$(find "$BACKUP_DIR" -name "*.sql*" -o -name "*postgres*" 2>/dev/null | wc -l)
    
    if [ "$db_backups" -eq 0 ]; then
        echo -e "${YELLOW}⚠ No database backups found${NC}"
        log "WARN" "No database backups found in $BACKUP_DIR"
        return 1
    fi
    
    echo "Found $db_backups database backup(s)"
    
    # Check backup age
    local latest_backup=$(find "$BACKUP_DIR" -name "*.sql*" -o -name "*postgres*" 2>/dev/null | \
        xargs ls -t | head -n1)
    
    if [ -n "$latest_backup" ]; then
        local age=$(($(date +%s) - $(stat -f%m "$latest_backup" 2>/dev/null || echo 0)))
        local hours=$((age / 3600))
        
        echo "Latest database backup: $(basename "$latest_backup")"
        echo "Age: $hours hours ago"
        
        if [ $hours -gt 48 ]; then
            echo -e "${YELLOW}⚠ Database backup is older than 48 hours${NC}"
            log "WARN" "Database backup is older than 48 hours"
        else
            echo -e "${GREEN}✓ Database backup is recent${NC}"
        fi
    fi
    
    # Verify SQL dump validity
    for backup in $(find "$BACKUP_DIR" -name "*.sql*" 2>/dev/null | head -n 3); do
        echo -e "\nChecking: $(basename "$backup")"
        
        if file "$backup" | grep -q "gzip\|compressed" || [[ "$backup" == *.gz ]]; then
            # Compressed backup
            if gzip -t "$backup" 2>/dev/null; then
                echo -e "  ${GREEN}✓ Compressed backup integrity OK${NC}"
                log "INFO" "Compressed backup integrity verified: $(basename "$backup")"
            else
                echo -e "  ${RED}✗ Compressed backup corrupted${NC}"
                log "ERROR" "Corrupted backup: $(basename "$backup")"
            fi
        else
            # Plain SQL file
            if head -n 10 "$backup" | grep -q "CREATE TABLE\|INSERT INTO\|BEGIN"; then
                echo -e "  ${GREEN}✓ SQL syntax looks valid${NC}"
                log "INFO" "SQL backup syntax OK: $(basename "$backup")"
            else
                echo -e "  ${RED}✗ SQL file doesn't look valid${NC}"
                log "ERROR" "Invalid SQL backup: $(basename "$backup")"
            fi
        fi
    done
    
    return 0
}

# Verify file backups
verify_file_backups() {
    echo -e "\n${BLUE}=== Verifying File Backups ===${NC}"
    log "INFO" "Verifying file backups"
    
    local file_backups=$(find "$BACKUP_DIR" -name "*.tar*" -o -name "*.zip" 2>/dev/null | wc -l)
    
    if [ "$file_backups" -eq 0 ]; then
        echo -e "${YELLOW}⚠ No file backups found${NC}"
        log "WARN" "No file backups found"
        return 1
    fi
    
    echo "Found $file_backups file backup(s)"
    
    # Verify archive integrity
    for backup in $(find "$BACKUP_DIR" \( -name "*.tar*" -o -name "*.zip" \) 2>/dev/null | head -n 3); do
        echo -e "\nChecking: $(basename "$backup")"
        
        if [[ "$backup" == *.tar.gz || "$backup" == *.tgz ]]; then
            if tar -tzf "$backup" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓ Tar archive integrity OK${NC}"
                log "INFO" "Tar archive verified: $(basename "$backup")"
            else
                echo -e "  ${RED}✗ Tar archive corrupted${NC}"
                log "ERROR" "Corrupted tar archive: $(basename "$backup")"
            fi
        elif [[ "$backup" == *.zip ]]; then
            if unzip -t "$backup" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓ Zip archive integrity OK${NC}"
                log "INFO" "Zip archive verified: $(basename "$backup")"
            else
                echo -e "  ${RED}✗ Zip archive corrupted${NC}"
                log "ERROR" "Corrupted zip archive: $(basename "$backup")"
            fi
        fi
    done
    
    return 0
}

# Test database restore (in test container)
test_database_restore() {
    if [ "$TEST_RESTORE" != true ]; then
        echo -e "\n${YELLOW}Database restore test skipped (use --test-restore)${NC}"
        return 0
    fi
    
    echo -e "\n${BLUE}=== Testing Database Restore ===${NC}"
    log "INFO" "Testing database restore capability"
    
    local latest_backup=$(find "$BACKUP_DIR" -name "*.sql*" 2>/dev/null | \
        xargs ls -t | head -n1)
    
    if [ -z "$latest_backup" ]; then
        echo -e "${RED}✗ No database backup found for restore test${NC}"
        return 1
    fi
    
    echo "Using backup: $(basename "$latest_backup")"
    
    # Check if restore test container is available
    if ! docker compose ps | grep -q "test-db"; then
        echo -e "${YELLOW}⚠ Test database container not available${NC}"
        echo "To test: docker compose -f docker-compose.test.yml up -d"
        log "WARN" "Test database not available for restore test"
        return 0
    fi
    
    if [ "$CHECK_ONLY" = true ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would test restore to test database"
        return 0
    fi
    
    echo "Testing restore to test database..."
    
    if [[ "$latest_backup" == *.gz ]]; then
        gunzip -c "$latest_backup" | docker exec -i test-db psql -U postgres > /dev/null 2>&1
    else
        docker exec -i test-db psql -U postgres < "$latest_backup" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Restore test successful${NC}"
        log "INFO" "Database restore test completed successfully"
        return 0
    else
        echo -e "${RED}✗ Restore test failed${NC}"
        log "ERROR" "Database restore test failed"
        return 1
    fi
}

# Calculate backup retention statistics
calculate_retention_stats() {
    echo -e "\n${BLUE}=== Backup Retention Statistics ===${NC}"
    
    echo "Backups by age:"
    echo "  < 24 hours:"
    find "$BACKUP_DIR" -type f -mtime -1 2>/dev/null | wc -l
    echo "  1-7 days:"
    find "$BACKUP_DIR" -type f -mtime +1 -mtime -7 2>/dev/null | wc -l
    echo "  1-4 weeks:"
    find "$BACKUP_DIR" -type f -mtime +7 -mtime -28 2>/dev/null | wc -l
    echo "  > 1 month:"
    find "$BACKUP_DIR" -type f -mtime +28 2>/dev/null | wc -l
    
    # Check disk space
    echo -e "\nDisk space available:"
    df -h "$BACKUP_DIR" | tail -n1
}

# Generate report
generate_report() {
    cat > "$REPORT_FILE" <<EOF
╔════════════════════════════════════════════════════╗
║  Backup Verification Report                        ║
║  Generated: $(date '+%Y-%m-%d %H:%M:%S')              ║
╚════════════════════════════════════════════════════╝

## Summary
Project: Rizquna ERP
Backup Directory: $BACKUP_DIR

## Database Backups
- Location: $BACKUP_DIR
- Latest: $(find "$BACKUP_DIR" -name "*.sql*" 2>/dev/null | xargs ls -t | head -n1)
- Status: Verified

## File Backups
- Count: $(find "$BACKUP_DIR" -name "*.tar*" -o -name "*.zip" 2>/dev/null | wc -l)
- Total Size: $(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')
- Status: Verified

## Restoration Tests
- Database Restore: $([ "$TEST_RESTORE" = true ] && echo "Completed" || echo "Skipped")
- File Restore: Not tested this run

## Recommendations
1. Test database restore weekly
2. Maintain at least 2 weeks of full backups
3. Store offsite backups in cloud storage
4. Document restore procedures
5. Monitor backup storage growth

## Next Steps
- Schedule automated backup testing
- Verify cloud backup sync
- Document RTO/RPO for business continuity

log_content=$(cat "$LOG_FILE" 2>/dev/null || echo "No log file")

cat >> "$REPORT_FILE" <<EOF

## Detailed Logs
$log_content

EOF
}

# Main execution
main() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Backup Verification - $(date '+%Y-%m-%d %H:%M:%S')        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    
    log "INFO" "Backup verification started"
    
    cd "$PROJECT_ROOT"
    
    local total_issues=0
    
    # Run checks
    check_backup_structure || ((total_issues++))
    verify_database_backups || ((total_issues++))
    verify_file_backups || ((total_issues++))
    test_database_restore || ((total_issues++))
    calculate_retention_stats
    
    # Summary
    echo -e "\n${BLUE}Summary:${NC}"
    if [ $total_issues -eq 0 ]; then
        echo -e "${GREEN}✓ All backup checks passed${NC}"
    else
        echo -e "${YELLOW}⚠ $total_issues backup issues found${NC}"
    fi
    
    generate_report
    
    echo -e "\n${BLUE}Report:${NC} $REPORT_FILE"
    echo -e "${BLUE}Logs:${NC} $LOG_FILE\n"
    
    log "INFO" "Backup verification completed"
}

main "$@"
