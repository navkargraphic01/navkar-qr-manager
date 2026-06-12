<?php
// api/analytics/countries.php — Country breakdown stats
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db    = db();
$days  = max(0, (int)($_GET['days'] ?? 30));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));

if ($days > 0) {
    $stmt = $db->prepare("
        SELECT COALESCE(country_name, country_code, 'Unknown') AS country_name,
               country_code, COUNT(*) AS count
        FROM scans
        WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY country_code, country_name
        ORDER BY count DESC LIMIT ?
    ");
    $stmt->execute([$days, $limit]);
} else {
    $stmt = $db->prepare("
        SELECT COALESCE(country_name, country_code, 'Unknown') AS country_name,
               country_code, COUNT(*) AS count
        FROM scans
        GROUP BY country_code, country_name
        ORDER BY count DESC LIMIT ?
    ");
    $stmt->execute([$limit]);
}

Response::json($stmt->fetchAll());
