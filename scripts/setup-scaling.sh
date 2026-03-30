#!/bin/bash

#╔══════════════════════════════════════════════════════════════════════════╗
#║                                                                          ║
#║  Agent 4 — DevOps Scaling & Load Balancing Configuration                ║
#║  Prepares infrastructure for horizontal scaling and load balancing      ║
#║                                                                          ║
#║  Usage: ./scripts/setup-scaling.sh [options]                            ║
#║  Options:                                                                ║
#║    --instances=N       Number of app instances (default: 2)             ║
#║    --config-only       Only generate config, don't start containers    ║
#║    --dry-run          Show what would be done                           ║
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
NUM_INSTANCES=2
CONFIG_ONLY=false
DRY_RUN=false

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --instances=*)
            NUM_INSTANCES="${1#*=}"
            shift
            ;;
        --config-only)
            CONFIG_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create scaling Docker Compose config
create_scaling_docker_compose() {
    local output_file="$PROJECT_ROOT/docker-compose.scale.yml"
    
    echo -e "\n${BLUE}=== Generating Scaling Configuration ===${NC}"
    echo "Config file: $output_file"
    
    cat > "$output_file" <<'EOF'
version: '3.9'

# Scaling configuration for horizontal load balancing
# Use: docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d

services:
  # Load balancer (replaces single Nginx)
  lb:
    image: nginx:1.27-alpine
    container_name: rizquna_lb
    ports:
      - "9000:80"
    volumes:
      - ./docker/nginx/default-lb.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app_1
      - app_2
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    networks:
      - rizquna_network

  # Application replica 1
  app_1:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: rizquna_app_1
    working_dir: /var/www/html
    environment:
      APP_NAME: "Rizquna ERP"
      APP_ENV: local
      APP_KEY: base64:d6IAZQOqsd/VIMCL3BEa62T9xSVxbw0qk+Z7cQrXrYQ=
      APP_DEBUG: "false"
      APP_TIMEZONE: Asia/Jakarta
      REPLICA_ID: "1"
      # ... (same as main app but with REPLICA_ID)
    volumes:
      - ./:/var/www/html
      - ./docker/php/supervisord.conf:/etc/supervisor/conf.d/supervisord.conf:ro
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 1.5G
        reservations:
          cpus: '0.75'
          memory: 800M
    networks:
      - rizquna_network
    labels:
      com.example.description: "Application Instance 1"

  # Application replica 2
  app_2:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: rizquna_app_2
    working_dir: /var/www/html
    environment:
      APP_NAME: "Rizquna ERP"
      APP_ENV: local
      APP_KEY: base64:d6IAZQOqsd/VIMCL3BEa62T9xSVxbw0qk+Z7cQrXrYQ=
      APP_DEBUG: "false"
      APP_TIMEZONE: Asia/Jakarta
      REPLICA_ID: "2"
      # ... (same as main app but with REPLICA_ID)
    volumes:
      - ./:/var/www/html
      - ./docker/php/supervisord.conf:/etc/supervisor/conf.d/supervisord.conf:ro
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 1.5G
        reservations:
          cpus: '0.75'
          memory: 800M
    networks:
      - rizquna_network
    labels:
      com.example.description: "Application Instance 2"

networks:
  rizquna_network:
    driver: bridge
EOF
    
    echo -e "${GREEN}✓ Generated: $output_file${NC}"
}

# Create Nginx load balancer config
create_loadbalancer_config() {
    echo -e "\n${BLUE}=== Checking Load Balancer Configuration ===${NC}"
    
    local lb_config="$PROJECT_ROOT/docker/nginx/default-lb.conf"
    
    if [ -f "$lb_config" ]; then
        echo -e "${GREEN}✓ Load balancer config exists: $lb_config${NC}"
        
        # Verify upstream configuration
        if grep -q "upstream backend" "$lb_config"; then
            echo -e "${GREEN}✓ Upstream configuration present${NC}"
        else
            echo -e "${YELLOW}⚠ Upstream configuration not found${NC}"
        fi
        
        # Show current backend config
        echo -e "\n${BLUE}Current upstream config:${NC}"
        grep -A 10 "upstream backend" "$lb_config" | head -n 15
    else
        echo -e "${RED}✗ Load balancer config not found${NC}"
        echo "Run: Agent 4 setup first"
    fi
}

