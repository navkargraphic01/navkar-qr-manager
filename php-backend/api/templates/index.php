<?php
// ============================================================
// GET    /api/templates/index.php        — List templates
// POST   /api/templates/index.php        — Create template
// GET    /api/templates/index.php?id=:id — Get single template
// PUT    /api/templates/index.php?id=:id — Update template
// DELETE /api/templates/index.php?id=:id — Delete template
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();
$id   = query('id', '');

if (is_method('GET') && !$id) {
    $rows = $db->query("SELECT * FROM qr_templates ORDER BY created_at")->fetchAll();
    $rows = array_map(function($r) {
        $r['template_data'] = json_decode($r['template_data'], true);
        return $r;
    }, $rows);
    Response::success($rows);
}

if (is_method('GET') && $id) {
    $stmt = $db->prepare("SELECT * FROM qr_templates WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) Response::not_found('Template not found');
    $row['template_data'] = json_decode($row['template_data'], true);
    Response::success($row);
}

if (is_method('POST')) {
    $name          = trim(body('name', ''));
    $description   = body('description', '');
    $template_data = body('template_data', []);
    $category      = body('category', 'custom');

    if (!$name)          Response::error('name is required', 400);
    if (!$template_data) Response::error('template_data is required', 400);
    if (!in_array($category, ['classic','premium','industrial','minimal','custom'])) $category = 'custom';

    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name)) . '-' . time();
    $newId = generate_uuid();

    $db->prepare("
        INSERT INTO qr_templates (id, name, slug, description, template_data, category, created_by)
        VALUES (?,?,?,?,?,?,?)
    ")->execute([$newId, $name, $slug, $description, json_encode($template_data), $category, $user['id']]);

    $stmt = $db->prepare("SELECT * FROM qr_templates WHERE id = ?");
    $stmt->execute([$newId]);
    $row = $stmt->fetch();
    $row['template_data'] = json_decode($row['template_data'], true);
    Response::success($row, 201);
}

if ((is_method('PUT') || is_method('PATCH')) && $id) {
    $stmt = $db->prepare("SELECT * FROM qr_templates WHERE id = ? AND is_system = 0");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) Response::error('Template not found or cannot modify system template', 404);

    $fields = [];
    $params = [];
    foreach (['name','description','category'] as $f) {
        $v = body($f);
        if ($v !== null) { $fields[] = "$f = ?"; $params[] = $v; }
    }
    $td = body('template_data');
    if ($td !== null) { $fields[] = "template_data = ?"; $params[] = json_encode($td); }

    if ($fields) {
        $params[] = $id;
        $db->prepare("UPDATE qr_templates SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    }

    $stmt = $db->prepare("SELECT * FROM qr_templates WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $row['template_data'] = json_decode($row['template_data'], true);
    Response::success($row);
}

if (is_method('DELETE') && $id) {
    $db->prepare("DELETE FROM qr_templates WHERE id = ? AND is_system = 0")->execute([$id]);
    Response::json(['message' => 'Deleted']);
}

Response::error('Method not allowed or missing ID', 405);
