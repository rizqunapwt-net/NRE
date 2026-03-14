# 🎯 Kumpulan Prompt untuk Memperbaiki Proyek NRE

> Panduan lengkap untuk meningkatkan kualitas dan fitur Proyek Rizquna ERP

---

## 📋 Bagian 1: Backend Core (Laravel)

### 1.1 Seed Data untuk Development
```
Buatkan seeder lengkap untuk development environment yang mencakup:
- User seeder (5 user: admin, 3 penulis, 1 percetakan)
- Category seeder (minimal 6 kategori: Pendidikan, Islam, Akademik, Manajemen, Sejarah, Teknologi)
- Author seeder (minimal 15 penulis dengan nama, email, bio lengkap)
- Book seeder (minimal 50 buku dengan:
  * Judul yang variatif
  * Assigned ke berbagai categories
  * Harga range 0-150000
  * Cover image URL (gunakan placeholder atau API)
  * ISBN yang valid
  * Status: draft/published/archived
  * Published date variatif last 6 months
- Contract seeder (minimal 30 kontrak dengan status: pending/approved/rejected/expired)
- Marketplace seeder (Tokopedia, Shopee, Blibli, Gramedia)

File output: database/seeders/DevelopmentSeeder.php
Invoke lewat: php artisan db:seed --class=DevelopmentSeeder
```

### 1.2 Author Portal Endpoints
```
Buatkan REST API endpoints untuk author portal dengan routes:
1. GET /api/v1/author/dashboard
   - Jumlah naskah draft/submitted/approved/published
   - Total royalti bulan ini & tahun ini
   - Last 5 published books
   - Recent transactions
   
2. GET /api/v1/author/manuscripts
   - List manuscripts dengan pagination
   - Filter: status (draft/submitted/approved/published)
   - Search by title
   - Sort: created_at, updated_at, status

3. POST /api/v1/author/manuscripts
   - Create new manuscript (title, description, category, file)
   - Validation: title unique per author, file max 50MB

4. GET /api/v1/author/manuscripts/{id}
   - Detail manuscript with timeline/history

5. PUT /api/v1/author/manuscripts/{id}
   - Update manuscript (title, description, category, file)

6. DELETE /api/v1/author/manuscripts/{id}
   - Soft delete (status = deleted)

7. GET /api/v1/author/royalties
   - List royalties dengan pagination
   - Group by month/year
   - Filter by status: pending/finalized/paid

8. GET /api/v1/author/royalties/{id}
   - Detail royalti breakdown per book

9. GET /api/v1/author/profile
   - Author info: name, email, bio, avatar, bank_account

10. PUT /api/v1/author/profile
    - Update profile & bank account info

Response format harus: { success: bool, message: string, data: object, errors: object }
```

### 1.3 Data Validation & Cleanup
```
Buatkan artisan command: php artisan data:integrity-check

Output berupa report:
- Books without cover_url
- Books with invalid ISBN
- Books tanpa category
- Authors tanpa email verified
- Orphaned manuscripts (author deleted tapi manuscript exists)
- Contracts expired tapi masih active
- Royalty inconsistencies
- Price = null atau negative

Sertakan opsi --fix untuk auto-repair yang aman.
```

---

## 📋 Bagian 2: Admin Panel (React)

### 2.1 Royalty Management Pages
```
Buatkan halaman Admin untuk manage royalties:

1. /admin/royalties
   - Table view:
     * Author name
     * Period (month-year)
     * Total sales (per book breakdown)
     * Royalty percentage & amount
     * Status: pending/finalized/paid
     * Action: View detail, Edit, Finalize, Payment proof upload
   - Filter: author, period, status
   - Bulk action: Finalize selected, Mark as paid
   - Export to CSV/PDF

2. /admin/royalties/[id]
   - Detail view:
     * Author info & bank account
     * Sales breakdown by book (quantity, price, total)
     * Royalty calculation formula
     * Timeline: submitted → finalized → paid
     * Payment proof (upload/download)
     * Notes/comments section

3. /admin/royalties/[id]/edit
   - Form untuk adjust royalty percentage (dengan reason)
   - Mark as paid dengan proof (screenshot/receipt)
   - Add notes/comments

Design: Ant Design v5 cards, table dengan sorting/filtering
```

