#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# Uptime & Performance Monitoring Script
# Monitor API health, response time, and send alerts
# ════════════════════════════════════════════════════════════════════════════

set -e

# Configuration
BASE_URL="${MONITOR_BASE_URL:-http://localhost:9000}"
ALERT_EMAIL="${MONITOR_ALERT_EMAIL:-admin@rizquna.id}"
ALERT_WEBHOOK="${MONITOR_ALERT_WEBHOOK:-}"  # Slack/Discord webhook
LOG_FILE="${MONITOR_LOG_FILE:-/var/log/nre-monitor.log}"
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-2000}"  # ms
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"  # percentage

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Send alert notification
send_alert() {
    local title=$1
    local message=$2
    local severity=$3

    log "ALERT" "[$severity] $title: $message"

    # Send to Slack/Discord webhook if configured
    if [ ! -z "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"🚨 $title\",
                \"attachments\": [{
                    \"color\": \"$( [ \"$severity\" = \"critical\" ] && echo 'danger' || echo 'warning' )\",
                    \"fields\": [
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false},
                        {\"title\": \"Server\", \"value\": \"$(hostname)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" > /dev/null
    fi

    # Send email alert if mail command is available
    if command -v mail &> /dev/null && [ ! -z "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[NRE Monitor] $title" "$ALERT_EMAIL"
    fi
}

# Check endpoint health
check_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}

    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [ "$response" = "$expected_status" ]; then
        if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
            log "WARN" "${YELLOW}⚠️${NC} $name - Status: $response, Response Time: ${response_time}ms (SLOW)"
            send_alert "Slow Response: $name" "Response time ${response_time}ms exceeds threshold ${RESPONSE_TIME_THRESHOLD}ms" "warning"
            return 1
        else
            log "INFO" "${GREEN}✅${NC} $name - Status: $response, Response Time: ${response_time}ms"
            return 0
        fi
    else
        log "ERROR" "${RED}❌${NC} $name - Status: $response (Expected: $expected_status)"
        send_alert "Endpoint Failed: $name" "Expected status $expected_status, got $response" "critical"
        return 1
    fi
}

# Check database connection
check_database() {
    local result=$(cd /var/www/html && php artisan db:show 2>&1 | grep -c "Connection" || echo "0")
    
    if [ "$result" -gt 0 ]; then
        log "INFO" "${GREEN}✅${NC} Database - Connected"
        return 0
    else
        log "ERROR" "${RED}❌${NC} Database - Connection Failed"
        send_alert "Database Connection Failed" "Cannot connect to database" "critical"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local threshold=${1:-80}
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        log "WARN" "${YELLOW}⚠️${NC} Disk Space - ${usage}% used (threshold: ${threshold}%)"
        send_alert "High Disk Usage" "Disk usage is ${usage}%, exceeds threshold ${threshold}%" "warning"
        return 1
    else
        log "INFO" "${GREEN}✅${NC} Disk Space - ${usage}% used"
        return 0
    fi
}

# Check memory usage
check_memory() {
    local threshold=${1:-90}
    local usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -gt "$threshold" ]; then
        log "WARN" "${YELLOW}⚠️${NC} Memory - ${usage}% used (threshold: ${threshold}%)"
        send_alert "High Memory Usage" "Memory usage is ${usage}%, exceeds threshold ${threshold}%" "warning"
        return 1
    else
        log "INFO" "${GREEN}✅${NC} Memory - ${usage}% used"
        return 0
    fi
}

# Check Horizon queue status
check_horizon() {
    local result=$(cd /var/www/html && php artisan horizon:status 2>&1 | grep -c "running" || echo "0")
    
    if [ "$result" -gt 0 ]; then
        log "INFO" "${GREEN}✅${NC} Horizon - Running"
        return 0
    else
        log "ERROR" "${RED}❌${NC} Horizon - Not Running"
        send_alert "Horizon Not Running" "Laravel Horizon queue worker is not running" "critical"
        return 1
    fi
}

# Check failed jobs count
check_failed_jobs() {
    local threshold=${1:-10}
    local count=$(cd /var/www/html && php artisan queue:failed 2>&1 | grep -c "FAILED" || echo "0")
    
    if [ "$count" -gt "$threshold" ]; then
        log "WARN" "${YELLOW}⚠️${NC} Failed Jobs - ${count} jobs failed (threshold: ${threshold})"
        send_alert "High Failed Jobs Count" "${count} failed jobs in queue, exceeds threshold ${threshold}" "warning"
        return 1
    else
        log "INFO" "${GREEN}✅${NC} Failed Jobs - ${count} jobs"
        return 0
    fi
}

# Generate monitoring report
generate_report() {
    local report_file="/tmp/nre-monitor-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "server": "$(hostname)",
    "checks": {
        "disk_usage": "$(df -h / | awk 'NR==2 {print $5}')",
        "memory_usage": "$(free | awk 'NR==2 {printf "%.0f%%", $3*100/$2}')",
        "cpu_load": "$(uptime | awk -F'load average:' '{print $2}' | xargs)"
    },
    "endpoints": {
        "api_health": "$BASE_URL/api/v1/public/stats",
        "web_health": "$BASE_URL/"
    }
}
EOF
    
    log "INFO" "Report generated: $report_file"
    echo "$report_file"
}

# Main monitoring function
run_monitoring() {
    log "INFO" "═══════════════════════════════════════════════════════════"
    log "INFO" "Starting monitoring checks..."
    log "INFO" "═══════════════════════════════════════════════════════════"

    local failed=0

    # System checks
    check_disk_space 80 || ((failed++))
    check_memory 90 || ((failed++))

    # Application checks
    check_endpoint "Homepage" "/" 200 || ((failed++))
    check_endpoint "API Stats" "/api/v1/public/stats" 200 || ((failed++))
    check_endpoint "API Catalog" "/api/v1/public/catalog" 200 || ((failed++))
    check_endpoint "Login Page" "/login" 200 || ((failed++))

    # Database check (only if on server)
    if [ -f "/var/www/html/artisan" ]; then
        check_database || ((failed++))
        check_horizon || ((failed++))
        check_failed_jobs 10 || ((failed++))
    fi

    # Generate report
    generate_report

    log "INFO" "═══════════════════════════════════════════════════════════"
    if [ $failed -eq 0 ]; then
        log "INFO" "${GREEN}All checks passed!${NC}"
    else
        log "WARN" "${YELLOW}$failed check(s) failed${NC}"
    fi
    log "INFO" "═══════════════════════════════════════════════════════════"

    return $failed
}

# Show help
show_help() {
    echo "NRE Production Monitoring Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  run       Run all monitoring checks (default)"
    echo "  report    Generate monitoring report"
    echo "  help      Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  MONITOR_BASE_URL         Base URL to monitor (default: http://localhost:9000)"
    echo "  MONITOR_ALERT_EMAIL      Email for alerts"
    echo "  MONITOR_ALERT_WEBHOOK    Slack/Discord webhook URL"
    echo "  MONITOR_LOG_FILE         Log file path"
    echo "  RESPONSE_TIME_THRESHOLD  Response time threshold in ms (default: 2000)"
    echo "  ERROR_RATE_THRESHOLD     Error rate threshold percentage (default: 5)"
}

# Main entry point
case "${1:-run}" in
    run)
        run_monitoring
        ;;
    report)
        generate_report
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
