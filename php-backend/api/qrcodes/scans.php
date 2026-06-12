<?php
// ============================================================
// GET /api/qrcodes/scans.php?id=:id — Get scan history for a QR
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user  = authenticate();
$db    = db();

$id    = query('id', '');
$page  = max(1, (int) query('page', 1));
$limit = min(100, max(1, (int) query('limit', 50)));
$offset= ($page - 1) * $limit;

if (!$id) Response::error('Missing QR code ID', 400);

$countStmt = $db->prepare("SELECT COUNT(*) FROM scans WHERE qr_code_id = ?");
$countStmt->execute([$id]);
$total = (int) $countStmt->fetchColumn();

$stmt = $db->prepare("
    SELECT * FROM scans
    WHERE qr_code_id = ?
    ORDER BY scanned_at DESC
    LIMIT ? OFFSET ?
");
$stmt->execute([$id, $limit, $offset]);
$rows = $stmt->fetchAll();

Response::paginated($rows, $total, $page, $limit);
