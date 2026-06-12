<?php
// ============================================================
// GET /api/analytics/daily.php?days=30 — Daily scan chart
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();
$days = max(1, min(365, (int) query('days', 30)));

// Build empty date array
$result = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $date           = date('Y-m-d', strtotime("-$i days"));
    $result[$date]  = 0;
}

// Fetch DB data
$stmt = $db->prepare("
    SELECT DATE(scanned_at) AS scan_date, COUNT(*) AS cnt
    FROM scans
    WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(scanned_at)
");
$stmt->execute([$days]);
foreach ($stmt->fetchAll() as $row) {
    if (isset($result[$row['scan_date']])) {
        $result[$row['scan_date']] = (int) $row['cnt'];
    }
}

$data = array_map(fn($date, $count) => ['date' => $date, 'count' => $count], array_keys($result), $result);

Response::success($data);
