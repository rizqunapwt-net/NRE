# 📚 Rizquna ERP - Digital Publishing Management System

> **Sistem Manajemen Penerbitan Digital Terintegrasi untuk PT Rizquna Pustaka**

[![Laravel](https://img.shields.io/badge/Laravel-12.53.0-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.4.19-777BB4?style=flat&logo=php&logoColor=white)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)]()

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Requirements](#-requirements)
- [Local Development Setup](#-local-development-setup)
- [Docker Setup](#-docker-setup-alternative)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup--migrations)
- [Running Tests](#-running-tests)
- [API Endpoints](#-api-endpoints-overview)
- [Deployment Guide](#-deployment-guide)
- [Troubleshooting](#-troubleshooting-faq)
- [Contributing](#-contributing-guidelines)

---

## 📋 Project Overview

**Rizquna ERP** adalah sistem manajemen penerbitan digital yang komprehensif, dirancang untuk mengelola seluruh siklus hidup publikasi buku — dari naskah mentah hingga distribusi ke berbagai marketplace. Sistem ini mengintegrasikan manajemen penulis, proses editorial, produksi, distribusi, dan perhitungan royalti dalam satu platform terpusat.

Platform ini mendukung **multi-phase publishing workflow** yang mencakup: (1) Digital Library Management dengan katalog buku digital dan preview, (2) Author Portal untuk penulis mengelola naskah dan kontrak, (3) Admin Panel untuk tim editorial dan produksi, (4) Marketplace Integration untuk distribusi ke platform seperti Gramedia, Amazon, dan lainnya, serta (5) Royalty Calculation & Payment untuk transparansi pembayaran royalti kepada penulis.

Dengan arsitektur **modular dan scalable**, Rizquna ERP dibangun menggunakan Laravel 12 dan PostgreSQL, dilengkapi dengan fitur-fitur enterprise seperti RBAC (Role-Based Access Control), audit trail lengkap, automated backup, real-time monitoring dengan Sentry, dan support untuk high-availability deployment. Sistem ini dirancang untuk menangani ribuan buku, ratusan penulis, dan jutaan transaksi penjualan dengan performa optimal.

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel** | 12.53.0 | Web Framework |
| **PHP** | 8.4.19 | Runtime |
| **PostgreSQL** | 16 | Primary Database |
| **Redis** | 7 | Cache & Queue |
| **MinIO** | Latest | S3-Compatible Storage |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Ant Design** | 5.x | UI Components |
| **Vite** | 5.x | Build Tool |
| **React Query** | 5.x | Data Fetching |
| **React Router** | 6.x | Routing |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Docker & Docker Compose** | Containerization |
| **Nginx** | Web Server |
| **Laravel Horizon** | Queue Monitoring |
| **Sentry** | Error Tracking |
| **PHPUnit** | Testing Framework |
| **Git** | Version Control |

### Key Packages
- **Spatie Laravel Permission** — RBAC
- **Spatie Laravel Activitylog** — Audit Trail
- **Laravel Sanctum** — API Authentication
- **DomPDF** — PDF Generation
- **Laravel Excel** — Import/Export
- **Google APIs** — Drive, Sheets, OAuth

---

## 📦 Requirements

### Minimum Requirements
- **PHP**: 8.2 or higher
- **Node.js**: 18.x or higher
- **Composer**: 2.5 or higher
- **npm**: 9.x or higher
- **Database**: PostgreSQL 16+ or MySQL 8+
- **Redis**: 6.x or higher (optional for local)

### Recommended Requirements
- **PHP**: 8.4+
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 10GB free space
- **Docker**: 20.x+ (for containerized setup)
- **Git**: Latest version

### PHP Extensions Required
```bash
php-pdo
php-pgsql (or php-mysql)
php-redis
php-gd
php-xml
php-mbstring
php-curl
php-zip
php-bcmath
php-gmp
```

### Verify Installation
```bash
php -v          # Should show PHP 8.2+
node -v         # Should show Node 18+
npm -v          # Should show npm 9+
composer -V     # Should show Composer 2.5+
docker --version # Should show Docker 20+ (if using Docker)
```

---

## 💻 Local Development Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/rizqunapwt-net/NRE.git
cd NRE

# Or if you have SSH access
git clone git@github.com:rizqunapwt-net/NRE.git
cd NRE
```

### Step 2: Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env with your local settings
nano .env  # or use your preferred editor
```

### Step 3: Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### Step 4: Database Setup

**Option A: PostgreSQL (Recommended)**
```bash
# Create database
createdb rizquna_erp

# Update .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=rizquna_erp
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Run migrations with seed
php artisan migrate --seed
```

**Option B: SQLite (Quick Start)**
```bash
# SQLite is configured by default in .env
# Just run migrations
php artisan migrate --seed
```

### Step 5: Storage Setup

```bash
# Create storage link
php artisan storage:link

# Set permissions (Linux/Mac)
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache  # Adjust user as needed
```

### Step 6: Seed Initial Data

```bash
# Run database seeder
php artisan db:seed

# This creates:
# - Admin user (admin@rizquna.com / password)
# - Sample categories
# - Sample authors
# - Sample books
```

### Step 7: Start Development Servers

**Terminal 1 - Laravel Backend:**
```bash
php artisan serve
# Access: http://localhost:8000
```

**Terminal 2 - Vite Frontend:**
```bash
npm run dev
# Vite will auto-reload on changes
```

**Terminal 3 - Queue Worker (Optional):**
```bash
php artisan queue:work
# Process background jobs
```

**Terminal 4 - Scheduler (Optional):**
```bash
php artisan schedule:work
# Run scheduled tasks
```

### Step 8: Verify Installation

Open browser and navigate to:
- **Homepage**: http://localhost:8000
- **Login**: http://localhost:8000/login
- **Admin Panel**: http://localhost:8000/admin
- **API Health**: http://localhost:8000/api/v1/public/stats

**Default Admin Account:**
- Email: `admin@rizquna.com`
- Password: `password`

---

## 🐳 Docker Setup Alternative

### Quick Start with Docker

```bash
# Start all containers
docker-compose up -d

# Or use the helper script
./scripts/dev.sh up
```

### Docker Services

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| **App** | rizquna_app | 9000 | PHP-FPM Application |
| **Web** | rizquna_web | 9000 → 80 | Nginx Web Server |
| **Database** | rizquna_db | 5435 → 5432 | PostgreSQL 16 |
| **Redis** | rizquna_redis | 6381 → 6379 | Redis Cache |
| **MinIO** | rizquna_minio | 9010 → 9000 | S3 Storage |
| | | 9011 → 9001 | MinIO Console |

### Docker Commands

```bash
# View logs
docker-compose logs -f app
docker-compose logs -f web

# Access container shell
docker exec -it rizquna_app bash

# Run artisan commands
docker exec rizquna_app php artisan migrate
docker exec rizquna_app php artisan db:seed

# Restart services
docker-compose restart app
docker-compose restart web

# Stop all containers
docker-compose down
```

### Access URLs (Docker)
- **Application**: http://localhost:9000
- **MinIO Console**: http://localhost:9011
  - Username: `minioadmin`
  - Password: `minioadmin`
- **PostgreSQL**: localhost:5435

---

## ⚙️ Configuration

### Essential Environment Variables

```bash
# Application
APP_NAME="Rizquna ERP"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Jakarta

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=rizquna_erp
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Redis (optional for local)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null

# Mail (for local development)
MAIL_MAILER=log
# Emails will be logged to storage/logs/laravel.log

# File Storage
FILESYSTEM_DISK=local
# Use 's3' for MinIO/production

# MinIO/S3 Configuration
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=rizquna-erp
AWS_ENDPOINT=http://localhost:9010
AWS_USE_PATH_STYLE_ENDPOINT=true

# Authentication
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Queue
QUEUE_CONNECTION=sync  # Use 'redis' or 'database' for production

# Cache
CACHE_STORE=file  # Use 'redis' or 'database' for production

# Sentry (Error Tracking)
SENTRY_LARAVEL_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=local
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Configuration Files

| File | Purpose |
|------|---------|
| `config/app.php` | Application settings |
| `config/database.php` | Database connections |
| `config/cache.php` | Cache configuration |
| `config/queue.php` | Queue configuration |
| `config/auth.php` | Authentication settings |
| `config/permission.php` | RBAC settings |
| `config/sentry.php` | Error tracking |

---

## 🗄 Database Setup & Migrations

### Database Structure

The application uses **PostgreSQL 16** with the following key tables:

**Core Tables:**
- `users` — User accounts
- `authors` — Author profiles
- `books` — Book catalog
- `categories` — Book categories
- `contracts` — Legal contracts
- `marketplaces` — Marketplace partners
- `sales` — Sales transactions
- `royalty_calculations` — Royalty reports
- `payments` — Payment tracking

**System Tables:**
- `migrations` — Migration history
- `cache` — Application cache
- `sessions` — User sessions
- `jobs` / `failed_jobs` — Queue jobs
- `activity_log` — Audit trail
- `permissions` / `roles` / `model_has_permissions` — RBAC

### Running Migrations

```bash
# Run all migrations
php artisan migrate

# Run with seed
php artisan migrate --seed

# Rollback last batch
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Fresh migration (drop & re-run)
php artisan migrate:fresh --seed

# Check migration status
php artisan migrate:status
```

### Database Seeding

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=BookSeeder

# Available seeders:
# - RolePermissionSeeder
# - UserSeeder
# - CategorySeeder
# - AuthorSeeder
# - BookSeeder
# - SiteContentSeeder
```

### Database Backup & Restore

**Backup:**
```bash
# Using pg_dump (PostgreSQL)
pg_dump -h localhost -U postgres rizquna_erp > backup.sql

# Using artisan command
php artisan backup:run
```

**Restore:**
```bash
# Using psql
psql -h localhost -U postgres rizquna_erp < backup.sql

# Using artisan command
php artisan backup:restore backup.sql
```

---

## 🧪 Running Tests

### Test Suite Overview

The application includes **225+ tests** covering:
- Unit tests for business logic
- Feature tests for API endpoints
- Integration tests for workflows
- Browser tests for critical paths

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/PublicCatalogTest.php

# Run tests by name pattern
php artisan test --filter=catalog

# Run with coverage (requires Xdebug)
php artisan test --coverage

# Run tests in parallel (requires ParaTest)
php artisan test --parallel
```

### Test Database Configuration

Tests use an in-memory SQLite database by default. Configuration in `phpunit.xml`:

```xml
<php>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    <env name="CACHE_STORE" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="SESSION_DRIVER" value="array"/>
</php>
```

### Writing Tests

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['token', 'user']]);
    }
}
```

### Test Coverage Report

```bash
# Generate HTML coverage report
php artisan test --coverage-html=coverage

# View in browser
open coverage/index.html  # Mac/Linux
start coverage/index.html  # Windows
```

---

## 🔌 API Endpoints Overview

### Base URL
```
Local: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/register` | Register new user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/google/redirect` | Google OAuth redirect |
| GET | `/auth/google/callback` | Google OAuth callback |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/catalog` | Book catalog (paginated) |
| GET | `/public/catalog/{id}` | Book detail by ID/slug |
| GET | `/public/categories` | Category list |
| GET | `/public/authors` | Author list |
| GET | `/public/stats` | Platform statistics |
| GET | `/public/blog` | Blog posts |
| GET | `/public/faqs` | FAQ list |
| GET | `/public/testimonials` | Testimonials |
| GET | `/public/repository` | Academic repository |
| GET | `/public/sitasi` | Citation tool |

### Protected Endpoints (User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/library` | User's purchased books |
| GET | `/user/purchases` | Purchase history |
| POST | `/books/{id}/purchase` | Purchase a book |
| GET | `/profile` | User profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/change-password` | Change password |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard-stats` | Dashboard statistics |
| GET | `/admin/users` | User management |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/{id}` | Update user |
| GET | `/admin/books` | Book management |
| POST | `/admin/books` | Create book |
| PUT | `/admin/books/{id}` | Update book |
| GET | `/admin/authors` | Author management |
| POST | `/admin/authors` | Create author |
| GET | `/admin/contracts` | Contract management |
| PUT | `/admin/contracts/{id}/approve` | Approve contract |
| GET | `/admin/sales` | Sales data |
| POST | `/admin/sales/import` | Import sales CSV |
| GET | `/admin/royalties` | Royalty calculations |
| POST | `/admin/royalties/calculate` | Calculate royalties |
| GET | `/admin/settings/*` | System settings |

### API Authentication

```bash
# Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rizquna.com","password":"password"}'

# Use token in subsequent requests
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Book Title",
    "author": {
      "id": 1,
      "name": "Author Name"
    }
  },
  "meta": {
    "timestamp": "2026-03-15T10:00:00+07:00"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": {
      "email": ["The email field is required."]
    }
  },
  "meta": {
    "timestamp": "2026-03-15T10:00:00+07:00"
  }
}
```

---

## 🚀 Deployment Guide

### Production Requirements

- **Server**: Ubuntu 22.04 LTS or similar
- **PHP**: 8.4+ with required extensions
- **Database**: PostgreSQL 16
- **Web Server**: Nginx 1.25+
- **Redis**: 7.x
- **SSL Certificate**: Let's Encrypt or commercial

### Pre-Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Generate production `APP_KEY`
- [ ] Configure production database
- [ ] Set up Redis for cache & queue
- [ ] Configure S3/MinIO for storage
- [ ] Set up SSL certificate
- [ ] Configure Sentry DSN
- [ ] Set up automated backups
- [ ] Configure monitoring & alerting

### Deployment Steps

**1. Clone Repository on Server:**
```bash
cd /var/www
git clone https://github.com/rizqunapwt-net/NRE.git
cd NRE
```

**2. Install Dependencies:**
```bash
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

**3. Configure Environment:**
```bash
cp .env.example .env
nano .env  # Edit for production
php artisan key:generate
```

**4. Run Migrations:**
```bash
php artisan migrate --force --seed
```

**5. Optimize Application:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

**6. Set Permissions:**
```bash
sudo chown -R www-data:www-data /var/www/NRE
sudo chmod -R 775 storage bootstrap/cache
```

**7. Configure Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/NRE/public;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

**8. Setup Supervisor for Queue:**
```ini
[program:nre-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/NRE/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasuser=false
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/nre-queue.log
stopwaitsecs=3600
```

**9. Setup Cron for Scheduler:**
```bash
crontab -e

# Add Laravel scheduler
* * * * * cd /var/www/NRE && php artisan schedule:run >> /dev/null 2>&1
```

**10. Start Services:**
```bash
sudo systemctl restart nginx
sudo systemctl restart php8.4-fpm
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start nre-queue:*
```

### Post-Deployment Verification

```bash
# Check application health
curl https://your-domain.com/api/v1/public/stats

# Check queue status
php artisan horizon:status

# Check database connection
php artisan db:show

# Run smoke tests
bash scripts/smoke-test.sh
```

### Rollback Procedure

```bash
# Rollback code
git checkout previous-tag

# Rollback database
php artisan migrate:rollback --step=5

# Clear cache
php artisan optimize:clear

# Restart services
sudo supervisorctl restart nre-queue:*
sudo systemctl restart php8.4-fpm
```

---

## 🔧 Troubleshooting FAQ

### Common Issues

**Q: `php artisan serve` returns "Address already in use"**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
php artisan serve --port=8080
```

**Q: npm install fails with permission errors**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Q: Migration fails with "database does not exist"**
```bash
# Create database manually
createdb rizquna_erp

# Or use SQLite for local development
# Update .env: DB_CONNECTION=sqlite
# Create database/database.sqlite
touch database/database.sqlite
```

**Q: Storage link not working**
```bash
# Remove existing link
rm public/storage

# Create new link
php artisan storage:link

# Check permissions
chmod -R 775 storage
```

**Q: Queue jobs not processing**
```bash
# Check queue worker status
php artisan queue:work --status

# Restart queue worker
php artisan queue:restart

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

**Q: 404 errors on routes**
```bash
# Clear route cache
php artisan route:clear
php artisan route:cache

# Check route list
php artisan route:list

# Verify .htaccess exists in public/
```

**Q: Composer install fails**
```bash
# Clear composer cache
composer clear-cache

# Install with --ignore-platform-reqs if needed
composer install --ignore-platform-reqs

# Or update composer
composer self-update
```

**Q: Docker containers won't start**
```bash
# Check Docker logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build

# Remove and recreate
docker-compose down
docker-compose up -d
```

**Q: Sentry not capturing errors**
```bash
# Test Sentry configuration
php artisan sentry:test

# Check DSN in .env
echo $SENTRY_LARAVEL_DSN

# Verify Sentry is enabled
php artisan config:clear
```

### Getting Help

- **Documentation**: Check `/docs` folder
- **Logs**: `storage/logs/laravel.log`
- **Sentry**: Check error tracking dashboard
- **GitHub Issues**: Report bugs on repository

---

## 🤝 Contributing Guidelines

### How to Contribute

We welcome contributions! Please follow these steps:

**1. Fork the Repository**
```bash
# Fork on GitHub, then clone
git clone git@github.com:your-username/NRE.git
cd NRE
```

**2. Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

**3. Make Changes**
- Follow PSR-12 coding standards
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

**4. Run Tests**
```bash
# Ensure all tests pass
php artisan test

# Run linter
composer lint
```

**5. Commit Changes**
```bash
git add .
git commit -m "feat: add your feature description"

# Commit message format:
# feat: new feature
# fix: bug fix
# docs: documentation update
# style: code style fix
# refactor: code refactoring
# test: test update
# chore: maintenance
```

**6. Push and Create PR**
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Screenshots (if UI changes)
- Test results
- Related issue numbers

### Code Style

**PHP (Laravel):**
```php
// Follow Laravel conventions
class UserController extends Controller
{
    public function index()
    {
        return User::paginate(15);
    }
}
```

**TypeScript/React:**
```tsx
// Use TypeScript types
interface UserProps {
    id: number;
    name: string;
}

const UserCard: React.FC<UserProps> = ({ id, name }) => {
    return <div>{name}</div>;
};
```

### Pull Request Checklist

- [ ] Code follows project style guide
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] No sensitive data committed
- [ ] Commit messages are descriptive

### Reporting Issues

When reporting issues, include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (PHP version, OS, etc.)
- Screenshots/logs if applicable

---

## 📄 License

**Proprietary Software** — All rights reserved by PT Rizquna Pustaka.

This software is confidential and intended solely for internal use by authorized personnel. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 📞 Contact & Support

**Development Team:**
- Email: dev@rizquna.id
- Documentation: `/docs` folder
- Issue Tracker: GitHub Issues

**Last Updated:** March 15, 2026  
**Version:** 2.0.0

---

<div align="center">

**Built with ❤️ by Rizquna Development Team**

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://postgresql.org)

</div>
