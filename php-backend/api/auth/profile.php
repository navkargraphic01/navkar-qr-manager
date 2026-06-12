<?php
// ============================================================
// PUT /api/auth/profile — Update user profile
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();

if (!is_method('PUT') && !is_method('PATCH')) Response::error('Method not allowed', 405);

$user = authenticate();
$db   = db();

$full_name  = body('full_name');
$avatar_url = body('avatar_url');

$fields = [];
$params = [];

if ($full_name !== null) { $fields[] = 'full_name = ?';  $params[] = trim($full_name); }
if ($avatar_url !== null){ $fields[] = 'avatar_url = ?'; $params[] = $avatar_url; }

// Change password
$newPassword = body('new_password');
$curPassword = body('current_password');
if ($newPassword) {
    if (!$curPassword) Response::error('Current password required to change password', 400);
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if (!password_verify($curPassword, $row['password_hash'])) {
        Response::error('Current password is incorrect', 400);
    }
    if (strlen($newPassword) < 6) Response::error('New password must be at least 6 characters', 400);
    $fields[] = 'password_hash = ?';
    $params[] = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
}

if (empty($fields)) {
    Response::error('Nothing to update', 400);
}

$params[] = $user['id'];
$sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
$db->prepare($sql)->execute($params);

// Return updated user
$stmt = $db->prepare("SELECT id, email, full_name, avatar_url, role, company, is_active, last_login, created_at FROM users WHERE id = ?");
$stmt->execute([$user['id']]);
$updated = $stmt->fetch();

Response::success($updated);
