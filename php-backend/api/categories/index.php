<?php
// ============================================================
// GET  /api/categories/index.php  — List categories
// POST /api/categories/index.php  — Create category
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();

if (is_method('GET')) {
    $rows = $db->query("SELECT * FROM categories ORDER BY name")->fetchAll();
    Response::success($rows);
}

if (is_method('POST')) {
    $name        = trim(body('name', ''));
    $description = body('description', '');
    $color       = body('color', '#C62828');

    if (!$name) Response::error('name is required', 400);

    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
    $slug = trim($slug, '-');

    $id = generate_uuid();
    try {
        $db->prepare("
            INSERT INTO categories (id, name, slug, description, color, created_by)
            VALUES (?,?,?,?,?,?)
        ")->execute([$id, $name, $slug, $description, $color, $user['id']]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') Response::error('Category with this name already exists', 409);
        throw $e;
    }

    $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    Response::success($stmt->fetch(), 201);
}

Response::error('Method not allowed', 405);
