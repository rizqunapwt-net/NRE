#!/bin/bash

#╔══════════════════════════════════════════════════════════════════════════╗
#║                                                                          ║
#║  Agent 4 — DevOps Auto-Recovery & Container Health Management           ║
#║  Monitors container health and automatically restarts unhealthy ones    ║
#║                                                                          ║
#║  Usage: ./scripts/auto-recovery.sh [options]                            ║
#║  Options:                                                                ║
#║    --check-only        Only check, don't restart                        ║
#║    --verbose           Verbose output                                   ║
#║    --timeout=SECONDS   Timeout for health checks (default: 10)          ║
#║                                                                          ║
#╚══════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINERS=("rizquna_app" "rizquna_web" "rizquna_db" "rizquna_redis" "rizquna_minio")
HEALTH_ENDPOINT="http://localhost:9000/api/v1/health"
READINESS_ENDPOINT="http://localhost:9000/api/v1/ready"
LOG_FILE="${PROJECT_ROOT}/logs/auto-recovery.log"
RECOVERY_LOCK_FILE="/tmp/auto-recovery.lock"
MAX_RESTART_COUNT=3
RESTART_WINDOW=3600  # 1 hour

# Parse options
CHECK_ONLY=false
VERBOSE=false
TIMEOUT=10

while [[ $# -gt 0 ]]; do
    case $1 in
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --timeout=*)
            TIMEOUT="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
    
    if [ "$VERBOSE" = true ]; then
        echo -e "[${GREEN}${timestamp}${NC}] [${level}] ${message}"
    fi
}

# Get container status
get_container_status() {
    local container=$1
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            echo "running"
        else
            echo "stopped"
        fi
    else
        echo "not_found"
    fi
}

# Check health endpoint
check_health() {
    local timeout=$1
    local endpoint=$2
    
    local response=$(curl -s -w "\n%{http_code}" --connect-timeout "$timeout" \
        --max-time "$timeout" "$endpoint" 2>/dev/null || echo "000")
    
    local status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Track restart attempts to prevent restart loops
track_restart() {
    local container=$1
    local restart_file="/tmp/restart_count_${container}"
    
    if [ -f "$restart_file" ]; then
        local count=$(cat "$restart_file")
        local timestamp=$(stat -f%m "$restart_file" 2>/dev/null || echo 0)
        local now=$(date +%s)
        
        if [ $((now - timestamp)) -gt $RESTART_WINDOW ]; then
            # Window expired, reset counter
            echo 1 > "$restart_file"
            return 0
        fi
        
        if [ "$count" -ge "$MAX_RESTART_COUNT" ]; then
            return 1  # Too many restarts in window
        fi
        
        echo $((count + 1)) > "$restart_file"
        return 0
    else
        echo 1 > "$restart_file"
        return 0
    fi
}

# Restart container
restart_container() {
    local container=$1
    
    if track_restart "$container"; then
        log "INFO" "Attempting to restart container: $container"
        
        if [ "$CHECK_ONLY" = false ]; then
            if docker restart "$container" 2>&1 | tee -a "$LOG_FILE" > /dev/null; then
                log "INFO" "✓ Container $container restarted successfully"
                echo -e "${GREEN}✓${NC} Restarted: $container"
                return 0
            else
                log "ERROR" "✗ Failed to restart container: $container"
                echo -e "${RED}✗${NC} Failed to restart: $container"
                return 1
            fi
        else
            log "INFO" "[DRY RUN] Would restart: $container"
            echo -e "${YELLOW}[DRY RUN]${NC} Would restart: $container"
            return 0
        fi
    else
        log "ERROR" "Too many restart attempts for $container in last hour"
        echo -e "${RED}✗${NC} Too many restarts: $container (cooldown)"
        return 1
    fi
}

# Check individual container
check_container() {
    local container=$1
    local status=$(get_container_status "$container")
    
    echo -e "\n${BLUE}Checking${NC} $container..."
    
    case $status in
        running)
            echo "  Status: ${GREEN}running${NC}"
            
            # Special health checks for app container
            if [ "$container" = "rizquna_app" ]; then
                if check_health "$TIMEOUT" "$HEALTH_ENDPOINT"; then
                    echo "  Health: ${GREEN}✓ healthy${NC}"
                    log "INFO" "Container $container is healthy"
                    return 0
                else
                    echo "  Health: ${RED}✗ unhealthy${NC}"
                    log "WARN" "Container $container failed health check"
                    restart_container "$container"
                    return $?
                fi
            
            # Check web container
            elif [ "$container" = "rizquna_web" ]; then
                if check_health "$TIMEOUT" "http://localhost/api/v1/health"; then
                    echo "  Health: ${GREEN}✓ healthy${NC}"
                    log "INFO" "Container $container is healthy"
                    return 0
                else
                    echo "  Health: ${RED}✗ unhealthy${NC}"
                    log "WARN" "Container $container failed health check"
                    restart_container "$container"
                    return $?
                fi
            else
                # Other containers rely on Docker health check
                local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
                
                if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                    echo "  Health: ${GREEN}✓${NC} $health"
                    log "INFO" "Container $container health: $health"
                    return 0
                else
                    echo "  Health: ${RED}✗${NC} $health"
                    log "WARN" "Container $container is not healthy: $health"
                    restart_container "$container"
                    return $?
                fi
            fi
            ;;
        stopped)
            echo "  Status: ${YELLOW}stopped${NC}"
            log "WARN" "Container $container is stopped"
            restart_container "$container"
            return $?
            ;;
        not_found)
            echo "  Status: ${RED}not found${NC}"
            log "ERROR" "Container $container not found"
            return 1
            ;;
    esac
}

# Check all containers
check_all_containers() {
    local failed=0
    local passed=0
    
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Container Health Check - $(date '+%Y-%m-%d %H:%M:%S')        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    
    for container in "${CONTAINERS[@]}"; do
        if check_container "$container"; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    # Summary
    echo -e "\n${BLUE}Summary:${NC}"
    echo -e "  ${GREEN}✓ Healthy:${NC} $passed"
    echo -e "  ${RED}✗ Failed:${NC} $failed"
    
    log "INFO" "Health check completed - Healthy: $passed, Failed: $failed"
    
    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}✓ All containers healthy!${NC}"
        return 0
    else
        echo -e "\n${RED}✗ Some containers need attention${NC}"
        return 1
    fi
}

# Get container metrics
show_metrics() {
    echo -e "\n${BLUE}Container Metrics:${NC}"
    
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | head -n 6
}

# Main execution
main() {
    log "INFO" "Auto-recovery check started (mode: $([ "$CHECK_ONLY" = true ] && echo "dry-run" || echo "live"))"
    
    if [ ! -d "$PROJECT_ROOT" ]; then
        echo -e "${RED}Error: Project root not found: $PROJECT_ROOT${NC}"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    check_all_containers
    local result=$?
    
    if [ "$CHECK_ONLY" = false ]; then
        show_metrics
    fi
    
    exit $result
}

# Handle interrupts gracefully
trap 'log "INFO" "Auto-recovery check interrupted"; exit 130' INT TERM

main "$@"
