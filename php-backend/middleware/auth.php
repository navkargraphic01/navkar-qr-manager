<?php
// ============================================================
// AUTH MIDDLEWARE - Verify JWT token from Authorization header
// Include this at the top of any protected API file
// ============================================================
require_once __DIR__ . '/../lib/JWT.php';
require_once __DIR__ . '/../lib/Response.php';
require_once __DIR__ . '/../config/database.php';

/**
 * Authenticate the request. Returns user array or exits with 401.
 */
function authenticate(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
        ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '');

    $token = null;
    if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
        $token = substr($authHeader, 7);
    } else {
        $token = $_COOKIE['navkar_auth'] ?? null;
    }

    if (!$token) {
        Response::unauthorized('Missing or invalid Authorization token');
    }

    try {
        $payload = JWT::decode($token);
    } catch (Exception $e) {
        Response::unauthorized('Invalid or expired token: ' . $e->getMessage());
    }

    // Fetch user from DB
    $db = db();
    $stmt = $db->prepare("SELECT id, email, full_name, role, company, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$payload['user_id'] ?? '']);
    $user = $stmt->fetch();

    if (!$user) {
        Response::unauthorized('User not found or inactive');
    }

    return $user;
}

/**
 * Require admin role
 */
function require_admin(array $user): void {
    if ($user['role'] !== 'admin') {
        Response::forbidden('Admin access required');
    }
}
