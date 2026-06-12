<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
authenticate();
$db = db();
$id = query('id', '');

if (!$id) Response::error('Missing QR code ID', 400);

// Look up UUID by qr_id or id
$stmt = $db->prepare("SELECT id FROM qr_codes WHERE id = ? OR qr_id = ?");
$stmt->execute([$id, $id]);
$qr = $stmt->fetch();
if (!$qr) Response::not_found('QR code not found');
$uuid = $qr['id'];

$histStmt = $db->prepare("
    SELECT h.*, u.full_name AS changed_by_name
    FROM url_history h
    LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.qr_code_id = ?
    ORDER BY h.changed_at DESC
    LIMIT 50
");
$histStmt->execute([$uuid]);
Response::json(['history' => $histStmt->fetchAll()]);
