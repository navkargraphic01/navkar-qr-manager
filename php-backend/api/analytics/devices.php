<?php
// api/analytics/devices.php — Device breakdown stats
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db   = db();
$days = max(0, (int)($_GET['days'] ?? 30));

if ($days > 0) {
    $stmt = $db->prepare("
        SELECT device_type, COUNT(*) AS count
        FROM scans
        WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY device_type ORDER BY count DESC
    ");
    $stmt->execute([$days]);
} else {
    $stmt = $db->query("
        SELECT device_type, COUNT(*) AS count FROM scans
        GROUP BY device_type ORDER BY count DESC
    ");
}
$rows = $stmt->fetchAll();

// Normalize device types
$out = [];
foreach ($rows as $r) {
    $type = strtolower($r['device_type'] ?? 'Unknown');
    if (in_array($type, ['mobile','smartphone'])) $type = 'Mobile';
    elseif ($type === 'tablet') $type = 'Tablet';
    elseif (in_array($type, ['desktop','computer'])) $type = 'Desktop';
    else $type = ucfirst($type ?: 'Unknown');

    if (isset($out[$type])) $out[$type] += (int)$r['count'];
    else $out[$type] = (int)$r['count'];
}

arsort($out);
Response::json(array_map(fn($dt, $c) => ['device_type' => $dt, 'count' => $c], array_keys($out), array_values($out)));
