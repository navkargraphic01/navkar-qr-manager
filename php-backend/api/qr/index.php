<?php
// api/qr/index.php — QR Codes CRUD endpoint
// Handles: GET /api/qr, POST /api/qr
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/JWT.php';

$user   = JWT::requireAuth();
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// ─── GET /api/qr — List with search/filter/pagination ─────
if ($method === 'GET') {
    $search   = $_GET['search']   ?? '';
    $status   = $_GET['status']   ?? '';
    $sort     = $_GET['sort']     ?? 'created_at';
    $page     = max(1, (int)($_GET['page']     ?? 1));
    $perPage  = max(1, min(100, (int)($_GET['per_page'] ?? 15)));
    $limit    = (int)($_GET['limit'] ?? 0);

    // Safe sort whitelist
    $sortMap = [
        'created_at'  => 'q.created_at DESC',
        'scan_count'  => 'q.scan_count DESC',
        'product_name'=> 'q.product_name ASC',
    ];
    $orderBy = $sortMap[$sort] ?? 'q.created_at DESC';

    $where  = ['1=1'];
    $params = [];

    if ($search) {
        $where[]  = '(q.product_name LIKE ? OR q.qr_id LIKE ? OR q.product_code LIKE ?)';
        $like     = '%' . $search . '%';
        $params[] = $like; $params[] = $like; $params[] = $like;
    }
    if ($status) {
        $where[]  = 'q.status = ?';
        $params[] = $status;
    }

    $whereStr = implode(' AND ', $where);

    // Count
    $cStmt = $db->prepare("SELECT COUNT(*) FROM qr_codes q WHERE $whereStr");
    $cStmt->execute($params);
    $total = (int)$cStmt->fetchColumn();

    // If limit param provided (for dashboard), skip pagination
    if ($limit > 0) {
        $params[] = $limit;
        $stmt = $db->prepare("
            SELECT q.id, q.qr_id, q.product_name, q.product_code,
                   q.destination_url, q.status, q.scan_count,
                   q.created_at, q.updated_at
            FROM qr_codes q WHERE $whereStr ORDER BY $orderBy LIMIT ?
        ");
        $stmt->execute($params);
        Response::json(['qr_codes' => $stmt->fetchAll(), 'total' => $total]);
    }

    $pages  = max(1, (int)ceil($total / $perPage));
    $offset = ($page - 1) * $perPage;
    $params[] = $perPage; $params[] = $offset;

    $stmt = $db->prepare("
        SELECT q.id, q.qr_id, q.product_name, q.product_code,
               q.destination_url, q.status, q.scan_count,
               q.created_at, q.updated_at
        FROM qr_codes q WHERE $whereStr ORDER BY $orderBy LIMIT ? OFFSET ?
    ");
    $stmt->execute($params);

    Response::json([
        'qr_codes' => $stmt->fetchAll(),
        'total'    => $total,
        'page'     => $page,
        'pages'    => $pages,
        'per_page' => $perPage,
    ]);
}

// ─── POST /api/qr — Create ────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $name = trim($body['product_name']    ?? '');
    $url  = trim($body['destination_url'] ?? '');

    if (!$name) Response::error('Product name is required', 400);
    if (!$url)  Response::error('Destination URL is required', 400);
    if (!filter_var($url, FILTER_VALIDATE_URL)) Response::error('Invalid destination URL', 400);

    // Generate unique QR ID
    $prefix = 'NP';
    try {
        $s = $db->query("SELECT setting_value FROM settings WHERE setting_key='qr_prefix' LIMIT 1");
        $p = $s->fetchColumn();
        if ($p) $prefix = strtoupper($p);
    } catch (\Exception $e) {}

    $qrId = null;
    for ($i = 0; $i < 20; $i++) {
        $candidate = $prefix . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $exists    = $db->prepare("SELECT id FROM qr_codes WHERE qr_id=? LIMIT 1");
        $exists->execute([$candidate]);
        if (!$exists->fetch()) { $qrId = $candidate; break; }
    }
    if (!$qrId) Response::error('Could not generate unique QR ID', 500);

    $stmt = $db->prepare("
        INSERT INTO qr_codes (qr_id, product_name, product_code, destination_url,
                              category_id, description, template_id, status, created_by, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,NOW())
    ");
    $stmt->execute([
        $qrId,
        $name,
        $body['product_code'] ?? null,
        $url,
        $body['category_id']  ?? null,
        $body['description']  ?? null,
        $body['template_id']  ?? null,
        $body['status']       ?? 'active',
        $user['user_id']      ?? null,
    ]);
    $newId = $db->lastInsertId();

    // Record initial URL in history
    try {
        $db->prepare("INSERT INTO qr_url_history (qr_code_id, url, changed_by, changed_at) VALUES (?,?,?,NOW())")
           ->execute([$newId, $url, $user['user_id'] ?? null]);
    } catch (\Exception $e) {}

    http_response_code(201);
    Response::json(['qr_id' => $qrId, 'id' => $newId, 'message' => 'QR code created']);
}

Response::error('Method not allowed', 405);
