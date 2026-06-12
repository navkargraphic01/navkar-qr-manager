<?php
// ============================================================
// POST /api/auth/logout — Invalidate session (client-side only)
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();

// JWT is stateless; just confirm to client they can delete token
Response::json(['message' => 'Logged out successfully']);
