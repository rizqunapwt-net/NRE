#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# NRE API Smoke Test
# Quick health check untuk semua endpoint penting
# ════════════════════════════════════════════════════════════════════════════

set -e

BASE="http://localhost:9000/api/v1"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function
check_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local name=$4
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$endpoint")
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✅${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $name (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    NRE API Smoke Test                                      ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Base URL: $BASE"
echo "Time: $(date)"
echo ""

# ════════════════════════════════════════════════════════════════════════════
# Public Endpoints (No Auth Required)
# ════════════════════════════════════════════════════════════════════════════

echo "📌 Public Endpoints:"
check_endpoint "GET" "/public/catalog" "200" "Catalog (book list)"
check_endpoint "GET" "/public/categories" "200" "Categories"
check_endpoint "GET" "/public/stats" "200" "Stats"
check_endpoint "GET" "/public/authors" "200" "Authors"
check_endpoint "GET" "/public/blog" "200" "Blog"
check_endpoint "GET" "/public/faqs" "200" "FAQs"
check_endpoint "GET" "/public/testimonials" "200" "Testimonials"
check_endpoint "GET" "/public/site-content" "200" "Site Content"
check_endpoint "GET" "/public/sitasi" "200" "Repository/Sitasi"

# Test book detail with a known slug (if exists)
echo ""
echo "📌 Book Detail (testing with sample slug):"
BOOK_SLUG=$(curl -s "$BASE/public/catalog?per_page=1" | jq -r '.data[0].slug // empty')
if [ ! -z "$BOOK_SLUG" ]; then
    check_endpoint "GET" "/public/catalog/$BOOK_SLUG" "200" "Book detail by slug"
else
    echo -e "${YELLOW}⚠️${NC} No books available to test"
fi

# ════════════════════════════════════════════════════════════════════════════
# Auth Endpoints (Should Return 401 Without Auth)
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "📌 Auth Endpoints (Should require authentication):"
check_endpoint "GET" "/auth/me" "401" "Get current user"
check_endpoint "POST" "/auth/logout" "401" "Logout"
check_endpoint "POST" "/auth/change-password" "401" "Change password"

# ════════════════════════════════════════════════════════════════════════════
# Admin Endpoints (Should Return 401/403 Without Auth)
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "📌 Admin Endpoints (Should require admin auth):"
check_endpoint "GET" "/admin/dashboard-stats" "401" "Admin dashboard"
check_endpoint "GET" "/admin/users" "401" "User management"
check_endpoint "GET" "/admin/authors" "401" "Author management"
check_endpoint "GET" "/books" "401" "Book management"

# ════════════════════════════════════════════════════════════════════════════
# Login Test
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "📌 Authentication Test:"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@rizquna.com","password":"password"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅${NC} Login successful"
    ((PASSED++))
    
    # Test authenticated endpoint
    echo ""
    echo "📌 Authenticated Endpoints (With Token):"
    response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅${NC} Get current user with token"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} Get current user with token (Got: $response)"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌${NC} Login failed"
    echo "Response: $LOGIN_RESPONSE"
    ((FAILED++))
fi

# ════════════════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                           SUMMARY                                          ║"
echo "╠════════════════════════════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}✅ Passed${NC}: $PASSED                                                            ║"
echo -e "║  ${RED}❌ Failed${NC}: $FAILED                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check the logs above.${NC}"
    exit 1
fi
