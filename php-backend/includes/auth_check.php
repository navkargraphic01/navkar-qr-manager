<?php
// ============================================================
// AUTH CHECK — Cookie-based Page Authentication Guard
// Include at the top of every protected PHP page
// ============================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/JWT.php';
require_once __DIR__ . '/../lib/Response.php';

// ─── Detect web base path automatically ──────────────────
if (!defined('SITE_BASE')) {
    $docRoot    = rtrim(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '/');
    $scriptFile = str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME']);
    $pagesDir   = rtrim(dirname($scriptFile), '/');
    $webDir     = str_replace($docRoot, '', $pagesDir);
    // pages/ is one level below the backend root
    $backendPath = dirname($webDir);
    define('SITE_BASE', ($backendPath === '/' || $backendPath === '\\' || $backendPath === '') ? '' : $backendPath);
}

if (!defined('LOGIN_URL'))    define('LOGIN_URL',    SITE_BASE . '/login');
if (!defined('DASHBOARD_URL')) define('DASHBOARD_URL', SITE_BASE . '/dashboard');

// ─── Get token from cookie or Authorization header ───────
$token = $_COOKIE['navkar_auth'] ?? null;

// Also accept Authorization Bearer for API-style requests from same origin
if (!$token) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($auth, 'Bearer ')) {
        $token = substr($auth, 7);
    }
}

if (!$token) {
    header('Location: ' . LOGIN_URL);
    exit();
}

// ─── Validate JWT ─────────────────────────────────────────
try {
    $payload = JWT::decode($token);
} catch (Exception $e) {
    // Expired or invalid
    setcookie('navkar_auth', '', time() - 3600, '/', '', false, false);
    header('Location: ' . LOGIN_URL);
    exit();
}

// ─── Load user from DB ───────────────────────────────────
try {
    $db   = db();
    $stmt = $db->prepare(
        "SELECT id, email, full_name, role, company, is_active
         FROM users WHERE id = ? AND is_active = 1 LIMIT 1"
    );
    $stmt->execute([$payload['user_id'] ?? '']);
    $currentUser = $stmt->fetch();
} catch (Exception $e) {
    $currentUser = null;
}

if (!$currentUser) {
    setcookie('navkar_auth', '', time() - 3600, '/', '', false, false);
    header('Location: ' . LOGIN_URL);
    exit();
}

// ─── Store token for JS consumption ──────────────────────
// The token is already in a readable cookie (navkar_auth)
// JS can also read it for AJAX calls
define('CURRENT_USER', $currentUser);
define('CURRENT_TOKEN', $token);
define('IS_ADMIN', $currentUser['role'] === 'admin');

// ─── Helper for page metadata ─────────────────────────────
if (!isset($pageTitle)) $pageTitle = 'Dashboard';
if (!isset($pageScript)) $pageScript = '';
