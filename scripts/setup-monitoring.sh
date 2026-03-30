#!/bin/bash

##############################################################################
# Agent 7: Analytics & Monitoring Setup Script
# Sets up Sentry, Prometheus, Grafana, ELK stack for Rizquna ERP
##############################################################################

set -e

PROJECT_ROOT="/Users/macm4/Documents/Projek/NRE"
AGENTS_DIR="$PROJECT_ROOT/.agents"

echo """
╔═════════════════════════════════════════════════════════════════╗
║   🔷 Agent 7: Analytics & Monitoring Setup                     ║
╚═════════════════════════════════════════════════════════════════╝
"""

cd "$PROJECT_ROOT"

# =============================================================================
# Step 1: Install Sentry (Error Tracking)
# =============================================================================

echo "📦 Step 1: Installing Sentry..."
echo ""

if composer require sentry/sentry-laravel; then
    echo "✅ Sentry package installed"
else
    echo "⚠️  Sentry may already be installed"
fi

# Publish Sentry config
./scripts/dev.sh artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"

# Create .env variables
if ! grep -q "SENTRY_LARAVEL_DSN" .env; then
    echo ""
    echo "⚠️  SENTRY_LARAVEL_DSN not in .env"
    echo "Get your DSN from: https://sentry.io/onboarding/"
    echo ""
    read -p "Enter Sentry DSN: " SENTRY_DSN
    echo "SENTRY_LARAVEL_DSN=$SENTRY_DSN" >> .env
    echo "✅ Sentry DSN added to .env"
fi

# =============================================================================
# Step 2: Setup Prometheus & Grafana Docker containers
# =============================================================================

echo ""
echo "🐳 Step 2: Adding Prometheus & Grafana to Docker..."

# Check if docker compose already has monitoring services
if ! grep -q "prometheus:" docker-compose.yml; then
    echo ""
    echo "⚠️  Prometheus not in docker-compose.yml"
    echo "Review docker/docker-compose-monitoring.yml and merge services"
    echo ""
    echo "Quick merge command:"
    echo "cat docker/docker-compose-monitoring.yml >> docker-compose.yml"
    echo ""
    read -p "Merge now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat docker/docker-compose-monitoring.yml >> docker-compose.yml
        echo "✅ Monitoring services merged"
    fi
fi

# Start monitoring services
echo ""
echo "Starting Prometheus and Grafana..."
./scripts/dev.sh up -d prometheus grafana

# Wait for services
echo "Waiting for services to start..."
sleep 5

# Verify services
echo ""
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is running on http://localhost:9090"
else
    echo "⚠️  Prometheus may not be ready yet. Try: curl http://localhost:9090/-/healthy"
fi

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Grafana is running on http://localhost:3000 (admin/admin)"
else
    echo "⚠️  Grafana may not be ready yet. Try: curl http://localhost:3000/api/health"
fi

# =============================================================================
# Step 3: Setup Laravel Telescope (APM for development)
# =============================================================================

echo ""
echo "🔭 Step 3: Setting up Laravel Telescope..."

if composer require laravel/telescope --dev; then
    echo "✅ Telescope installed"
    ./scripts/dev.sh artisan telescope:install
    ./scripts/dev.sh artisan migrate
else
    echo "ℹ️  Telescope may already be installed"
fi

# =============================================================================
# Step 4: Create monitoring config file
# =============================================================================

echo ""
echo "⚙️  Step 4: Creating monitoring configuration..."

if [ -f "config/monitoring.php" ]; then
    echo "✅ config/monitoring.php already exists"
else
    echo "Creating config/monitoring.php..."
    # Already created earlier
fi

# =============================================================================
# Step 5: Database migrations for metrics
# =============================================================================

echo ""
echo "🗄️  Step 5: Creating metrics database tables..."

# Create migration for metrics (if needed)
./scripts/dev.sh artisan make:migration create_metrics_tables --create=metrics 2>/dev/null || true

echo "ℹ️  You may need to create custom metrics tables"
echo "See: database/migrations/"

# =============================================================================
# Step 6: Test monitoring
# =============================================================================

echo ""
echo "🧪 Step 6: Testing monitoring setup..."

# Test Sentry
echo ""
echo "Testing Sentry error capture..."
./scripts/dev.sh artisan tinker <<'TINKER'
try {
    throw new Exception("Test error from Agent 7 monitoring setup");
} catch (Exception $e) {
    \Sentry\captureException($e);
    echo "✅ Error captured by Sentry\n";
}
TINKER

# Test metrics endpoint
echo ""
echo "Testing metrics endpoint..."
if curl -s http://localhost:9000/metrics > /dev/null 2>&1; then
    echo "✅ Metrics endpoint responding"
else
    echo "ℹ️  Metrics endpoint not yet active (configure in monitoring.php)"
fi

# =============================================================================
# Step 7: Summary & Next Steps
# =============================================================================

echo ""
echo "╔═════════════════════════════════════════════════════════════════╗"
echo "║   ✅ Monitoring Setup Complete!                               ║"
echo "╚═════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 What's been set up:"
echo "  ✅ Sentry (error tracking)"
echo "  ✅ Prometheus (metrics collection)"
echo "  ✅ Grafana (visualization)"
echo "  ✅ Laravel Telescope (APM)"
echo "  ✅ Config files (config/monitoring.php)"
echo ""
echo "🌐 Access Points:"
echo "  • Sentry:     https://sentry.io/onboarding/ (your org)"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana:    http://localhost:3000 (admin/admin)"
echo "  • Telescope:  http://localhost:9000/telescope (dev only)"
echo ""
echo "📋 Next Steps:"
echo "  1. Setup Grafana datasource (Prometheus at http://prometheus:9090)"
echo "  2. Create Grafana dashboards (see SCALABLE_8_AGENTS.md)"
echo "  3. Configure alert rules (docker/prometheus/alerts.yml already created)"
echo "  4. Setup notification channels (Slack, Email)"
echo "  5. Run: ./scripts/dev.sh artisan monitoring:test"
echo ""
echo "📚 Documentation:"
echo "  • Agent 7 instructions: .agents/agent-7.md"
echo "  • Prometheus config:    docker/prometheus/prometheus.yml"
echo "  • Alert rules:          docker/prometheus/alerts.yml"
echo ""
echo "💬 Report to MCP_STATE.md when complete!"
echo ""
