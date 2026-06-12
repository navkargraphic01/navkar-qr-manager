<?php
// api/auth/register.php — Register a new admin user
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';
require_once __DIR__ . '/../../lib/RateLimit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$key  = 'register:' . $ip;
if (!RateLimit::check($key, 3, 3600)) {
    Response::error('Too many registration attempts. Try again later.', 429);
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$email = strtolower(trim($body['email'] ?? ''));
$pass  = $body['password']  ?? '';
$name  = trim($body['full_name'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Valid email required', 400);
if (strlen($pass) < 8) Response::error('Password must be at least 8 characters', 400);
if (!$name) Response::error('Full name is required', 400);

$db   = db();

// Check if user exists
$stmt = $db->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
$stmt->execute([$email]);
if ($stmt->fetch()) Response::error('An account with this email already exists', 409);

// Check if any admin exists (first user becomes admin)
$adminCount = $db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
$role = $adminCount == 0 ? 'admin' : 'user';

$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
$id   = bin2hex(random_bytes(16));

$ins = $db->prepare("
    INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at)
    VALUES (?,?,?,?,?,1,NOW())
");
$ins->execute([$id, $email, $hash, $name, $role]);

// Generate token
$token = JWT::encode([
    'user_id' => $id,
    'email'   => $email,
    'role'    => $role,
], 86400);

RateLimit::reset($key);
http_response_code(201);
Response::json([
    'access_token' => $token,
    'user'         => ['id' => $id, 'email' => $email, 'full_name' => $name, 'role' => $role],
    'message'      => 'Account created successfully',
]);
