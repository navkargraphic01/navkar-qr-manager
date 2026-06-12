<?php
// ============================================================
// QR REDIRECT HANDLER - /p/NP001
// This is the MOST critical file: when someone scans a QR code,
// they hit this URL. We redirect them to the product page and
// track the scan analytics.
//
// URL accessed as: https://yourdomain.com/p/NP001
// .htaccess rewrites it to: /p/index.php?id=NP001
// ============================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

header('X-Robots-Tag: noindex');

$qrId = strtoupper(trim($_GET['id'] ?? ''));

if (!$qrId) {
    redirect_to_home('No QR code specified');
}

$db = db();

// Fetch QR code
$stmt = $db->prepare("
    SELECT id, destination_url, status, product_name
    FROM qr_codes
    WHERE qr_id = ?
    LIMIT 1
");
$stmt->execute([$qrId]);
$qrCode = $stmt->fetch();

if (!$qrCode) {
    show_error_page(
        'QR Code Not Found',
        "The QR code <strong>$qrId</strong> does not exist or has been removed.",
        404
    );
}

if ($qrCode['status'] !== 'active') {
    show_error_page(
        'QR Code Inactive',
        "The product <strong>" . htmlspecialchars($qrCode['product_name']) . "</strong> is currently unavailable.",
        410
    );
}

// ── Track scan (fire and forget) ──────────────────────────────
$destUrl = $qrCode['destination_url'];

// Do redirect FIRST, then track
track_scan($db, $qrCode['id'], $qrId, $destUrl);

// Redirect with 302 (never 301 - QR URLs are dynamic!)
header('Location: ' . $destUrl, true, 302);
exit();


// ============================================================
// SCAN TRACKING
// ============================================================
function track_scan(PDO $db, string $qrCodeId, string $qrId, string $destUrl): void {
    try {
        $ua         = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $deviceType = detect_device($ua);
        $browser    = detect_browser($ua);
        $os         = detect_os($ua);

        $ip = $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? null;
        if ($ip) $ip = explode(',', $ip)[0]; // first IP if multiple

        // Geo lookup (optional - requires GEO_API_URL set)
        $geo = [];
        if ($ip && $ip !== '127.0.0.1' && $ip !== '::1' && GEO_API_URL) {
            $geoData = @file_get_contents(GEO_API_URL . urlencode($ip));
            if ($geoData) {
                $g = json_decode($geoData, true);
                if ($g && ($g['status'] ?? '') === 'success') {
                    $geo = [
                        'country'      => $g['country']     ?? null,
                        'country_code' => $g['countryCode'] ?? null,
                        'city'         => $g['city']        ?? null,
                        'region'       => $g['regionName']  ?? null,
                        'latitude'     => $g['lat']         ?? null,
                        'longitude'    => $g['lon']         ?? null,
                    ];
                }
            }
        }

        $scanId = generate_uuid();
        $db->prepare("
            INSERT INTO scans
              (id, qr_code_id, qr_id, destination_url, device_type, browser, os,
               user_agent, ip_address, country, country_code, city, region, latitude, longitude, referrer)
            VALUES (?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?)
        ")->execute([
            $scanId, $qrCodeId, $qrId, $destUrl,
            $deviceType, $browser, $os,
            substr($ua, 0, 500),
            $ip,
            $geo['country']      ?? null,
            $geo['country_code'] ?? null,
            $geo['city']         ?? null,
            $geo['region']       ?? null,
            $geo['latitude']     ?? null,
            $geo['longitude']    ?? null,
            substr($_SERVER['HTTP_REFERER'] ?? '', 0, 500) ?: null,
        ]);
    } catch (Exception $e) {
        // Silently fail — redirect already happened
        error_log('[NAVKAR QR] Scan tracking error: ' . $e->getMessage());
    }
}

function detect_device(string $ua): string {
    $ua = strtolower($ua);
    if (preg_match('/tablet|ipad|kindle|playbook/i', $ua)) return 'tablet';
    if (preg_match('/mobile|android|iphone|ipod|blackberry|windows phone/i', $ua)) return 'mobile';
    return 'desktop';
}

function detect_browser(string $ua): string {
    if (preg_match('/Edg\//i', $ua))    return 'Edge';
    if (preg_match('/OPR\//i', $ua))    return 'Opera';
    if (preg_match('/Chrome\//i', $ua)) return 'Chrome';
    if (preg_match('/Firefox\//i', $ua))return 'Firefox';
    if (preg_match('/Safari\//i', $ua)) return 'Safari';
    return 'Unknown';
}

function detect_os(string $ua): string {
    if (preg_match('/Windows NT/i', $ua))  return 'Windows';
    if (preg_match('/Mac OS X/i', $ua))    return 'macOS';
    if (preg_match('/Android/i', $ua))     return 'Android';
    if (preg_match('/iPhone|iPad/i', $ua)) return 'iOS';
    if (preg_match('/Linux/i', $ua))       return 'Linux';
    return 'Unknown';
}

function redirect_to_home(string $reason = ''): void {
    header('Location: https://navkarplywood.com', true, 302);
    exit();
}

function show_error_page(string $title, string $message, int $code): void {
    http_response_code($code);
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($title) ?> - Navkar Plywood</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Inter, sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; background: #FAFAFA; color: #111;
  }
  .box {
    text-align: center; padding: 2.5rem 2rem;
    background: #fff; border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    max-width: 400px; width: 90%;
  }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h1 { color: #C62828; font-size: 1.4rem; margin-bottom: 0.75rem; }
  p { color: #6B7280; font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.5rem; }
  a { color: #C62828; text-decoration: none; font-weight: 600; }
  a:hover { text-decoration: underline; }
  .logo { font-size: 0.85rem; color: #9CA3AF; margin-top: 1.5rem; }
</style>
</head>
<body>
<div class="box">
  <div class="icon">📦</div>
  <h1><?= htmlspecialchars($title) ?></h1>
  <p><?= $message ?></p>
  <p>Visit <a href="https://navkarplywood.com">navkarplywood.com</a></p>
  <p class="logo">Navkar Plywood &bull; Quality You Can Trust</p>
</div>
</body>
</html>
    <?php
    exit();
}
