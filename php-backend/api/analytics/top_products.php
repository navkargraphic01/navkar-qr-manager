<?php
// GET /api/analytics/top_products.php?limit=10
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';
apply_cors_headers();
$user  = authenticate();
$db    = db();
$limit = max(1, min(50, (int) query('limit', 10)));
$stmt  = $db->prepare("
    SELECT q.qr_id, q.product_name, q.product_code, q.status,
           q.scan_count, q.last_scanned_at
    FROM qr_codes q
    ORDER BY q.scan_count DESC
    LIMIT ?
");
$stmt->execute([$limit]);
Response::success($stmt->fetchAll());
