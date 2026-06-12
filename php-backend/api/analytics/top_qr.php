<?php
// api/analytics/top_qr.php — Top QR codes by scan count
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db    = db();
$days  = max(0, (int)($_GET['days'] ?? 0));
$limit = max(1, min(50, (int)($_GET['limit'] ?? 5)));

if ($days > 0) {
    $stmt = $db->prepare("
        SELECT q.qr_id, q.product_name, COUNT(s.id) AS scan_count
        FROM qr_codes q
        LEFT JOIN scans s ON s.qr_code_id = q.id AND s.scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY q.id
        ORDER BY scan_count DESC
        LIMIT ?
    ");
    $stmt->execute([$days, $limit]);
} else {
    $stmt = $db->prepare("
        SELECT qr_id, product_name, scan_count
        FROM qr_codes
        ORDER BY scan_count DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
}

Response::json($stmt->fetchAll());
