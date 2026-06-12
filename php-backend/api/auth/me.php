<?php
// ============================================================
// GET /api/auth/me — Return current user info
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();

if (!is_method('GET')) Response::error('Method not allowed', 405);

$user = authenticate();

Response::success($user);
