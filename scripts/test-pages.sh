#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        Testing Rizquna Digital Library Pages             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test function
test_page() {
    local name=$1
    local url=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓${NC} $name ($url) - ${GREEN}OK${NC}"
    else
        echo -e "${RED}✗${NC} $name ($url) - ${RED}Failed ($response)${NC}"
    fi
}

echo "Testing Public Pages..."
echo "───────────────────────────────────────────────────────────"

test_page "Landing Page" "http://localhost:8000/"
test_page "Catalog (Buku)" "http://localhost:8000/buku"
test_page "Repository (Sitasi)" "http://localhost:8000/sitasi"
test_page "Login" "http://localhost:8000/login"
test_page "Register" "http://localhost:8000/register"

echo ""
echo "Testing API Endpoints..."
echo "───────────────────────────────────────────────────────────"

test_page "API Repository" "http://localhost:8000/api/v1/public/repository"
test_page "API Catalog" "http://localhost:8000/api/v1/public/catalog"

echo ""
echo "───────────────────────────────────────────────────────────"
echo -e "${YELLOW}Note: Start server with 'php artisan serve' first${NC}"
echo ""
