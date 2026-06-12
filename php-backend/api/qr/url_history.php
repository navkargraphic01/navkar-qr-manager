<?php
// api/qr/url_history.php — GET URL change history for a QR code
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db   = db();
$qrId = $_GET['id'] ?? '';
if (!$qrId) Response::error('QR ID required', 400);

// Get QR code DB id
$stmt = $db->prepare("SELECT id FROM qr_codes WHERE qr_id=? LIMIT 1");
$stmt->execute([$qrId]);
$qr = $stmt->fetch();
if (!$qr) Response::error('QR code not found', 404);

$hist = $db->prepare("
    SELECT h.url, h.changed_at, u.full_name AS changed_by_name
    FROM qr_url_history h
    LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.qr_code_id = ?
    ORDER BY h.changed_at DESC
    LIMIT 50
");
$hist->execute([$qr['id']]);
Response::json(['history' => $hist->fetchAll()]);
