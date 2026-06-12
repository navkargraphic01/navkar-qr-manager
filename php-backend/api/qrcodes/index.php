<?php
// ============================================================
// GET  /api/qrcodes          — List all QR codes (paginated)
// POST /api/qrcodes          — Create new QR code
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/QRCodeGenerator.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();

// ============================================================
// GET — List QR codes with pagination, search, filter
// ============================================================
if (is_method('GET')) {
    $page        = max(1, (int) query('page', 1));
    $limit       = min(100, max(1, (int) query('limit', 20)));
    $offset      = ($page - 1) * $limit;
    $search      = query('search', '');
    $status      = query('status', '');
    $category_id = query('category_id', '');
    $sort        = in_array(query('sort'), ['created_at','product_name','scan_count','updated_at']) ? query('sort') : 'created_at';
    $order       = query('order', 'desc') === 'asc' ? 'ASC' : 'DESC';

    $where  = ['1=1'];
    $params = [];

    if ($search) {
        $like     = '%' . $search . '%';
        $where[]  = '(q.product_name LIKE ? OR q.product_code LIKE ? OR q.qr_id LIKE ?)';
        $params[] = $like; $params[] = $like; $params[] = $like;
    }
    if ($status && in_array($status, ['active','inactive','draft'])) {
        $where[]  = 'q.status = ?';
        $params[] = $status;
    }
    if ($category_id) {
        $where[]  = 'q.category_id = ?';
        $params[] = $category_id;
    }

    $whereSQL = implode(' AND ', $where);

    // Count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM qr_codes q WHERE $whereSQL");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Data
    $stmt = $db->prepare("
        SELECT q.*,
               c.id   AS cat_id,
               c.name AS cat_name,
               c.color AS cat_color
        FROM qr_codes q
        LEFT JOIN categories c ON c.id = q.category_id
        WHERE $whereSQL
        ORDER BY q.$sort $order
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Reshape category
    $rows = array_map(function($r) {
        $cat = null;
        if ($r['cat_id']) {
            $cat = ['id' => $r['cat_id'], 'name' => $r['cat_name'], 'color' => $r['cat_color']];
        }
        unset($r['cat_id'], $r['cat_name'], $r['cat_color']);
        $r['categories']  = $cat;
        $r['metadata']    = $r['metadata'] ? json_decode($r['metadata'], true) : [];
        return $r;
    }, $rows);

    Response::paginated($rows, $total, $page, $limit);
}

// ============================================================
// POST — Create new QR code
// ============================================================
if (is_method('POST')) {
    $product_name        = trim(body('product_name', ''));
    $product_code        = strtoupper(trim(body('product_code', '')));
    $destination_url     = trim(body('destination_url', ''));
    $category_id         = body('category_id');
    $description         = body('description');
    $batch_number        = body('batch_number');
    $warranty_pdf_url    = body('warranty_pdf_url');
    $installation_pdf_url= body('installation_pdf_url');
    $product_image_url   = body('product_image_url');
    $status              = body('status', 'active');
    $template_id         = body('template_id');
    $metadata            = body('metadata', []);

    // Validate
    if (!$product_name)    Response::error('product_name is required', 400);
    if (!$product_code)    Response::error('product_code is required', 400);
    if (!$destination_url) Response::error('destination_url is required', 400);
    if (!filter_var($destination_url, FILTER_VALIDATE_URL)) Response::error('destination_url must be a valid URL', 400);
    if (!in_array($status, ['active','inactive','draft'])) $status = 'active';

    // Generate QR ID
    $qr_id  = generate_qr_id();
    $qr_url = QR_BASE_URL . '/p/' . $qr_id;

    // Generate QR image as base64 data URL
    $qr_image_b64 = QRCodeGenerator::toDataURL($qr_url, QR_IMAGE_SIZE);

    $id = generate_uuid();
    $stmt = $db->prepare("
        INSERT INTO qr_codes
          (id, qr_id, product_name, product_code, destination_url,
           category_id, description, batch_number, warranty_pdf_url,
           installation_pdf_url, product_image_url, status, template_id,
           metadata, created_by, updated_by)
        VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?)
    ");
    $stmt->execute([
        $id, $qr_id, $product_name, $product_code, $destination_url,
        $category_id ?: null, $description ?: null, $batch_number ?: null, $warranty_pdf_url ?: null,
        $installation_pdf_url ?: null, $product_image_url ?: null, $status, $template_id ?: null,
        json_encode($metadata ?: []), $user['id'], $user['id']
    ]);

    // Fetch with category
    $row = $db->prepare("
        SELECT q.*, c.id AS cat_id, c.name AS cat_name, c.color AS cat_color
        FROM qr_codes q LEFT JOIN categories c ON c.id = q.category_id
        WHERE q.id = ?
    ");
    $row->execute([$id]);
    $data = $row->fetch();
    $cat  = $data['cat_id'] ? ['id'=>$data['cat_id'],'name'=>$data['cat_name'],'color'=>$data['cat_color']] : null;
    unset($data['cat_id'],$data['cat_name'],$data['cat_color']);
    $data['categories']       = $cat;
    $data['qr_image_base64']  = $qr_image_b64;
    $data['qr_url']           = $qr_url;
    $data['metadata']         = json_decode($data['metadata'], true) ?? [];

    Response::success($data, 201);
}

Response::error('Method not allowed', 405);