### 2.2 CMS/Settings Editor
```
Buatkan halaman /admin/settings dengan sections:

1. General Settings
   - Company name, logo, description
   - Contact email, phone, address
   - Social media links (Facebook, Instagram, LinkedIn, Twitter)

2. Publish Settings
   - Default royalty percentage
   - Minimum balance for withdrawal
   - Payment methods (Bank account, e-wallet)
   - Publishing timeline (how many days for each step)

3. FAQ Management
   - CRUD FAQ items
   - Rich text editor untuk answer
   - Category (General, Payment, Publishing, Technical)
   - Publish/unpublish toggle
   - Order/sorting

4. Testimonials
   - CRUD testimonial
   - Fields: author name, role, text, image, rating
   - Publish/unpublish toggle
   - Featured toggle (untuk homepage carousel)

5. Homepage Banners
   - Upload image, title, description
   - Link/CTA button
   - Schedule visibility (dari-sampai date)
   - Position/order

6. Email Templates
   - List email templates (welcome, manuscript_approved, royalty_finalized, etc)
   - Edit template dengan variables: {author_name}, {book_title}, {amount}, etc
   - Preview dengan sample data
   - Test send ke email address

Design: Tab interface dengan form validation
Technology: React Hook Form + Yup validation
```

### 2.3 Book CRUD Form Testing & Improvement
```
Improve existing Book CRUD form (/admin/books):

1. Form Fields yang harus ada:
   - Title (required, max 255)
   - Slug (auto-generate dari title, editable)
   - Category (select, required)
   - Author (select/searchable, required)
   - Description (rich text editor, required)
   - ISBN (unique, format validation)
   - Price (number, min 0)
   - Page count (number)
   - Published date (datepicker)
   - Status (select: draft/published/archived)
   - Cover image (upload + preview)
   - Marketplace links (dynamic form rows)
   - Type (physical/digital/both)
   - Is featured (checkbox)

2. Upload handling:
   - Accept: JPG, PNG, WebP (max 5MB)
   - Preview sebelum upload
   - Drag & drop support
   - Auto-resize thumbnail

3. Validation rules:
   - Title & slug unique
   - ISBN format: 10 atau 13 digit
   - Price >= 0
   - Cover image required untuk published books

4. Submit handling:
   - Loading state dengan spinner
   - Error message dari API
   - Success notification
   - Redirect ke list atau stay di edit mode

5. UI/UX improvements:
   - Form tabs untuk organize fields
   - Inline help text untuk field yang kompleks
   - Auto-save draft functionality
   - Confirm before delete
```

---

## 📋 Bagian 3: Frontend Public (React)

### 3.1 SEO & Performance Optimization
```
Implementasi i18n & multi-language support:

1. Setup:
   - Gunakan i18next untuk translation
   - Locale files: id.json, en.json di src/locales/
   - Language selector di navbar
   - Persist selected language di localStorage

2. Translate semua text di:
   - Landing page (hero, features, testimonial, FAQ)
   - Catalog page (filters, pagination)
   - Book detail page (tabs, buttons, labels)
   - Footer & navbar

3. SEO improvement:
   - Add <Helmet> component untuk canonical URLs
   - Open Graph meta tags dengan image
   - JSON-LD structured data untuk Book schema
   - Sitemap.xml generation
   - Robots.txt configuration

4. Performance:
   - Lazy load images dengan Intersection Observer
   - Code splitting untuk routes
   - Minify CSS/JS
   - Image optimization (WebP format)
   - Implement breadcrumb schema

Output: Component <SEOHelmet /> yang reusable
```

### 3.2 Advanced Search & Filtering
```
Enhance catalog page dengan advanced search:

1. Search features:
   - Full-text search (title, author, description, ISBN)
   - Filter by:
     * Category (multi-select)
     * Price range (slider)
     * Published year (select)
     * Author (searchable select)
     * Type (physical/digital)
     * Rating (star filter)
   - Sort: Newest, Popular, Bestseller, Price (low-high), Rating

2. URL state persistence:
   - Query params reflect filters (searchable URL)
   - Share filter via link
   - Browser back/forward support

3. Search results:
   - "Did you mean?" suggestion jika 0 results
   - Show filter breadcrumb
   - Display result count & relevance
   - Save search to favorites (logged in users)

4. Performance:
   - Debounce search input (300ms)
   - Cache results
   - Pagination 12-24 items per page

Component structure:
- SearchBar.tsx (input + suggestions)
- SearchFilters.tsx (filter sidebar)
- SearchResults.tsx (grid display)
- SearchHooks.ts (useSearch hook)
```

