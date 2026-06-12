<?php
// ============================================================
// POST /api/auth/login
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/JWT.php';
require_once __DIR__ . '/../../lib/Response.php';

apply_cors_headers();

if (!is_method('POST')) Response::error('Method not allowed', 405);

$email    = trim(body('email', ''));
$password = body('password', '');

if (empty($email) || empty($password)) {
    Response::error('Email and password are required', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('Invalid email format', 400);
}

$db   = db();
$stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
$stmt->execute([strtolower($email)]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    Response::unauthorized('Invalid email or password');
}

// Update last login
$db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

// Generate JWT
$token = JWT::encode([
    'user_id' => $user['id'],
    'email'   => $user['email'],
    'role'    => $user['role'],
]);

unset($user['password_hash']);

Response::json([
    'access_token' => $token,
    'token_type'   => 'Bearer',
    'expires_in'   => JWT_EXPIRY,
    'user'         => $user,
]);
