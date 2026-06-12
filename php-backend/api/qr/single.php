<?php
// api/qr/single.php — GET/PUT/DELETE single QR code
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

$user   = JWT::requireAuth();
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];
$qrId   = $_GET['id'] ?? '';

if (!$qrId) Response::error('QR ID required', 400);

// Load the QR code
$stmt = $db->prepare("SELECT * FROM qr_codes WHERE qr_id = ? LIMIT 1");
$stmt->execute([$qrId]);
$qr = $stmt->fetch();
if (!$qr) Response::error('QR code not found', 404);

// ─── GET ──────────────────────────────────────────────────
if ($method === 'GET') {
    // Get recent scan stats
    $lastScan = $db->prepare("SELECT MAX(scanned_at) FROM scans WHERE qr_code_id=?");
    $lastScan->execute([$qr['id']]);
    $qr['last_scanned_at'] = $lastScan->fetchColumn();
    Response::json(['data' => $qr]);
}

// ─── PUT — Update ─────────────────────────────────────────
if ($method === 'PUT' || $method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $name = trim($body['product_name']    ?? $qr['product_name']);
    $url  = trim($body['destination_url'] ?? $qr['destination_url']);

    if (!$name) Response::error('Product name is required', 400);
    if ($url && !filter_var($url, FILTER_VALIDATE_URL)) Response::error('Invalid URL', 400);

    // Track URL change
    if ($url && $url !== $qr['destination_url']) {
        try {
            $db->prepare("INSERT INTO qr_url_history (qr_code_id, url, changed_by, changed_at) VALUES (?,?,?,NOW())")
               ->execute([$qr['id'], $url, $user['user_id'] ?? null]);
        } catch (\Exception $e) {}
    }

    $stmt = $db->prepare("
        UPDATE qr_codes SET
          product_name    = ?,
          product_code    = ?,
          destination_url = ?,
          category_id     = ?,
          description     = ?,
          template_id     = ?,
          status          = ?,
          updated_at      = NOW()
        WHERE id = ?
    ");
    $stmt->execute([
        $name,
        $body['product_code'] ?? $qr['product_code'],
        $url ?: $qr['destination_url'],
        $body['category_id']  ?? $qr['category_id'],
        $body['description']  ?? $qr['description'],
        $body['template_id']  ?? $qr['template_id'],
        $body['status']       ?? $qr['status'],
        $qr['id'],
    ]);

    Response::json(['message' => 'Updated', 'qr_id' => $qrId]);
}

// ─── DELETE ───────────────────────────────────────────────
if ($method === 'DELETE') {
    // Delete scans first
    $db->prepare("DELETE FROM scans WHERE qr_code_id=?")->execute([$qr['id']]);
    try { $db->prepare("DELETE FROM qr_url_history WHERE qr_code_id=?")->execute([$qr['id']]); } catch (\Exception $e) {}
    $db->prepare("DELETE FROM qr_codes WHERE id=?")->execute([$qr['id']]);
    Response::json(['message' => 'Deleted', 'qr_id' => $qrId]);
}

Response::error('Method not allowed', 405);
