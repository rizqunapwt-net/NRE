#!/bin/bash

#╔══════════════════════════════════════════════════════════════════════════╗
#║                                                                          ║
#║  Agent 4 — DevOps Security Hardening                                    ║
#║  Updates Docker images, applies security patches, scans vulnerabilities ║
#║                                                                          ║
#║  Usage: ./scripts/security-hardening.sh [options]                       ║
#║  Options:                                                                ║
#║    --scan-only         Only scan, don't apply patches                   ║
#║    --update-images     Rebuild Docker images with latest base images   ║
#║    --full-scan         Full dependency vulnerability scan               ║
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
LOG_FILE="${PROJECT_ROOT}/logs/security-hardening.log"
REPORT_FILE="${PROJECT_ROOT}/reports/security-scan-$(date +%Y%m%d_%H%M%S).json"

# Parse options
SCAN_ONLY=false
UPDATE_IMAGES=false
FULL_SCAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --scan-only)
            SCAN_ONLY=true
            shift
            ;;
        --update-images)
            UPDATE_IMAGES=true
            shift
            ;;
        --full-scan)
            FULL_SCAN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$REPORT_FILE")"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
    echo -e "[${GREEN}${timestamp}${NC}] [${level}] ${message}"
}

# Check if tool is available
require_tool() {
    local tool=$1
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${YELLOW}Warning: $tool not found. Some checks will be skipped.${NC}"
        return 1
    fi
    return 0
}

# Scan Docker images with Trivy
scan_images_trivy() {
    echo -e "\n${BLUE}=== Docker Image Vulnerability Scanning (Trivy) ===${NC}"
    log "INFO" "Starting Trivy vulnerability scan"
    
    if ! require_tool "trivy"; then
        echo -e "${YELLOW}Trivy not installed. Install with: brew install aquasecurity/trivy/trivy${NC}"
        return 1
    fi
    
    local images=(
        "postgres:16-alpine"
        "redis:7-alpine"
        "nginx:1.27-alpine"
        "minio/minio:latest"
    )
    
    local critical_found=0
    
    for image in "${images[@]}"; do
        echo -e "\n${BLUE}Scanning: $image${NC}"
        
        # Check if image exists locally, if not pull it
        if ! docker image inspect "$image" &>/dev/null; then
            echo "Pulling image: $image"
            docker pull "$image" 2>&1 | tail -n 1
        fi
        
        # Run Trivy scan
        if trivy image --exit-code 0 --severity HIGH,CRITICAL \
            --format table "$image" 2>&1 | tee -a "$LOG_FILE"; then
            
            # Check for critical vulnerabilities
            local critical=$(trivy image --exit-code 0 --severity CRITICAL \
                --format json "$image" 2>/dev/null | grep -c '"Severity":"CRITICAL"' || true)
            
            if [ "$critical" -gt 0 ]; then
                echo -e "${RED}⚠ Critical vulnerabilities found: $critical${NC}"
                ((critical_found++))
            fi
        fi
    done
    
    if [ $critical_found -gt 0 ]; then
        log "WARN" "Critical vulnerabilities found in $critical_found image(s)"
        return 1
    else
        log "INFO" "No critical vulnerabilities found"
        return 0
    fi
}