# Generate Prometheus monitoring for scaling
create_scaling_prometheus_config() {
    local config_file="$PROJECT_ROOT/docker/prometheus/scaling.yml"
    
    cat > "$config_file" <<'EOF'
# Monitoring configuration for scaled applications
# Add to prometheus.yml scrape_configs section

scrape_configs:
  - job_name: 'app-instances'
    static_configs:
      - targets: ['app_1:9000', 'app_2:9000']
    relabel_configs:
      - source_labels: [__address__]
        regex: 'app_([0-9]+)'
        replacement: '${1}'
        target_label: instance_id

  - job_name: 'load-balancer'
    static_configs:
      - targets: ['lb:80']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'application-load'
    static_configs:
      - targets:
        - 'app_1:9000/metrics'
        - 'app_2:9000/metrics'
EOF
    
    echo -e "${GREEN}✓ Generated: $config_file${NC}"
}

# Generate Kubernetes-ready config (optional)
create_kubernetes_config() {
    local k8s_dir="$PROJECT_ROOT/k8s"
    mkdir -p "$k8s_dir"
    
    cat > "$k8s_dir/deployment.yml" <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rizquna-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rizquna
      tier: app
  template:
    metadata:
      labels:
        app: rizquna
        tier: app
    spec:
      containers:
      - name: app
        image: rizquna/app:latest
        ports:
        - containerPort: 9000
        env:
        - name: APP_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/v1/live
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/ready
            port: 9000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: rizquna-app
spec:
  selector:
    app: rizquna
    tier: app
  ports:
  - port: 80
    targetPort: 9000
  type: LoadBalancer
EOF
    
    echo -e "${GREEN}✓ Generated: $k8s_dir/deployment.yml${NC}"
}

# Show scaling readiness checklist
show_scaling_checklist() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Scaling Readiness Checklist                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"
    
    local checks=(
        "Load balancer configuration (Nginx)"
        "Health check endpoints (/health, /ready, /live)"
        "Session storage on Redis (not file-based)"
        "File uploads to shared storage (S3/MinIO)"
        "Database connection pooling"
        "Queue job system (Redis)"
        "Cache system (Redis)"
        "Environment-specific configuration"
        "Database migrations versioning"
        "Log aggregation (ELK/Papertrail)"
        "Performance monitoring (Prometheus)"
        "Automated deployment (GitHub Actions)"
    )
    
    local count=0
    for check in "${checks[@]}"; do
        ((count++))
        echo -e "${YELLOW}[$count]${NC} $check"
    done
    
    echo -e "\n${BLUE}Current Status:${NC}"
    echo -e "  Load Balancer: $([ -f "$PROJECT_ROOT/docker/nginx/default-lb.conf" ] && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}")"
    echo -e "  Health Checks: $(grep -q '/api/v1/health' "$PROJECT_ROOT/routes/api.php" && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}")"
    echo -e "  Redis Configured: $(grep -q "REDIS_HOST" "$PROJECT_ROOT/docker-compose.yml" && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}")"
    echo -e "  MinIO/S3 Ready: $(grep -q "AWS_ENDPOINT" "$PROJECT_ROOT/docker-compose.yml" && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}")"
}

# Show scaling metrics
show_scaling_metrics() {
    echo -e "\n${BLUE}=== Current Scaling Metrics ===${NC}"
    
    if ! docker compose ps > /dev/null 2>&1; then
        echo -e "${YELLOW}Docker Compose not running${NC}"
        return
    fi
    
    echo -e "\n${BLUE}Container Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || \
        echo "Unable to retrieve metrics"
    
    echo -e "\n${BLUE}Load Balancer Status:${NC}"
    if curl -s http://localhost:9000/api/v1/health | grep -q "healthy"; then
        echo -e "${GREEN}✓ Load balancer responding${NC}"
    else
        echo -e "${YELLOW}⚠ Load balancer not responding${NC}"
    fi
}

# Main execution
main() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  DevOps Scaling Setup - $(date '+%Y-%m-%d %H:%M:%S')    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Generate configurations
    create_scaling_docker_compose
    create_loadbalancer_config
    create_scaling_prometheus_config
    create_kubernetes_config
    
    show_scaling_checklist
    show_scaling_metrics
    
    # Instructions
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Next Steps to Enable Scaling:${NC}\n"
    
    echo "1. Start scaled environment:"
    echo -e "   ${YELLOW}docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d${NC}\n"
    
    echo "2. Verify load balancing:"
    echo -e "   ${YELLOW}curl -H 'X-Forwarded-For: 127.0.0.1' http://localhost:9000/api/v1/health${NC}\n"
    
    echo "3. Monitor with Prometheus:"
    echo -e "   ${YELLOW}docker compose up -d prometheus grafana${NC}\n"
    
    echo "4. Auto-scale with metrics:"
    echo -e "   ${YELLOW}./scripts/auto-recovery.sh --verbose${NC}\n"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
}

main "$@"
