# Navkar QR Manager — PHP + MySQL Backend

## 📁 Folder Structure

```
php-backend/
├── config/
│   ├── config.php         ← Edit this! (DB credentials, JWT secret, QR URL)
│   └── database.php       ← PDO MySQL connection (don't edit)
├── lib/
│   ├── JWT.php            ← Pure PHP JWT (no Composer needed)
│   ├── QRCodeGenerator.php← QR code generator
│   ├── Response.php       ← JSON response helper
│   └── phpqrcode/         ← ⚠️  Download this! (see Step 2 below)
├── middleware/
│   └── auth.php           ← JWT auth middleware
├── api/
│   ├── auth/              ← login, logout, me, profile
│   ├── qrcodes/           ← list, create, get, update, delete, image, scans
│   ├── analytics/         ← dashboard, daily, monthly, devices, countries...
│   ├── categories/        ← list, create
│   ├── templates/         ← CRUD
│   ├── settings/          ← get, update
│   └── bulk/              ← upload, template, job status
├── p/
│   └── index.php          ← QR redirect handler (/p/NP001 → destination URL)
├── database/
│   └── schema_mysql.sql   ← Import this into phpMyAdmin
├── .htaccess              ← Apache URL rewriting (needed!)
└── index.php              ← Main router
```

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Download phpqrcode library (REQUIRED for QR generation)

1. Go to: https://sourceforge.net/projects/phpqrcode/
2. Download the ZIP file
3. Extract it — you'll get a folder containing `qrlib.php`
4. Create folder: `php-backend/lib/phpqrcode/`
5. Copy `qrlib.php` into it

**OR** use this direct approach (if you have PHP CLI):
```
mkdir php-backend/lib/phpqrcode
```
Then download `qrlib.php` from GitHub: https://github.com/t0k4rt/phpqrcode/blob/master/qrlib.php

---

### Step 2: Create MySQL Database in phpMyAdmin

1. Open **phpMyAdmin** (usually at `http://localhost/phpmyadmin`)
2. Click **"New"** in the left sidebar
3. Database name: `navkar_qr` (or any name you like)
4. Collation: `utf8mb4_unicode_ci`
5. Click **Create**
6. Select the new database from the list
7. Click **Import** tab
8. Click **Choose File** → select `php-backend/database/schema_mysql.sql`
9. Click **Go** / **Import**
10. ✅ All tables will be created automatically!

**Default login after import:**
- Email: `admin@navkarplywood.com`
- Password: `password`
- ⚠️  Change this immediately after first login!

---

### Step 3: Configure config.php

Edit `php-backend/config/config.php`:

```php
define('DB_HOST',    'localhost');         // Usually localhost
define('DB_NAME',    'navkar_qr');         // Your database name
define('DB_USER',    'root');              // Your MySQL username  
define('DB_PASS',    'your_password');     // Your MySQL password

// IMPORTANT: Change this to a long random string!
define('JWT_SECRET', 'your-very-long-random-secret-key-here');

// Change to your actual domain
define('QR_BASE_URL', 'https://qr.navkarplywood.com');

// Your frontend domain(s) separated by comma
define('ALLOWED_ORIGINS', ['http://localhost:5173', 'https://qr.navkarplywood.com']);
```

---

### Step 4: Upload to Hosting Server

**Option A: XAMPP/WAMP (local testing)**
- Copy `php-backend/` folder to: `C:\xampp\htdocs\navkar-qr-manager\php-backend\`
- Access at: `http://localhost/navkar-qr-manager/php-backend`

**Option B: cPanel Hosting (live)**
- Upload `php-backend/` contents to `public_html/api/` (or wherever your PHP folder is)
- Make sure `.htaccess` is uploaded (it may be hidden — enable "Show hidden files")
- In cPanel: Go to MySQL Databases → create database, user, and assign permissions
- Import `schema_mysql.sql` via phpMyAdmin

---

### Step 5: Configure Frontend

1. Copy `frontend/.env.example` to `frontend/.env`
2. Edit `.env`:
   ```
   VITE_API_URL=https://yourdomain.com/api
   ```
3. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
4. Upload the `frontend/dist/` folder contents to your web server's public folder

---

## 🔑 API ENDPOINTS

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login` | Login — returns JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile / change password |
| GET | `/api/qrcodes` | List QR codes (paginated) |
| POST | `/api/qrcodes` | Create QR code |
| GET | `/api/qrcodes/:id` | Get single QR |
| PUT | `/api/qrcodes/:id` | Update QR |
| DELETE | `/api/qrcodes/:id` | Delete QR |
| GET | `/api/qrcodes/:id/generate-image` | Download QR image (PNG/SVG) |
| GET | `/api/qrcodes/:id/scans` | Scan history |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/daily?days=30` | Daily chart data |
| GET | `/api/analytics/top-products` | Top scanned products |
| GET | `/api/analytics/devices` | Device breakdown |
| GET | `/api/analytics/countries` | Country breakdown |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/templates` | List templates |
| POST | `/api/bulk/upload` | Upload CSV/Excel |
| GET | `/api/bulk/jobs/:id` | Check upload job status |
| GET | `/api/bulk/template` | Download CSV template |
| GET | `/p/:qrId` | **QR redirect** (NP001 → product URL) |
| GET | `/health` | Health check |

---

## 🔐 Authentication

All API endpoints (except `/api/auth/login` and `/p/:qrId`) require:
```
Authorization: Bearer <jwt_token>
```

The token is returned from `/api/auth/login` and stored in `localStorage` by the frontend.

---

## ⚠️ Common Issues

**"Table not found" error:**
→ Make sure you imported `schema_mysql.sql` into phpMyAdmin

**"Access denied" error:**
→ Check `DB_USER` and `DB_PASS` in `config.php`

**QR codes not generating images:**
→ Make sure `php-backend/lib/phpqrcode/qrlib.php` exists
→ Make sure PHP has the `GD` extension enabled (check phpinfo())

**CORS error in browser:**
→ Add your frontend URL to `ALLOWED_ORIGINS` in `config.php`

**".htaccess not working":**
→ Make sure Apache `mod_rewrite` is enabled
→ In cPanel, mod_rewrite is enabled by default

---

## 📞 Default Credentials

After importing the database:
- **Email:** `admin@navkarplywood.com`  
- **Password:** `password`
- ⚠️ **Change this immediately!**

To create a new hash for your password, run this PHP snippet:
```php
echo password_hash('your_new_password', PASSWORD_BCRYPT, ['cost' => 12]);
```
Then update it in MySQL:
```sql
UPDATE users SET password_hash = 'your_hash_here' WHERE email = 'admin@navkarplywood.com';
```
