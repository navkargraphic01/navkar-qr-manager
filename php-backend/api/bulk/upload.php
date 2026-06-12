<?php
// ============================================================
// POST /api/bulk/upload.php  — Bulk CSV/Excel upload
// ============================================================
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/Response.php';
require_once __DIR__ . '/../../middleware/auth.php';

apply_cors_headers();
$user = authenticate();
$db   = db();

if (!is_method('POST')) Response::error('Method not allowed', 405);

if (empty($_FILES['file'])) {
    Response::error('No file uploaded', 400);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    Response::error('File upload error: ' . $file['error'], 400);
}

$maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    Response::error('File too large. Max: ' . MAX_UPLOAD_MB . 'MB', 400);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['csv', 'xlsx', 'xls'])) {
    Response::error('Only CSV, XLSX, XLS files are allowed', 400);
}

// Parse CSV or Excel
$rows = [];
if ($ext === 'csv') {
    $rows = parse_csv($file['tmp_name']);
} else {
    $rows = parse_excel($file['tmp_name'], $ext);
}

if (count($rows) < 2) {
    Response::error('File is empty or has no data rows', 400);
}

// Parse headers
$headers = array_map(fn($h) => strtolower(trim((string)$h)), $rows[0]);
$dataRows = array_slice($rows, 1);
$dataRows = array_filter($dataRows, fn($r) => !empty(array_filter($r, fn($c) => $c !== '' && $c !== null)));
$dataRows = array_values($dataRows);

$nameCol = find_col($headers, ['product name','name','product_name']);
$codeCol = find_col($headers, ['product code','code','sku','product_code']);
$urlCol  = find_col($headers, ['destination url','url','link','destination_url']);
$catCol  = find_col($headers, ['category']);
$descCol = find_col($headers, ['description']);
$batchCol= find_col($headers, ['batch','batch_number']);

if ($nameCol === null || $codeCol === null || $urlCol === null) {
    Response::error('Missing required columns', 400, [
        'required' => ['Product Name', 'Product Code', 'Destination URL'],
        'detected' => $headers
    ]);
}

// Create job record
$jobId = generate_uuid();
$db->prepare("
    INSERT INTO bulk_upload_jobs (id, filename, total_records, status, started_at, created_by)
    VALUES (?,?,?,'processing',NOW(),?)
")->execute([$jobId, $file['name'], count($dataRows), $user['id']]);

// Return job ID immediately (processing happens in background via ignore_user_abort)
Response::json([
    'message'       => 'Upload started',
    'job_id'        => $jobId,
    'total_records' => count($dataRows),
]);

// Continue processing after response is sent
ignore_user_abort(true);
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request(); // Send response now (PHP-FPM)
} else {
    ob_flush(); flush();
}

// Process rows
$errors = [];
$success = 0;

foreach ($dataRows as $i => $row) {
    $rowNum      = $i + 2;
    $productName = trim((string)($row[$nameCol]  ?? ''));
    $productCode = strtoupper(trim((string)($row[$codeCol] ?? '')));
    $destUrl     = trim((string)($row[$urlCol]   ?? ''));

    if (!$productName || !$productCode || !$destUrl) {
        $errors[] = ['row' => $rowNum, 'error' => 'Missing required fields'];
        continue;
    }
    if (!filter_var($destUrl, FILTER_VALIDATE_URL)) {
        $errors[] = ['row' => $rowNum, 'product_name' => $productName, 'error' => 'Invalid URL'];
        continue;
    }

    try {
        $qrId = generate_qr_id();
        $newId= generate_uuid();
        $db->prepare("
            INSERT INTO qr_codes (id, qr_id, product_name, product_code, destination_url,
                                  description, batch_number, status, created_by, updated_by)
            VALUES (?,?,?,?,?, ?,?,?,?,?)
        ")->execute([
            $newId, $qrId, $productName, $productCode, $destUrl,
            $descCol  !== null ? trim((string)($row[$descCol]  ?? '')) : null,
            $batchCol !== null ? trim((string)($row[$batchCol] ?? '')) : null,
            'active', $user['id'], $user['id']
        ]);
        $success++;
    } catch (Exception $e) {
        $errors[] = ['row' => $rowNum, 'error' => $e->getMessage()];
    }

    // Update progress every 10 rows
    if ($i % 10 === 0) {
        $db->prepare("UPDATE bulk_upload_jobs SET processed_records=?, success_count=?, error_count=? WHERE id=?")
           ->execute([$i + 1, $success, count($errors), $jobId]);
    }
}

