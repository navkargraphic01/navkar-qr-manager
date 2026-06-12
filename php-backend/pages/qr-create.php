<?php
$pageTitle  = 'Create QR Code';
$pageScript = 'qr-create.js';
require_once __DIR__ . '/../includes/auth_check.php';
// Fetch categories and templates for dropdowns
try {
    $db = db();
    $cats = $db->query("SELECT id, name FROM categories ORDER BY name")->fetchAll();
    $tpls = $db->query("SELECT id, name FROM qr_templates ORDER BY name")->fetchAll();
} catch (Exception $e) { $cats = []; $tpls = []; }
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
    <div class="topbar-title">Create QR Code</div>
    <div class="topbar-sub">
      <a href="<?= SITE_BASE ?>/qr-codes" style="color:var(--muted)">QR Codes</a>
      <span class="breadcrumb-sep"> / </span>
      <span class="breadcrumb-cur">New</span>
    </div>
  </div>
  <div class="topbar-actions">
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
  </div>
</header>

<main class="page-body">
  <div class="grid" style="grid-template-columns:1fr 340px;gap:24px;align-items:start">

    <!-- FORM -->
    <div class="card anim">
      <div class="card-p" style="border-bottom:1px solid var(--border)">
        <div style="font-size:16px;font-weight:800;color:var(--text)">Product Information</div>
        <div class="text-muted text-sm">Fill in the details. A unique QR ID will be auto-generated.</div>
      </div>
      <form id="create-form" class="card-p">
        <div class="form-group">
          <label class="form-label">Product Name <span class="req">*</span></label>
          <input id="product-name" name="product_name" type="text" class="form-control"
            placeholder="e.g. Navkar Premium Plywood 18mm" required>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Product Code / SKU</label>
            <input id="product-code" name="product_code" type="text" class="form-control"
              placeholder="e.g. NPL-18MM">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="category-id" name="category_id" class="form-control">
              <option value="">No Category</option>
              <?php foreach ($cats as $c): ?>
              <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Destination URL <span class="req">*</span></label>
          <input id="destination-url" name="destination_url" type="url" class="form-control"
            placeholder="https://navkarplywood.com/product-page" required>
          <div class="form-hint">The URL where the QR code will redirect when scanned.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="description" name="description" class="form-control" rows="3"
            placeholder="Optional product description..."></textarea>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Design Template</label>
            <select id="template-id" name="template_id" class="form-control">
              <option value="">Classic White (Default)</option>
              <option value="wood-premium">Champagne Gold</option>
              <option value="industrial-dark">Industrial Dark</option>
              <?php foreach ($tpls as $t): ?>
              <option value="<?= $t['id'] ?>"><?= htmlspecialchars($t['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Initial Status</label>
            <select id="status" name="status" class="form-control">
              <option value="active">Active (Live)</option>
              <option value="inactive">Inactive (Paused)</option>
            </select>
          </div>
        </div>

        <div class="divider"></div>
        <div class="flex gap-3 justify-end">
          <a href="<?= SITE_BASE ?>/qr-codes" class="btn btn-outline">Cancel</a>
          <button type="submit" id="submit-btn" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Create QR Code
          </button>
        </div>
      </form>
    </div>

    <!-- LIVE PREVIEW PANEL -->
    <div style="position:sticky;top:86px">
      <div class="card anim anim-2 card-p" style="text-align:center">
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px">Live Preview</div>
        <div class="qr-container" style="margin:0 auto;display:inline-flex">
          <div id="qr-preview-img" style="width:180px;height:180px;display:flex;align-items:center;justify-content:center">
            <div class="text-muted text-sm" style="text-align:center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;margin-bottom:8px">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0-3h3M17 20h3"/>
              </svg>
              <br>Enter product name to preview
            </div>
          </div>
          <div class="qr-id-label" id="preview-qr-id">——</div>
        </div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);text-align:left">
          <div class="text-muted text-xs mb-1">Product Name</div>
          <div style="font-weight:700;font-size:14px;color:var(--text)" id="preview-name">—</div>
          <div class="text-muted text-xs mt-2 mb-1">Destination URL</div>
          <div style="font-size:12px;color:var(--primary);word-break:break-all" id="preview-url">—</div>
          <div class="text-muted text-xs mt-2 mb-1">QR Scan URL</div>
          <div class="mono text-xs" style="color:var(--text2);word-break:break-all" id="preview-scan-url">Auto-generated on save</div>
        </div>
      </div>

      <!-- Success card (hidden) -->
      <div id="success-card" class="card card-p anim-scale" style="display:none;margin-top:16px;text-align:center">
        <div style="width:48px;height:48px;background:var(--success-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px;color:var(--success)">✓</div>
        <div style="font-weight:800;font-size:16px;color:var(--text);margin-bottom:4px">QR Code Created!</div>
        <div class="text-muted text-sm mb-4">ID: <span id="success-qr-id" class="mono text-primary-c font-bold"></span></div>
        <div class="flex flex-col gap-2">
          <button id="download-btn" class="btn btn-outline btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download QR PNG
          </button>
          <a id="view-link" href="#" class="btn btn-outline btn-sm">View & Edit</a>
          <button id="create-another-btn" class="btn btn-primary btn-sm">+ Create Another</button>
        </div>
      </div>
    </div>
  </div>
</main>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