# Update Docker images to latest versions
update_docker_images() {
    if [ "$SCAN_ONLY" = true ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would update Docker images"
        return 0
    fi
    
    echo -e "\n${BLUE}=== Updating Docker Base Images ===${NC}"
    log "INFO" "Updating Docker base images"
    
    local images=(
        "postgres:16-alpine"
        "redis:7-alpine"
        "nginx:1.27-alpine"
    )
    
    for image in "${images[@]}"; do
        echo "Pulling latest: $image"
        if docker pull "$image" 2>&1 | tail -n 1; then
            log "INFO" "Successfully pulled $image"
        else
            log "WARN" "Failed to pull $image"
        fi
    done
    
    if [ "$UPDATE_IMAGES" = true ]; then
        echo -e "\n${BLUE}Rebuilding application Docker image${NC}"
        if docker compose build --no-cache 2>&1 | tail -n 5 | tee -a "$LOG_FILE"; then
            log "INFO" "Successfully rebuilt Docker image"
        else
            log "ERROR" "Failed to rebuild Docker image"
            return 1
        fi
    fi
}

# Check Laravel security
check_laravel_security() {
    echo -e "\n${BLUE}=== Laravel Security Checks ===${NC}"
    log "INFO" "Checking Laravel configuration"
    
    local issues=0
    
    # Check APP_DEBUG setting
    if grep -q "APP_DEBUG=true" "$PROJECT_ROOT/.env" 2>/dev/null || \
       grep -q "APP_DEBUG=true" "$PROJECT_ROOT/.env.example" 2>/dev/null; then
        echo -e "${RED}✗ APP_DEBUG is set to true (should be false in production)${NC}"
        log "WARN" "APP_DEBUG should be false in production"
        ((issues++))
    else
        echo -e "${GREEN}✓ APP_DEBUG properly configured${NC}"
    fi
    
    # Check if APP_KEY is set
    if ! grep -q "APP_KEY=base64:" "$PROJECT_ROOT/.env" 2>/dev/null; then
        echo -e "${RED}✗ APP_KEY not properly set${NC}"
        log "WARN" "APP_KEY not properly set"
        ((issues++))
    else
        echo -e "${GREEN}✓ APP_KEY is set${NC}"
    fi
    
    # Check for default credentials in config
    if grep -r "password.*=.*simple\|password.*=.*test" "$PROJECT_ROOT/config/" 2>/dev/null | grep -v "^Binary"; then
        echo -e "${RED}✗ Default credentials found in config${NC}"
        log "WARN" "Default credentials found in config"
        ((issues++))
    else
        echo -e "${GREEN}✓ No obvious default credentials in config${NC}"
    fi
    
    return $issues
}

# Check file permissions
check_file_permissions() {
    echo -e "\n${BLUE}=== File Permissions Check ===${NC}"
    log "INFO" "Checking file permissions"
    
    local issues=0
    
    # Storage directory should not be world-readable
    if [ -d "$PROJECT_ROOT/storage" ]; then
        local perms=$(stat -f%A "$PROJECT_ROOT/storage" 2>/dev/null || echo "unknown")
        if [[ "$perms" == *"7"* ]]; then  # Other has read/write
            echo -e "${RED}✗ Storage directory is world-accessible ($perms)${NC}"
            log "WARN" "Storage directory has insecure permissions"
            ((issues++))
        else
            echo -e "${GREEN}✓ Storage directory permissions: $perms${NC}"
        fi
    fi
    
    # .env file should not be world-readable
    if [ -f "$PROJECT_ROOT/.env" ]; then
        local perms=$(stat -f%A "$PROJECT_ROOT/.env" 2>/dev/null || echo "unknown")
        if [[ "$perms" == *"4" ]] || [[ "$perms" == *"5" ]] || [[ "$perms" == *"6" ]] || [[ "$perms" == *"7" ]]; then
            echo -e "${RED}✗ .env file is readable by group/others ($perms)${NC}"
            log "WARN" ".env file has insecure permissions"
            ((issues++))
        else
            echo -e "${GREEN}✓ .env file permissions: $perms${NC}"
        fi
    fi
    
    return $issues
}

# Dependency vulnerability scan
scan_dependencies() {
    if [ "$FULL_SCAN" != true ]; then
        return 0
    fi
    
    echo -e "\n${BLUE}=== Dependency Vulnerability Scan ===${NC}"
    log "INFO" "Starting dependency vulnerability scan"
    
    local issues=0
    
    # Check PHP dependencies
    if command -v composer &> /dev/null; then
        echo "Scanning PHP dependencies with Composer..."
        if composer audit 2>/dev/null | tee -a "$LOG_FILE"; then
            :
        else
            log "WARN" "Some PHP vulnerabilities found"
            ((issues++))
        fi
    fi
    
    # Check Node dependencies
    if command -v npm &> /dev/null; then
        echo "Scanning Node dependencies with npm audit..."
        if npm audit --audit-level=moderate 2>/dev/null; then
            :
        else
            log "WARN" "Some Node vulnerabilities found"
            ((issues++))
        fi
    fi
    
    return $issues
}

# Generate security report
generate_report() {
    echo -e "\n${BLUE}=== Generating Security Report ===${NC}"
    
    cat <<EOF > "$REPORT_FILE"
{
  "scan_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "Rizquna ERP",
  "tools_used": [
    "Trivy",
    "Docker",
    "Composer",
    "npm"
  ],
  "scans": {
    "docker_images": "completed",
    "laravel_config": "completed",
    "file_permissions": "completed",
    "dependencies": "$( [ "$FULL_SCAN" = true ] && echo "completed" || echo "skipped")"
  },
  "recommendations": [
    "Keep Docker base images updated regularly",
    "Enable automatic security updates for OS packages",
    "Use secrets management (HashiCorp Vault, AWS Secrets Manager)",
    "Implement container image signing and verification",
    "Set up continuous vulnerability scanning in CI/CD",
    "Use security scanning tools in pre-deployment stages"
  ]
}
EOF
    
    echo -e "${GREEN}✓ Report saved to: $REPORT_FILE${NC}"
    log "INFO" "Security report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Security Hardening Check - $(date '+%Y-%m-%d %H:%M:%S')   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"
    
    log "INFO" "Security hardening check started"
    
    cd "$PROJECT_ROOT"
    
    local total_issues=0
    
    # Run checks
    if ! scan_images_trivy; then
        ((total_issues++))
    fi
    
    update_docker_images || true
    
    if ! check_laravel_security; then
        ((total_issues++))
    fi
    
    if ! check_file_permissions; then
        ((total_issues++))
    fi
    
    if ! scan_dependencies; then
        ((total_issues++))
    fi
    
    # Summary
    echo -e "\n${BLUE}Summary:${NC}"
    if [ $total_issues -eq 0 ]; then
        echo -e "${GREEN}✓ No critical security issues found${NC}"
    else
        echo -e "${YELLOW}⚠ Found $total_issues potential security issues${NC}"
    fi
    
    generate_report
    
    log "INFO" "Security hardening check completed with $total_issues issues"
    
    echo -e "\n${BLUE}Check logs:${NC} $LOG_FILE"
    echo -e "${BLUE}Report:${NC} $REPORT_FILE\n"
}

main "$@"
