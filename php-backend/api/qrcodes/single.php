<?php
// ============================================================
// GET    /api/qrcodes/single.php?id=:id  — Get single QR
// PUT    /api/qrcodes/single.php?id=:id  — Update QR
// DELETE /api/qrcodes/single.php?id=:id  — Delete QR
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../lib/QRCodeGenerator.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();
$id   = query('id', '');

if (!$id) Response::error('Missing QR code ID', 400);

// Helper: fetch QR with category & url_history
function fetch_qr(PDO $db, string $id): ?array {
    $stmt = $db->prepare("
        SELECT q.*, c.id AS cat_id, c.name AS cat_name, c.color AS cat_color
        FROM qr_codes q LEFT JOIN categories c ON c.id = q.category_id
        WHERE q.id = ? OR q.qr_id = ?
        LIMIT 1
    ");
    $stmt->execute([$id, $id]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $cat = $row['cat_id'] ? ['id'=>$row['cat_id'],'name'=>$row['cat_name'],'color'=>$row['cat_color']] : null;
    unset($row['cat_id'],$row['cat_name'],$row['cat_color']);
    $row['categories'] = $cat;
    $row['metadata']   = $row['metadata'] ? json_decode($row['metadata'], true) : [];

    // URL history
    $histStmt = $db->prepare("
        SELECT h.*, u.full_name AS changed_by_name
        FROM url_history h
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.qr_code_id = ?
        ORDER BY h.changed_at DESC
        LIMIT 50
    ");
    $histStmt->execute([$id]);
    $row['url_history'] = $histStmt->fetchAll();

    return $row;
}

// ============================================================
// GET
// ============================================================
if (is_method('GET')) {
    $data = fetch_qr($db, $id);
    if (!$data) Response::not_found('QR code not found');
    Response::success($data);
}

// ============================================================
// PUT/PATCH — Update
// ============================================================
if (is_method('PUT') || is_method('PATCH')) {
    $stmt = $db->prepare("SELECT * FROM qr_codes WHERE id = ? OR qr_id = ?");
    $stmt->execute([$id, $id]);
    $existing = $stmt->fetch();
    if (!$existing) Response::not_found('QR code not found');
    
    // We must use the true UUID for updates/inserts to related tables
    $uuid = $existing['id'];

    $allowed = ['product_name','product_code','destination_url','category_id',
                'description','batch_number','warranty_pdf_url','installation_pdf_url',
                'product_image_url','status','template_id','metadata'];

    $fields = [];
    $params = [];

    foreach ($allowed as $field) {
        $val = body($field);
        if ($val !== null) {
            if ($field === 'status' && !in_array($val, ['active','inactive','draft'])) continue;
            if ($field === 'product_code') $val = strtoupper(trim($val));
            if ($field === 'metadata') $val = json_encode($val);
            $fields[] = "$field = ?";
            $params[] = $val;
        }
    }

    if (empty($fields)) Response::error('No fields to update', 400);

    // Track URL change in history
    $newUrl = body('destination_url');
    if ($newUrl && $newUrl !== $existing['destination_url']) {
        $histId = generate_uuid();
        $db->prepare("
            INSERT INTO url_history (id, qr_code_id, old_url, new_url, change_reason, changed_by)
            VALUES (?,?,?,?,?,?)
        ")->execute([
            $histId, $uuid,
            $existing['destination_url'], $newUrl,
            body('change_reason'), $user['id']
        ]);
    }

    $fields[] = 'updated_by = ?';
    $params[] = $user['id'];
    $params[] = $uuid;

    $db->prepare("UPDATE qr_codes SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

    $data = fetch_qr($db, $uuid);
    Response::success($data);
}

// ============================================================
// DELETE
// ============================================================
if (is_method('DELETE')) {
    $stmt = $db->prepare("SELECT id FROM qr_codes WHERE id = ? OR qr_id = ?");
    $stmt->execute([$id, $id]);
    $existing = $stmt->fetch();
    if (!$existing) Response::not_found('QR code not found');
    $uuid = $existing['id'];

    $db->prepare("DELETE FROM qr_codes WHERE id = ?")->execute([$uuid]);
    Response::json(['message' => 'QR code deleted successfully']);
}

Response::error('Method not allowed', 405);
