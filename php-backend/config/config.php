<?php
// ============================================================
// NAVKAR QR MANAGER - Application Configuration
// ============================================================
// SITE: navkarplywood.in
// ============================================================

define('APP_NAME',    'Navkar QR Manager');
define('APP_VERSION', '2.0.0');

// ── ENVIRONMENT ──────────────────────────────────────────────
// 'development' = XAMPP/localhost
// 'production'  = live server navkarplywood.in
define('APP_ENV', getenv('APP_ENV') ?: 'production');

// ============================================================
// ⚠️  DATABASE — FILL IN YOUR VALUES HERE
// ============================================================
// LOCAL (XAMPP):
//   DB_HOST = localhost
//   DB_USER = root
//   DB_PASS = (blank/empty)
//   DB_NAME = navkar_qr
//
// LIVE (navkarplywood.in / cPanel):
//   DB_HOST = localhost  (usually same)
//   DB_USER = navkar_dbuser  (jo aapne cPanel mein banaya)
//   DB_PASS = aapka_strong_password
//   DB_NAME = navkar_navkar_qr  (cPanel format: cpaneluser_dbname)
// ============================================================
define('DB_HOST',    getenv('DB_HOST')    ?: '127.0.0.1');
define('DB_NAME',    getenv('DB_NAME')    ?: 'navkar_qr');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

// ============================================================
// ⚠️  JWT SECRET KEY — CHANGE THIS!
// Yeh ek secret password hai — kisi ko mat batao
// Koi bhi random long string use karo
// ============================================================
define('JWT_SECRET',    getenv('JWT_SECRET') ?: 'NavkarPlywood@navkarplywood.in_SecretKey_2024!#XyZ');
define('JWT_EXPIRY',    60 * 60 * 24);   // 24 hours
define('JWT_ALGORITHM', 'HS256');

// ============================================================
// QR CODE URL SETTINGS
// Jab QR code scan hoga, yeh URL pe redirect karega
// Format: https://navkarplywood.in/p/NP001
// ============================================================
// LOCAL: http://localhost/qr-manager
// LIVE:  https://navkarplywood.in
define('QR_BASE_URL',   getenv('QR_BASE_URL') ?: 'https://navkarplywood.in');
define('QR_PREFIX',     'NP');
define('QR_IMAGE_SIZE', 400); // pixels

// ============================================================
// CORS — Frontend Domains (SIRF INHE API ACCESS MILEGA)
// ============================================================
define('ALLOWED_ORIGINS', explode(',', getenv('CORS_ORIGINS') ?:
    'http://localhost:5173,http://localhost,https://navkarplywood.in,https://www.navkarplywood.in'
));

// ============================================================
// FILE UPLOAD
// ============================================================
define('MAX_UPLOAD_MB', 10);
define('UPLOAD_DIR',    __DIR__ . '/../uploads/');

// ============================================================
// GEO IP — Analytics mein country dikhane ke liye (FREE)
// Band karne ke liye: '' empty string karo
// ============================================================
define('GEO_API_URL', 'http://ip-api.com/json/');

// ============================================================
// CORS HEADERS — Auto-applied
// ============================================================
function apply_cors_headers(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . (ALLOWED_ORIGINS[0] ?? '*'));
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