// Mark complete
$db->prepare("
    UPDATE bulk_upload_jobs
    SET status='completed', processed_records=?, success_count=?, error_count=?, errors=?, completed_at=NOW()
    WHERE id=?
")->execute([count($dataRows), $success, count($errors), json_encode(array_slice($errors, 0, 100)), $jobId]);

// ============================================================
// CSV Parser
// ============================================================
function parse_csv(string $path): array {
    $rows = [];
    if (($fh = fopen($path, 'r')) === false) return $rows;
    while (($row = fgetcsv($fh)) !== false) {
        $rows[] = $row;
    }
    fclose($fh);
    return $rows;
}

// ============================================================
// Simple Excel (XLSX) Parser — pure PHP, no Composer
// Uses ZipArchive to read the XML inside .xlsx
// ============================================================
function parse_excel(string $path, string $ext): array {
    if ($ext === 'xlsx') {
        return parse_xlsx($path);
    }
    // .xls not supported without library, fallback to CSV interpretation
    return [];
}

function parse_xlsx(string $path): array {
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) return [];

    // Read shared strings
    $strings = [];
    $sst = $zip->getFromName('xl/sharedStrings.xml');
    if ($sst) {
        preg_match_all('/<t[^>]*>([^<]*)<\/t>/', $sst, $m);
        $strings = $m[1];
    }

    // Read sheet1
    $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheet) return [];

    $rows = [];
    preg_match_all('/<row[^>]*>(.*?)<\/row>/s', $sheet, $rowMatches);

    foreach ($rowMatches[1] as $rowXml) {
        $cells = [];
        preg_match_all('/<c[^>]*r="([^"]+)"[^>]*t="([^"]*)"[^>]*>(.*?)<\/c>/s', $rowXml, $cellMatches, PREG_SET_ORDER);

        // Handle cells without t attribute (numbers)
        preg_match_all('/<c[^>]*r="([^"]+)"(?![^>]*t=)[^>]*>(.*?)<\/c>/s', $rowXml, $numMatches, PREG_SET_ORDER);

        $colValues = [];
        foreach ($cellMatches as $cm) {
            $col = preg_replace('/[0-9]/', '', $cm[1]);
            $type = $cm[2];
            preg_match('/<v>([^<]*)<\/v>/', $cm[3], $vm);
            $val = $vm[1] ?? '';
            if ($type === 's') $val = html_entity_decode($strings[(int)$val] ?? '');
            $colValues[col_to_num($col)] = $val;
        }
        foreach ($numMatches as $nm) {
            $col = preg_replace('/[0-9]/', '', $nm[1]);
            preg_match('/<v>([^<]*)<\/v>/', $nm[2], $vm);
            $colValues[col_to_num($col)] = $vm[1] ?? '';
        }

        if ($colValues) {
            ksort($colValues);
            $max = max(array_keys($colValues));
            $row = [];
            for ($i = 0; $i <= $max; $i++) {
                $row[] = $colValues[$i] ?? '';
            }
            $rows[] = $row;
        }
    }
    return $rows;
}

function col_to_num(string $col): int {
    $col = strtoupper($col);
    $n = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $n = $n * 26 + (ord($col[$i]) - 64);
    }
    return $n - 1;
}

function find_col(array $headers, array $names): ?int {
    foreach ($names as $name) {
        foreach ($headers as $i => $h) {
            if (str_contains($h, $name)) return $i;
        }
    }
    return null;
}
