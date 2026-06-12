<?php
// api/analytics/trend.php — Daily scan counts for chart
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db   = db();
$days = max(7, min(365, (int)($_GET['days'] ?? 30)));

$stmt = $db->prepare("
    SELECT DATE(scanned_at) AS d, COUNT(*) AS cnt
    FROM scans
    WHERE scanned_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(scanned_at)
    ORDER BY d ASC
");
$stmt->execute([$days]);
$rows = $stmt->fetchAll();

// Build full date range with 0-fill
$map   = [];
foreach ($rows as $r) $map[$r['d']] = (int)$r['cnt'];

$labels = []; $values = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $date     = date('Y-m-d', strtotime("-{$i} days"));
    $labels[] = date('M j', strtotime($date));
    $values[] = $map[$date] ?? 0;
}

Response::json(['labels' => $labels, 'values' => $values, 'days' => $days]);