### 3.3 User Authentication Flow
```
Implementasi complete auth flow di frontend:

Pages:
1. /login - Login form (email + password)
2. /register - Registration form (name, email, password, role select)
3. /forgot-password - Email input untuk password reset
4. /reset-password/[token] - New password form
5. /verify-email/[token] - Email verification page
6. /dashboard - Redirect berdasarkan role

Features:
- Form validation (client + server)
- Remember me checkbox (localStorage)
- Social login buttons (Google)
- Loading states & error messages
- Redirect ke intended page after login
- Logout functionality
- Token refresh untuk expired session

State management: Zustand atau Context API untuk auth state
Persistent: localStorage untuk token, sessionStorage untuk temporary data
```

---

## 📋 Bagian 4: DevOps & Infrastructure

### 4.1 Docker Production Setup
```
Improve docker-compose.prod.yml dengan:

1. Multi-stage builds untuk optimasi image size
2. Healthcheck untuk setiap service
3. Volume management:
   - Named volumes untuk persistent data
   - Bind mounts untuk configs
4. Environment variables per service
5. Network configuration
6. Resource limits (CPU, memory)
7. Logging configuration (driver, rotation)
8. Security: non-root user, read-only filesystem

Services:
- PHP-FPM (separate dari web server)
- Nginx reverse proxy dengan gzip, caching
- PostgreSQL 16 dengan backup config
- Redis untuk caching & session
- MinIO untuk file storage

Post-deployment commands:
- php artisan migrate
- php artisan cache:clear
- npm run build untuk admin panel
```

### 4.2 CI/CD Pipeline
```
Setup GitHub Actions dengan workflows:

1. .github/workflows/test.yml
   - Trigger: push to main, PR
   - Steps:
     * Checkout code
     * Setup PHP 8.4 + dependencies
     * Setup Node.js
     * Run PHPUnit tests
     * Run ESLint
     * Run database migrations (test DB)
   - Artifact: test reports

2. .github/workflows/deploy.yml
   - Trigger: push to main only
   - Steps:
     * Build PHP image
     * Build Node image
     * Push to Docker Hub
     * SSH into production server
     * Pull images & restart containers
     * Run migrations
     * Smoke test endpoints
   - Notification: Slack/Email on success/failure

3. Lint & code quality:
   - PHPStan level 7+
   - ESLint fix
   - Prettier format check

Configuration files:
- phpstan.neon
- .eslintrc.json
- .prettierrc
```

### 4.3 Monitoring & Logging
```
Implementasi monitoring untuk production:

1. Application logging:
   - Sentry untuk error tracking
   - Structured logging (JSON format)
   - Log rotation (Laravel)
   - Log levels: debug, info, warning, error, critical

2. Server monitoring:
   - Uptime monitoring (Ping)
   - Response time tracking
   - Error rate alerts
   - Disk space alerts

3. Performance monitoring:
   - Database query time
   - API response time
   - Memory usage
   - CPU usage

4. Database backups:
   - Daily automated backup
   - Point-in-time recovery
   - Send to S3 for archive

Tools: Sentry, DataDog, atau simple ELK stack
```

---

## 📋 Bagian 5: Testing & QA

### 5.1 Automated Testing
```
Buatkan test suite lengkap:

1. Unit tests (PHPUnit):
   - Model tests (Book, Author, Contract models)
   - Service tests (BookStorageService, GoogleDriveService)
   - Validation tests

2. Feature tests (Laravel):
   - Authentication flow
   - API endpoints (catalog, royalty, admin)
   - Authorization (permissions)
   - Pagination & filtering
   - File upload

3. API test script (JavaScript):
   - Test semua endpoint di /api/v1
   - Positive & negative cases
   - Response validation
   - Performance benchmark

4. E2E tests (Playwright):
   - User registration → login
   - Browse catalog → view detail → not buy (price=0)
   - Admin: create book → assign marketplace → view stats
   - Author: submit manuscript → view status

Coverage target: >= 80%

Run tests: npm run test (frontend) & php artisan test (backend)
```

