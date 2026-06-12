<?php
// GET /api/bulk/template.php — Download Excel template
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();

// Generate a simple CSV template (works everywhere, no library needed)
$filename = 'navkar_qr_upload_template.csv';
header('Content-Type: text/csv');
header("Content-Disposition: attachment; filename=\"$filename\"");

$out = fopen('php://output', 'w');
fputcsv($out, ['Product Name', 'Product Code', 'Destination URL', 'Category', 'Description', 'Batch Number']);
fputcsv($out, ['Navkar Premium Plywood', 'NPL-001', 'https://navkarplywood.com/products/npl-001', 'Plywood', 'High quality plywood', 'BATCH-2024-01']);
fputcsv($out, ['BWR Plywood 710', 'BWR-710', 'https://navkarplywood.com/products/bwr-710', 'Plywood', 'Boiling water resistant', 'BATCH-2024-02']);
fclose($out);
exit();
