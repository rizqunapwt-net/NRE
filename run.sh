#!/usr/bin/env bash
# Rizquna ERP - Full Stack Auto Start Script
# This script starts the backend containers and the frontend dev server.

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Starting Rizquna ERP Ecosystem...${NC}"

# 1. Start Backend using existing dev.sh
echo -e "${BLUE}>>> 1. Starting Backend Services (Docker)...${NC}"
./scripts/dev.sh up

# 2. Check for node_modules in admin-panel
if [ ! -d "admin-panel/node_modules" ]; then
    echo -e "${BLUE}>>> 2. Installing Frontend Dependencies...${NC}"
    cd admin-panel && npm install && cd ..
fi

# 3. Start Frontend Dev Server
echo -e "${GREEN}>>> 3. Starting Admin Panel (Vite)...${NC}"
echo -e "${GREEN}>>> Admin Panel will be available at http://localhost:3000${NC}"

# Use concurrently if available or just run in background
if command -v npm &> /dev/null; then
    cd admin-panel && npm run dev
else
    echo "ERROR: npm is not installed on host. Frontend must be run manually or added to Docker."
    exit 1
fi
