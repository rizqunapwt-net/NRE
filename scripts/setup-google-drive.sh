#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Google Drive Setup Helper Script
# ═══════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║     Google Drive Integration - Setup Helper              ║${NC}"
echo "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_header() {
    echo ""
    echo "${YELLOW}▶ $1${NC}"
    echo "${YELLOW}───────────────────────────────────────────────────────${NC}"
}

# Function to print success
print_success() {
    echo "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo "${RED}✗ $1${NC}"
}

# Check if running in project directory
if [ ! -f "artisan" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "Step 1: Creating directories"

# Create google directory
mkdir -p storage/app/google
chmod -R 777 storage/app/google
print_success "Created storage/app/google directory"

# Create logs directory
mkdir -p storage/logs
chmod -R 777 storage/logs
print_success "Created storage/logs directory"

print_header "Step 2: Running migration"

php artisan migrate --path=database/migrations/2026_03_02_000000_add_google_drive_columns_to_books_table.php
print_success "Migration completed"

print_header "Step 3: Checking .env file"

if [ ! -f ".env" ]; then
    print_error ".env file not found! Copy .env.example to .env first"
    exit 1
fi

# Check if GOOGLE_SERVICE_ACCOUNT_KEY_PATH exists in .env
if grep -q "GOOGLE_SERVICE_ACCOUNT_KEY_PATH" .env; then
    print_success "Google Drive configuration found in .env"
else
    print_error "Google Drive configuration not found in .env"
    echo ""
    echo "Please add the following to your .env file:"
    echo ""
    echo "GOOGLE_SERVICE_ACCOUNT_KEY_PATH=storage/app/google/service-account.json"
    echo "GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID=your_folder_id_here"
    echo "GOOGLE_DRIVE_COVERS_FOLDER_ID=your_folder_id_here"
    echo "GOOGLE_DRIVE_PDFS_FOLDER_ID=your_folder_id_here"
    echo "GOOGLE_DRIVE_VISIBILITY=private"
    echo "GOOGLE_DRIVE_CHUNK_SIZE=2097152"
    echo ""
fi

print_header "Step 4: Checking service account JSON"

if [ -f "storage/app/google/service-account.json" ]; then
    print_success "Service account JSON file found"
    
    # Validate JSON
    if php -r "json_decode(file_get_contents('storage/app/google/service-account.json')); echo json_last_error() === JSON_ERROR_NONE ? 'valid' : 'invalid';" | grep -q "valid"; then
        print_success "JSON is valid"
    else
        print_error "JSON file is invalid or corrupted"
    fi
else
    echo "${YELLOW}⚠ Service account JSON not found${NC}"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
    echo "2. Select your project (rizquna)"
    echo "3. Enable Google Drive API"
    echo "4. Create a Service Account:"
    echo "   - IAM & Admin → Service Accounts → CREATE SERVICE ACCOUNT"
    echo "   - Name: Rizquna Books Sync"
    echo "5. Create JSON Key:"
    echo "   - Click on service account → Keys → ADD KEY → Create new key"
    echo "   - Select JSON format and download"
    echo "6. Copy the downloaded JSON to: storage/app/google/service-account.json"
    echo ""
fi

print_header "Step 5: Setup Instructions"

echo "${BLUE}Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Setup Google Cloud Console:${NC}"
echo "   - Create Service Account (if not done)"
echo "   - Download JSON key"
echo "   - Copy to storage/app/google/service-account.json"
echo ""
echo "2. ${YELLOW}Create Google Drive Folders:${NC}"
echo "   - Create folder 'Rizquna Books'"
echo "   - Create subfolder 'Book Covers'"
echo "   - Create subfolder 'Book PDFs'"
echo "   - Copy Folder IDs from URL"
echo ""
echo "3. ${YELLOW}Share Folders:${NC}"
echo "   - Share 'Rizquna Books' folder to service account email"
echo "   - Grant 'Editor' permission"
echo ""
echo "4. ${YELLOW}Update .env:${NC}"
echo "   - Add Folder IDs to GOOGLE_DRIVE_*_FOLDER_ID variables"
echo ""
echo "5. ${YELLOW}Test Connection:${NC}"
echo "   php artisan google:test-connection"
echo ""
echo "6. ${YELLOW}Sync Books:${NC}"
echo "   php artisan books:sync-drive"
echo ""

print_header "Documentation"

echo "For detailed instructions, see:"
echo "  - ${BLUE}GOOGLE_DRIVE_SETUP.md${NC} (Quick setup guide)"
echo "  - ${BLUE}docs/GOOGLE_DRIVE_INTEGRATION.md${NC} (Full documentation)"
echo ""

print_success "Setup helper completed!"
echo ""
