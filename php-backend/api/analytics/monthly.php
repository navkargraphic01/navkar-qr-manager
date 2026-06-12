<?php
// ============================================================
// GET /api/analytics/monthly.php?months=12
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user   = authenticate();
$db     = db();
$months = max(1, min(24, (int) query('months', 12)));

$stmt = $db->prepare("
    SELECT DATE_FORMAT(scanned_at, '%Y-%m-01') AS scan_month,
           COUNT(*)                             AS scan_count,
           COUNT(DISTINCT qr_code_id)           AS unique_qr_count
    FROM scans
    WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(scanned_at, '%Y-%m-01')
    ORDER BY scan_month DESC
    LIMIT ?
");
$stmt->execute([$months, $months]);
Response::success($stmt->fetchAll());
