#!/bin/bash

# Rizquna ERP Production Deployment Script
set -e

echo "🚀 Starting Production Deployment..."

# 1. Pull latest changes (if in git)
# git pull origin main

# 2. Build and start services
echo "📦 Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Wait for DB to be ready
echo "⏳ Waiting for database to be ready..."
docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres -d rizquna_erp

# 4. Run Laravel Optimizations
echo "⚙️ Running Laravel post-deployment commands..."
docker-compose -f docker-compose.prod.yml exec -T app php artisan migrate --force
docker-compose -f docker-compose.prod.yml exec -T app php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.prod.yml exec -T app php artisan view:cache

# 5. Clear Redis cache just in case
echo "🧹 Clearing Redis cache..."
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a "${REDIS_PASSWORD}" flushall

echo "✨ Deployment Complete! Visit https://rizquna.id"
