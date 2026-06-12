<?php
// api/analytics/summary.php — Dashboard + Analytics summary stats
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

JWT::requireAuth();
$db   = db();
$days = max(1, min(365, (int)($_GET['days'] ?? 0)));

// Total stats
$totalQR    = $db->query("SELECT COUNT(*) FROM qr_codes")->fetchColumn();
$activeQR   = $db->query("SELECT COUNT(*) FROM qr_codes WHERE status='active'")->fetchColumn();
$totalScans = $db->query("SELECT COUNT(*) FROM scans")->fetchColumn();
$todayScans = $db->query("SELECT COUNT(*) FROM scans WHERE DATE(scanned_at)=CURDATE()")->fetchColumn();

$out = [
    'total_qr'    => (int)$totalQR,
    'active_qr'   => (int)$activeQR,
    'total_scans' => (int)$totalScans,
    'today_scans' => (int)$todayScans,
];

// Period-specific stats (for analytics page)
if ($days > 0) {
    $periodScans = $db->prepare("SELECT COUNT(*) FROM scans WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $periodScans->execute([$days]);
    $out['period_scans'] = (int)$periodScans->fetchColumn();

    $uniqueQR = $db->prepare("SELECT COUNT(DISTINCT qr_code_id) FROM scans WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $uniqueQR->execute([$days]);
    $out['unique_qr'] = (int)$uniqueQR->fetchColumn();

    $mobile = $db->prepare(
        "SELECT COUNT(*) FROM scans WHERE device_type IN ('mobile','tablet') AND scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)"
    );
    $mobile->execute([$days]);
    $mCount = (int)$mobile->fetchColumn();
    $out['mobile_pct'] = $out['period_scans'] > 0
        ? round($mCount / $out['period_scans'] * 100) : 0;

    $countries = $db->prepare(
        "SELECT COUNT(DISTINCT country_code) FROM scans WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)"
    );
    $countries->execute([$days]);
    $out['countries'] = (int)$countries->fetchColumn();
}

Response::json($out);
