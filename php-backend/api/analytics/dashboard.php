<?php
// ============================================================
// GET /api/analytics/dashboard.php — Dashboard summary stats
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();

// Total QR codes
$total_qr   = (int) $db->query("SELECT COUNT(*) FROM qr_codes")->fetchColumn();
$active_qr  = (int) $db->query("SELECT COUNT(*) FROM qr_codes WHERE status = 'active'")->fetchColumn();
$total_scans= (int) $db->query("SELECT COUNT(*) FROM scans")->fetchColumn();

$today = (int) $db->query("SELECT COUNT(*) FROM scans WHERE DATE(scanned_at) = CURDATE()")->fetchColumn();
$week  = (int) $db->query("SELECT COUNT(*) FROM scans WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
$month = (int) $db->query("SELECT COUNT(*) FROM scans WHERE scanned_at >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();

// Top 5 QR codes
$stmt = $db->query("
    SELECT q.qr_id, q.product_name, q.scan_count
    FROM qr_codes q
    ORDER BY q.scan_count DESC
    LIMIT 5
");
$top_qr = $stmt->fetchAll();

Response::success([
    'total_qr_codes'   => $total_qr,
    'active_qr_codes'  => $active_qr,
    'total_scans'      => $total_scans,
    'scans_today'      => $today,
    'scans_this_week'  => $week,
    'scans_this_month' => $month,
    'top_qr'           => $top_qr,
]);
