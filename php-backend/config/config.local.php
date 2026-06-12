<?php
// ============================================================
// LOCAL DEVELOPMENT CONFIG (XAMPP)
// ============================================================
// Copy this file to config.php ONLY when testing locally
// For live server, use the main config.php
// ============================================================

define('APP_NAME',    'Navkar QR Manager');
define('APP_VERSION', '2.0.0');
define('APP_ENV',     'development');

// XAMPP Database (default settings)
define('DB_HOST',    'localhost');
define('DB_NAME',    'navkar_qr');
define('DB_USER',    'root');
define('DB_PASS',    '');              // XAMPP default = blank password
define('DB_CHARSET', 'utf8mb4');

// JWT
define('JWT_SECRET',    'local_dev_secret_navkar_2024_testing_only!');
define('JWT_EXPIRY',    60 * 60 * 24);
define('JWT_ALGORITHM', 'HS256');

// QR URL for local testing
define('QR_BASE_URL',   'http://localhost/qr-manager');
define('QR_PREFIX',     'NP');
define('QR_IMAGE_SIZE', 400);

// CORS for local React dev server
define('ALLOWED_ORIGINS', ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173']);

// Upload
define('MAX_UPLOAD_MB', 10);
define('UPLOAD_DIR',    __DIR__ . '/../uploads/');

// Geo (disable in local to avoid external calls)
define('GEO_API_URL', '');

function apply_cors_headers(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost:5173");
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=UTF-8");
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
