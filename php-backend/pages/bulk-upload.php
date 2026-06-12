<?php
$pageTitle  = 'Bulk Upload';
$pageScript = 'bulk-upload.js';
require_once __DIR__ . '/../includes/auth_check.php';
try {
    $db   = db();
    $tpls = $db->query("SELECT id, name FROM qr_templates ORDER BY name")->fetchAll();
} catch (Exception $e) { $tpls = []; }
require_once __DIR__ . '/../includes/layout_header.php';
require_once __DIR__ . '/../includes/layout_sidebar.php';
?>

<header class="topbar">
  <button class="icon-btn" id="mob-menu" style="display:none">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
  <div>
    <div class="topbar-title">Bulk Upload</div>
    <div class="topbar-sub">Import multiple QR codes from Excel or CSV</div>
  </div>
  <div class="topbar-actions">
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
    <button id="download-template-btn" class="btn btn-outline btn-sm">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download Template
    </button>
  </div>
</header>

<main class="page-body">

  <!-- Info banner -->
  <div class="info-box flex items-center gap-3 mb-4 anim">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <div>
      <strong>Required columns:</strong> Product Name, Destination URL &nbsp;·&nbsp;
      <strong>Optional:</strong> Product Code, Category, Description &nbsp;·&nbsp;
      Max 500 rows per upload · Supports .xlsx, .xls, .csv
    </div>
  </div>

  <!-- Drop Zone -->
  <div class="card card-p mb-4 anim anim-1">
    <div id="drop-zone" class="dropzone" onclick="document.getElementById('file-input').click()">
      <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
        style="color:var(--muted);margin-bottom:12px">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      </svg>
      <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">
        Drop your Excel or CSV file here
      </div>
      <div class="text-muted text-sm">or click to browse · Max 10MB · Supports .xlsx, .xls, .csv</div>
      <div id="file-name" class="badge badge-primary mt-3" style="display:none"></div>
    </div>
  </div>

  <!-- Preview Table (hidden until file selected) -->
  <div id="preview-section" style="display:none" class="mb-4 anim">
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <div style="font-weight:800;color:var(--text)">File Preview</div>
          <div class="text-muted text-sm">Showing first 5 rows · <span id="total-rows">0</span> total data rows detected</div>
        </div>
        <button id="clear-file-btn" class="btn btn-outline btn-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear File
        </button>
      </div>
      <div style="overflow-x:auto">
        <table class="dtable" id="preview-table">
          <thead id="preview-head"></thead>
          <tbody id="preview-body"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Upload Options (hidden until file selected) -->
  <div id="upload-options" style="display:none" class="grid grid-2 mb-4 anim">
    <div class="card card-p">
      <label class="form-label">Apply Design Template</label>
      <select id="template-select" class="form-control">
        <option value="">Classic White (Default)</option>
        <option value="wood-premium">Champagne Gold (Preset)</option>
        <option value="industrial-dark">Industrial Dark (Preset)</option>
        <?php foreach ($tpls as $t): ?>
        <option value="<?= $t['id'] ?>"><?= htmlspecialchars($t['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <div class="form-hint">Template applied to all QR codes in this batch.</div>
    </div>
    <div class="card card-p">
      <label class="form-label">Default Status</label>
      <select id="status-select" class="form-control">
        <option value="active">Active (Live immediately)</option>
        <option value="inactive">Inactive (Review first)</option>
      </select>
      <div class="form-hint">Override status for all uploaded codes.</div>
    </div>
  </div>

  <!-- Upload Button -->
  <div id="upload-action" style="display:none" class="mb-4">
    <button id="upload-btn" class="btn btn-primary btn-lg btn-full">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
      Upload & Create QR Codes
    </button>
  </div>

  <!-- Progress -->
  <div id="progress-section" style="display:none" class="card card-p mb-4 anim">
    <div class="flex justify-between text-sm mb-2">
      <span style="font-weight:700;color:var(--text)">Processing...</span>
      <span id="progress-pct" style="color:var(--muted);font-variant-numeric:tabular-nums">0%</span>
    </div>
    <div class="progress-track"><div class="progress-fill" id="progress-bar" style="width:0%"></div></div>
    <div class="text-muted text-xs mt-2" id="progress-detail">Preparing...</div>
  </div>

  <!-- Results -->
  <div id="results-section" style="display:none" class="anim">
    <div class="card card-p mb-3">
      <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:14px">Upload Results</div>
      <div class="grid grid-3 mb-4">
        <div style="text-align:center;padding:16px;background:var(--success-bg);border-radius:10px">
          <div style="font-size:28px;font-weight:900;color:var(--success)" id="res-success">0</div>
          <div class="text-sm" style="color:var(--success)">Created</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--danger-bg);border-radius:10px">
          <div style="font-size:28px;font-weight:900;color:var(--danger)" id="res-errors">0</div>
          <div class="text-sm" style="color:var(--danger)">Errors</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--bg2);border-radius:10px">
          <div style="font-size:28px;font-weight:900;color:var(--text)" id="res-total">0</div>
          <div class="text-sm text-muted">Total Rows</div>
        </div>
      </div>
      <div class="flex gap-3">
        <a href="<?= SITE_BASE ?>/qr-codes" class="btn btn-primary">View All QR Codes</a>
        <button id="upload-more-btn" class="btn btn-outline">Upload More</button>
      </div>
    </div>
    <div id="error-list" style="display:none" class="table-wrap">
      <div class="table-toolbar"><div style="font-weight:700;color:var(--danger)">Error Details</div></div>
      <table class="dtable"><thead><tr><th>Row</th><th>Product</th><th>Error</th></tr></thead>
        <tbody id="error-tbody"></tbody>
      </table>
    </div>
  </div>

</main>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
