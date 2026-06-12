<?php
// api/auth/change_password.php — Change authenticated user's password
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$user = JWT::requireAuth();
$db   = db();
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$current = $body['current_password'] ?? '';
$new     = $body['new_password']     ?? '';

if (!$current || !$new) Response::error('Both current and new password are required', 400);
if (strlen($new) < 8) Response::error('New password must be at least 8 characters', 400);

// Load current hash
$stmt = $db->prepare("SELECT password_hash FROM users WHERE id=? LIMIT 1");
$stmt->execute([$user['user_id']]);
$row = $stmt->fetch();
if (!$row) Response::error('User not found', 404);

if (!password_verify($current, $row['password_hash'])) {
    Response::error('Current password is incorrect', 401);
}

$newHash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
$db->prepare("UPDATE users SET password_hash=? WHERE id=?")->execute([$newHash, $user['user_id']]);

Response::json(['message' => 'Password updated successfully']);
