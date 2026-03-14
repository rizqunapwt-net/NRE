#!/bin/bash
set -e

# Configuration
REMOTE_USER="deploy"
REMOTE_HOST="rizquna.id"
REMOTE_PATH="/var/www/html"

echo "🚀 Starting deployment to $REMOTE_HOST..."

# 1. Build frontend (Admin Panel and Main Frontend)
echo "📦 Building frontend..."
if [ -d "admin-panel" ]; then
    cd admin-panel
    npm install
    npm run build
    cd ..
fi

# 2. Rsync files to server
echo "📤 Syncing files to server..."
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'vendor' \
    --exclude 'storage/*.key' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude 'public/storage' \
    ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

# 3. Docker Compose production
echo "🐳 Restarting containers..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && \
    docker compose -f docker-compose.prod.yml up -d --build"

# 4. PHP Artisan Migrations and Optimizations
echo "🛠️ Running Laravel optimizations..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && \
    docker exec nre_app_prod php artisan migrate --force && \
    docker exec nre_app_prod php artisan config:cache && \
    docker exec nre_app_prod php artisan route:cache && \
    docker exec nre_app_prod php artisan view:cache && \
    docker exec nre_app_prod php artisan event:cache"

echo "✅ Deployment complete!"
