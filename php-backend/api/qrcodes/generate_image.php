<?php
// ============================================================
// GET /api/qrcodes/generate_image.php?id=:id&format=png|svg&size=400
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/QRCodeGenerator.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();

$id     = query('id', '');
$format = strtolower(query('format', 'png'));
$size   = max(100, min(1000, (int) query('size', 400)));
$dark   = query('dark', '#000000');
$light  = query('light', '#FFFFFF');

if (!$id) Response::error('Missing QR code ID', 400);

$stmt = $db->prepare("SELECT qr_id, product_name FROM qr_codes WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$qrCode = $stmt->fetch();
if (!$qrCode) Response::not_found('QR code not found');

$qrUrl = QR_BASE_URL . '/p/' . $qrCode['qr_id'];

if ($format === 'svg') {
    header('Content-Type: image/svg+xml');
    header('Content-Disposition: inline; filename="' . $qrCode['qr_id'] . '.svg"');
    echo QRCodeGenerator::toSVG($qrUrl, $size, $dark, $light);
    exit();
}

// Default: PNG
$png = QRCodeGenerator::toPNG($qrUrl, $size, $dark, $light);
header('Content-Type: image/png');
header('Content-Disposition: attachment; filename="' . $qrCode['qr_id'] . '.png"');
header('Content-Length: ' . strlen($png));
echo $png;
exit();
