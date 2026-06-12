<?php
// ============================================================
// MAIN ENTRY / ROUTER — Navkar QR Manager v2.0
// Serves BOTH HTML pages and API endpoints
// ============================================================
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/lib/Response.php';

// ─── Set SITE_BASE constant ────────────────────────────────
if (php_sapi_name() === 'cli-server') {
    $_scriptDir = '';
} else {
    $_scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    if ($_scriptDir === '/' || $_scriptDir === '\\') $_scriptDir = '';
}
define('SITE_BASE', $_scriptDir);

apply_cors_headers();

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Strip subfolder prefix (XAMPP: /qr-manager, Live: /)
if (SITE_BASE !== '' && strpos($uri, SITE_BASE) === 0) {
    $uri = substr($uri, strlen(SITE_BASE));
}
$uri = $uri ?: '/';

// ─── Health Check ─────────────────────────────────────────
if ($uri === '' || $uri === '/health' || $uri === '/api/health') {
    Response::json([
        'status'    => 'healthy',
        'timestamp' => date('c'),
        'version'   => '2.0.0',
        'service'   => 'navkar-qr-manager-php',
    ]);
}

// ─── QR Public Redirect ────────────────────────────────────
if (preg_match('#^/p/([A-Za-z0-9\-]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/p/index.php';
    exit();
}

// ===========================================================
// PAGE ROUTES — Serve HTML pages (SSR)
// ===========================================================

if ($uri === '/' || $uri === '/login') {
    require __DIR__ . '/pages/login.php'; exit();
}
if ($uri === '/logout') {
    require __DIR__ . '/pages/logout.php'; exit();
}
if ($uri === '/dashboard') {
    require __DIR__ . '/pages/dashboard.php'; exit();
}

// QR Codes pages
if ($uri === '/qr-codes') {
    require __DIR__ . '/pages/qr-codes.php'; exit();
}
if ($uri === '/qr-codes/create') {
    require __DIR__ . '/pages/qr-create.php'; exit();
}
if (preg_match('#^/qr-codes/([A-Za-z0-9\-]+)/edit$#', $uri, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/pages/qr-edit.php'; exit();
}

// Analytics
if ($uri === '/analytics') {
    require __DIR__ . '/pages/analytics.php'; exit();
}

// Design Studio
if ($uri === '/design-studio') {
    require __DIR__ . '/pages/design-studio.php'; exit();
}

// Bulk Upload
if ($uri === '/bulk-upload') {
    require __DIR__ . '/pages/bulk-upload.php'; exit();
}

// Settings
if ($uri === '/settings') {
    require __DIR__ . '/pages/settings.php'; exit();
}

// ===========================================================
// API ROUTES — JSON responses
// ===========================================================

// ─── Auth ──────────────────────────────────────────────────
if ($uri === '/api/auth/login')           { require __DIR__ . '/api/auth/login.php'; exit(); }
if ($uri === '/api/auth/logout')          { require __DIR__ . '/api/auth/logout.php'; exit(); }
if ($uri === '/api/auth/register')        { require __DIR__ . '/api/auth/register.php'; exit(); }
if ($uri === '/api/auth/me')              { require __DIR__ . '/api/auth/me.php'; exit(); }
if ($uri === '/api/auth/profile')         { require __DIR__ . '/api/auth/profile.php'; exit(); }
if ($uri === '/api/auth/change-password') { require __DIR__ . '/api/auth/change_password.php'; exit(); }

// ─── QR Codes ──────────────────────────────────────────────
if ($uri === '/api/qr') {
    require __DIR__ . '/api/qrcodes/index.php'; exit();
}
// Old compat routes
if ($uri === '/api/qrcodes') {
    require __DIR__ . '/api/qrcodes/index.php'; exit();
}
if (preg_match('#^/api/qr/([A-Za-z0-9\-]+)/url-history$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/url_history.php'; exit();
}
if (preg_match('#^/api/qr/([A-Za-z0-9\-]+)/generate-image$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/generate_image.php'; exit();
}
if (preg_match('#^/api/qr/([A-Za-z0-9\-]+)/scans$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/scans.php'; exit();
}
if (preg_match('#^/api/qr/([A-Za-z0-9\-]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/single.php'; exit();
}
// Legacy qrcodes paths
if (preg_match('#^/api/qrcodes/([^/]+)/generate-image$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/generate_image.php'; exit();
}
if (preg_match('#^/api/qrcodes/([^/]+)/scans$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/scans.php'; exit();
}
if (preg_match('#^/api/qrcodes/([^/]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/qrcodes/single.php'; exit();
}

// ─── Analytics ─────────────────────────────────────────────
if ($uri === '/api/analytics/summary')       { require __DIR__ . '/api/analytics/summary.php'; exit(); }
if ($uri === '/api/analytics/trend')         { require __DIR__ . '/api/analytics/trend.php'; exit(); }
if ($uri === '/api/analytics/dashboard')     { require __DIR__ . '/api/analytics/dashboard.php'; exit(); }
if ($uri === '/api/analytics/daily')         { require __DIR__ . '/api/analytics/daily.php'; exit(); }
if ($uri === '/api/analytics/monthly')       { require __DIR__ . '/api/analytics/monthly.php'; exit(); }
if ($uri === '/api/analytics/top-qr')        { require __DIR__ . '/api/analytics/top_qr.php'; exit(); }
if ($uri === '/api/analytics/top-products')  { require __DIR__ . '/api/analytics/top_products.php'; exit(); }
if ($uri === '/api/analytics/devices')       { require __DIR__ . '/api/analytics/devices.php'; exit(); }
if ($uri === '/api/analytics/countries')     { require __DIR__ . '/api/analytics/countries.php'; exit(); }
if ($uri === '/api/analytics/recent-scans')  { require __DIR__ . '/api/analytics/recent_scans.php'; exit(); }

// ─── Categories ────────────────────────────────────────────
if ($uri === '/api/categories') { require __DIR__ . '/api/categories/index.php'; exit(); }
if (preg_match('#^/api/categories/([^/]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/categories/single.php'; exit();
}

// ─── Templates ─────────────────────────────────────────────
if ($uri === '/api/templates') { require __DIR__ . '/api/templates/index.php'; exit(); }
if (preg_match('#^/api/templates/([^/]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/templates/index.php'; exit();
}

// ─── Settings ──────────────────────────────────────────────
if ($uri === '/api/settings') { require __DIR__ . '/api/settings/index.php'; exit(); }
if (preg_match('#^/api/settings/([^/]+)$#', $uri, $m)) {
    $_GET['key'] = $m[1]; require __DIR__ . '/api/settings/index.php'; exit();
}

// ─── Bulk ──────────────────────────────────────────────────
if ($uri === '/api/bulk/upload')   { require __DIR__ . '/api/bulk/upload.php'; exit(); }
if ($uri === '/api/bulk/template') { require __DIR__ . '/api/bulk/template.php'; exit(); }
if (preg_match('#^/api/bulk/jobs/([^/]+)$#', $uri, $m)) {
    $_GET['id'] = $m[1]; require __DIR__ . '/api/bulk/job_status.php'; exit();
}

// ─── Static Assets ──────────────────────────────────────────
// Let Apache serve from assets/ — this should not be reached
// but if served via PHP, redirect
if (str_starts_with($uri, '/assets/')) {
    http_response_code(404); exit();
}

// ─── 404 ───────────────────────────────────────────────────
http_response_code(404);
if (str_starts_with($uri, '/api/')) {
    // API 404
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Route not found', 'path' => $uri]);
} else {
    // Page 404
    echo '<!DOCTYPE html><html><head><title>404 Not Found</title>
<link href="' . SITE_BASE . '/assets/css/app.css" rel="stylesheet"></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)">
<div style="text-align:center">
  <div style="font-size:72px;font-weight:900;color:var(--primary)">404</div>
  <div style="font-size:20px;font-weight:700;margin-bottom:8px">Page Not Found</div>
  <div style="color:var(--muted);margin-bottom:24px">The page you\'re looking for doesn\'t exist.</div>
  <a href="' . SITE_BASE . '/dashboard" class="btn btn-primary">Go to Dashboard</a>
</div></body></html>';
}
exit();
