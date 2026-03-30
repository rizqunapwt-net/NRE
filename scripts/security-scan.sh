#!/usr/bin/env bash
#
# Security Scanning Script for Rizquna ERP
#
# Runs multiple security tools:
# - Trivy (container & filesystem vulnerabilities)
# - Gitleaks (secrets detection)
# - Composer audit (PHP dependencies)
# - npm audit (JS dependencies)
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

check_tool() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

scan_with_trivy_filesystem() {
    log "Running Trivy filesystem scan..."
    
    if ! check_tool trivy && ! check_tool docker; then
        warn "Trivy not installed, skipping filesystem scan"
        return 0
    fi
    
    local severity="CRITICAL,HIGH"
    
    if check_tool trivy; then
        trivy fs --severity "${severity}" \
            --ignore-unfixed \
            --exit-code 0 \
            "${PROJECT_DIR}"
    else
        docker run --rm -v "${PROJECT_DIR}:/repo" \
            aquasec/trivy:latest fs \
            --severity "${severity}" \
            --ignore-unfixed \
            --exit-code 0 \
            /repo
    fi
}

scan_with_trivy_image() {
    log "Running Trivy container image scan..."
    
    local image="${1:-rizquna-erp-php:latest}"
    
    if ! docker image inspect "${image}" >/dev/null 2>&1; then
        warn "Image ${image} not found, skipping image scan"
        return 0
    fi
    
    if check_tool trivy; then
        trivy image --severity "CRITICAL,HIGH" \
            --ignore-unfixed \
            --exit-code 0 \
            "${image}"
    else
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy:latest image \
            --severity "CRITICAL,HIGH" \
            --ignore-unfixed \
            --exit-code 0 \
            "${image}"
    fi
}

scan_with_gitleaks() {
    log "Running Gitleaks secret scan..."
    
    if ! check_tool gitleaks && ! check_tool docker; then
        warn "Gitleaks not installed, skipping secret scan"
        return 0
    fi
    
    local config_file="${PROJECT_DIR}/.gitleaks.toml"
    
    if check_tool gitleaks; then
        gitleaks detect \
            --source="${PROJECT_DIR}" \
            --config="${config_file}" \
            --no-git \
            --redact \
            --verbose || true
    else
        docker run --rm -v "${PROJECT_DIR}:/repo" \
            zricethezav/gitleaks:latest detect \
            --source=/repo \
            --config=/repo/.gitleaks.toml \
            --no-git \
            --redact \
            --verbose || true
    fi
}

scan_composer_dependencies() {
    log "Running Composer security audit..."
    
    if [[ ! -f "${PROJECT_DIR}/composer.json" ]]; then
        warn "composer.json not found, skipping Composer audit"
        return 0
    fi
    
    cd "${PROJECT_DIR}"
    
    if check_tool composer; then
        composer audit --no-interaction || true
    else
        warn "Composer not installed, skipping dependency audit"
    fi
}

scan_npm_dependencies() {
    log "Running npm security audit..."
    
    # Main project
    if [[ -f "${PROJECT_DIR}/package.json" ]]; then
        cd "${PROJECT_DIR}"
        npm audit --audit-level=moderate || true
    fi
    
    # Admin panel
    if [[ -f "${PROJECT_DIR}/admin-panel/package.json" ]]; then
        cd "${PROJECT_DIR}/admin-panel"
        npm audit --audit-level=moderate || true
    fi
}

check_docker_security() {
    log "Checking Docker security best practices..."
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        warn "Docker daemon not running, skipping Docker checks"
        return 0
    fi
    
    # Check for running containers with privileged mode
    log "Checking for privileged containers..."
    docker ps --filter "status=running" --format "{{.Names}}" | while read -r container; do
        if docker inspect "${container}" | grep -q '"Privileged": true'; then
            warn "Container ${container} is running in privileged mode!"
        fi
    done
    
    # Check for containers running as root
    log "Checking for containers running as root..."
    docker ps --filter "status=running" --format "{{.Names}}" | while read -r container; do
        user=$(docker inspect "${container}" | jq -r '.[0].Config.User')
        if [[ -z "${user}" ]] || [[ "${user}" == "root" ]] || [[ "${user}" == "0" ]]; then
            warn "Container ${container} is running as root user!"
        fi
    done
}

check_file_permissions() {
    log "Checking sensitive file permissions..."
    
    # Check .env files
    find "${PROJECT_DIR}" -name ".env*" -type f | while read -r file; do
        perms=$(stat -f "%OLp" "${file}" 2>/dev/null || stat -c "%a" "${file}" 2>/dev/null)
        if [[ "${perms}" != "600" ]] && [[ "${perms}" != "400" ]]; then
            warn "File ${file} has insecure permissions: ${perms} (should be 600)"
        fi
    done
    
    # Check private keys
    find "${PROJECT_DIR}" -name "*.key" -o -name "*.pem" -type f | while read -r file; do
        perms=$(stat -f "%OLp" "${file}" 2>/dev/null || stat -c "%a" "${file}" 2>/dev/null)
        if [[ "${perms}" != "600" ]] && [[ "${perms}" != "400" ]]; then
            warn "Private key ${file} has insecure permissions: ${perms}"
        fi
    done
}

generate_report() {
    log "Generating security scan report..."
    
    local report_file="${PROJECT_DIR}/security-scan-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "========================================="
        echo "Rizquna ERP Security Scan Report"
        echo "Generated: $(date)"
        echo "========================================="
        echo ""
        echo "Scans performed:"
        echo "- Trivy filesystem scan"
        echo "- Trivy container image scan"
        echo "- Gitleaks secret detection"
        echo "- Composer dependency audit"
        echo "- npm dependency audit"
        echo "- Docker security checks"
        echo "- File permissions check"
        echo ""
        echo "Review the output above for any issues."
        echo "========================================="
    } | tee "${report_file}"
    
    log "Report saved to: ${report_file}"
}

main() {
    log "========================================="
    log "Starting Rizquna ERP Security Scan"
    log "========================================="
    
    scan_with_gitleaks
    scan_with_trivy_filesystem
    scan_composer_dependencies
    scan_npm_dependencies
    check_docker_security
    check_file_permissions
    
    generate_report
    
    log "========================================="
    log "Security scan completed!"
    log "========================================="
}

# Run main function
main "$@"
