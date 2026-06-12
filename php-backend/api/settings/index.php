<?php
// api/settings/index.php — App settings CRUD
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

$user   = JWT::requireAuth();
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// GET — return all settings or one
if ($method === 'GET') {
    $key = $_GET['key'] ?? '';
    if ($key) {
        $s = $db->prepare("SELECT setting_value FROM settings WHERE setting_key=? LIMIT 1");
        $s->execute([$key]);
        $v = $s->fetchColumn();
        Response::json(['key' => $key, 'value' => $v ?: null]);
    }
    // Return all as object
    $rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $out  = [];
    foreach ($rows as $r) $out[$r['setting_key']] = $r['setting_value'];
    Response::json($out);
}

// POST — upsert a setting
if ($method === 'POST') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $key   = trim($body['key']   ?? $_GET['key'] ?? '');
    $value = trim($body['value'] ?? '');

    if (!$key) Response::error('Setting key required', 400);

    // Whitelist of allowed settings
    $allowed = ['qr_prefix','qr_base_url','company_name','company_logo_url','theme_default'];
    if (!in_array($key, $allowed)) Response::error('Unknown setting key', 400);

    $db->prepare("
        INSERT INTO settings (setting_key, setting_value, updated_at) VALUES (?,?,NOW())
        ON DUPLICATE KEY UPDATE setting_value=?, updated_at=NOW()
    ")->execute([$key, $value, $value]);

    Response::json(['message' => 'Setting saved', 'key' => $key, 'value' => $value]);
}

Response::error('Method not allowed', 405);
