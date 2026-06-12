<?php
// api/analytics/recent_scans.php — Recent scan events
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db    = db();
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));

$stmt = $db->prepare("
    SELECT s.id, q.qr_id, q.product_name,
           s.device_type, s.country_code, s.country_name,
           s.city, s.browser, s.os,
           s.scanned_at
    FROM scans s
    JOIN qr_codes q ON q.id = s.qr_code_id
    ORDER BY s.scanned_at DESC
    LIMIT ?
");
$stmt->execute([$limit]);
$scans = $stmt->fetchAll();

Response::json(['scans' => $scans, 'count' => count($scans)]);