### 5.2 Browser Compatibility & Device Testing
```
Test checklist untuk QA:

Desktop browsers:
- Chrome latest
- Firefox latest
- Safari latest
- Edge latest

Mobile:
- iPhone 12, 14, 15 (iOS)
- Samsung Galaxy S21, S23 (Android)
- iPad Pro (tablet)

Tests:
- Layout responsiveness
- Touch interactions
- Form inputs (especially on iOS)
- Images loading
- Navigation usability
- Loading states visibility

Tools:
- BrowserStack atau ngrok untuk remote device testing
- Chrome DevTools mobile emulation
- Manual testing checklist
```

---

## 📋 Bagian 6: Documentation

### 6.1 API Documentation
```
Buatkan lengkap API docs dengan OpenAPI/Swagger:

1. Setup:
   - Gunakan Laravel OpenAPI generator
   - Scaffolding: /docs/openapi.json

2. Dokumentasi per endpoint:
   - Method & path
   - Description lengkap
   - Request params (query, body)
   - Response format (success & error)
   - Status codes (200, 400, 401, 404, 422, 500)
   - Example requests & responses
   - Required authentication
   - Rate limiting info

3. Host di:
   - Swagger UI: /docs/swagger
   - ReDoc: /docs/redoc
   - PDF export

Tools: Laravel Scribe atau Scalar
```

### 6.2 Developer Setup Guide
```
Buatkan comprehensive README untuk setup:

Sections:
1. Project overview (3 paragraf)
2. Tech stack detail
3. Requirements (PHP version, Node, Docker, etc)
4. Local development setup:
   - Clone repo
   - Copy .env files
   - composer install
   - npm install
   - php artisan migrate --seed
   - Running servers (Laravel, Vite)
5. Docker setup alternative
6. Configuration (env variables explained)
7. Database setup & migrations
8. Running tests
9. API endpoints overview
10. Deployment guide
11. Troubleshooting FAQ
12. Contributing guidelines

Location: README.md (update existing)
Format: Markdown dengan table of contents
```

---

## 📋 Bagian 7: Bug Fixes & Improvements

### 7.1 Known Issues to Fix
```
Priority bugs:
1. Price "0.00" handling - DONE (Agent 2)
2. PostgreSQL ID casting - DONE (Agent 1)
3. Author column naming (nama vs name) - DONE (Agent 1)
4. Cover image serving (private vs public path)
5. Vite exit on non-interactive terminal
6. Mobile form keyboard push layout issue
7. Image lazy loading blocking initial render
```

### 7.2 UX/UI Improvements
```
Suggested improvements:
1. Add loading skeleton di semua data fetch
2. Implement infinite scroll vs pagination option
3. Add dark mode theme
4. Better error messages (user-friendly)
5. Add undo functionality untuk delete
6. Progress bar untuk file upload
7. Toast notifications untuk user feedback
8. Keyboard shortcuts untuk admin (k untuk search)
9. Quick stats cards di dashboard
10. Export data functionality (CSV, PDF)
```

---

## 🚀 Execution Priority

### Phase 1 (Critical - 1-2 minggu)
1. Seed data untuk dev environment
2. Author portal endpoints
3. Data validation/cleanup command
4. Fix remaining SEO issues
5. Responsive test & fix

### Phase 2 (Important - 2-3 minggu)
1. Royalty management UI
2. CMS/Settings editor
3. Docker production setup
4. CI/CD pipelines
5. API documentation

### Phase 3 (Enhancement - 1-2 minggu)
1. Advanced search & filtering
2. Comprehensive testing
3. Performance optimization
4. Monitoring & logging
5. Browser compatibility testing

---

## 📞 Usage Guide

Untuk setiap prompt, Anda bisa:
1. Copy seluruh prompt ke AI assistant
2. Atau modifikasi sesuai kebutuhan spesifik
3. Provide konteks: "Kerjakan Section 2.1 - Royalty Management Pages"
4. Harapkan delivery: Code, tests, documentation

Setiap prompt dirancang untuk bisa dikerjakan independent & integrated ke project.
