<?php
// GET /api/bulk/job_status.php?id=:jobId — Check bulk job status
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';
apply_cors_headers();
$user  = authenticate();
$db    = db();
$jobId = query('id', '');
if (!$jobId) Response::error('Missing job ID', 400);
$stmt  = $db->prepare("SELECT * FROM bulk_upload_jobs WHERE id = ?");
$stmt->execute([$jobId]);
$job   = $stmt->fetch();
if (!$job) Response::not_found('Job not found');
$job['errors'] = $job['errors'] ? json_decode($job['errors'], true) : [];
Response::success($job);
